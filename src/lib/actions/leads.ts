'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import type { LeadStatus } from '@/types/database';

function parseArrayField(value: string | null): string[] | null {
  if (!value) return null;
  const arr = value.split(',').map(s => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
}

function extractLeadFields(formData: FormData) {
  return {
    full_name: formData.get('full_name') as string,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    type: formData.get('type') as string,
    source: (formData.get('source') as string) || null,
    temperature: (formData.get('temperature') as string) || 'warm',
    search_zones: parseArrayField(formData.get('search_zones') as string),
    budget_min: formData.get('budget_min') ? Number(formData.get('budget_min')) : null,
    budget_max: formData.get('budget_max') ? Number(formData.get('budget_max')) : null,
    property_types: parseArrayField(formData.get('property_types') as string),
    min_rooms: formData.get('min_rooms') ? Number(formData.get('min_rooms')) : null,
    min_sqm: formData.get('min_sqm') ? Number(formData.get('min_sqm')) : null,
    must_have: parseArrayField(formData.get('must_have') as string),
    nice_to_have: parseArrayField(formData.get('nice_to_have') as string),
    timeline: (formData.get('timeline') as string) || null,
    selling_address: (formData.get('selling_address') as string) || null,
    selling_price_requested: formData.get('selling_price_requested') ? Number(formData.get('selling_price_requested')) : null,
    selling_price_estimated: formData.get('selling_price_estimated') ? Number(formData.get('selling_price_estimated')) : null,
    mandate_type: (formData.get('mandate_type') as string) || null,
    mandate_expiry: (formData.get('mandate_expiry') as string) || null,
    notes: (formData.get('notes') as string) || null,
  };
}

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  const fields = extractLeadFields(formData);
  const lead = {
    agent_id: agent.id,
    ...fields,
  };

  const { data, error } = await supabase.from('leads').insert(lead).select().single();
  if (error) return { error: error.message };

  revalidatePath('/leads');
  redirect(`/leads/${data.id}`);
}

export async function updateLead(id: string, formData: FormData) {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  const updates = extractLeadFields(formData);

  const { error } = await supabase.from('leads').update(updates).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/leads');
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from('leads').update({ status }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/leads');
  revalidatePath(`/leads/${id}`);
  return { success: true };
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/leads');
  redirect('/leads');
}
