'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import type { CensusContactStatus } from '@/types/database';

export async function createCensusZone(formData: FormData) {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) redirect('/login');

  let agencyId = agent.agency_id;

  // Se l'agente non ha un'agenzia, creane una automaticamente
  if (!agencyId) {
    const { data: newAgency, error: agencyError } = await supabase
      .from('agencies')
      .insert({ name: `Agenzia di ${agent.full_name}` })
      .select()
      .single();

    if (agencyError || !newAgency) throw new Error('Errore nella creazione agenzia');

    // Associa l'agente all'agenzia
    await supabase
      .from('agents')
      .update({ agency_id: newAgency.id })
      .eq('id', agent.id);

    agencyId = newAgency.id;
  }

  const zone = {
    agency_id: agencyId,
    name: formData.get('name') as string,
    municipality_code: (formData.get('municipality_code') as string) || null,
    province: (formData.get('province') as string) || null,
    region: (formData.get('region') as string) || null,
  };

  const { data, error } = await supabase
    .from('census_zones')
    .insert(zone)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/censimento');
  redirect(`/censimento/${data.id}`);
}

export async function updateCensusContactStatus(
  unitId: string,
  status: CensusContactStatus,
  notes?: string,
  callbackDate?: string
) {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  // Update unit status
  const updates: Record<string, unknown> = {
    contact_status: status,
    last_contact_at: new Date().toISOString(),
  };
  if (notes) updates.notes = notes;
  if (callbackDate) updates.callback_date = callbackDate;

  const { error: unitError } = await supabase
    .from('census_units')
    .update(updates)
    .eq('id', unitId);

  if (unitError) return { error: unitError.message };

  // Map status to log outcome
  const outcomeMap: Record<string, string> = {
    contacted: 'info_gathered',
    interested: 'interested',
    not_interested: 'not_interested',
    callback: 'callback',
    not_contacted: 'no_answer',
    lead_created: 'interested',
  };

  // Write contact log
  const { error: logError } = await supabase.from('census_contact_log').insert({
    unit_id: unitId,
    agent_id: agent.id,
    contact_type: 'door',
    outcome: outcomeMap[status] || 'info_gathered',
    notes: notes || null,
    callback_date: callbackDate || null,
  });

  if (logError) return { error: logError.message };

  revalidatePath('/censimento');
  return { success: true };
}

export async function createLeadFromCensus(unitId: string, formData: FormData) {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  // Create the lead
  const lead = {
    agent_id: agent.id,
    full_name: formData.get('full_name') as string,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    type: 'seller' as const,
    source: 'censimento',
    temperature: 'warm' as const,
    selling_address: (formData.get('selling_address') as string) || null,
    selling_price_estimated: formData.get('selling_price_estimated')
      ? Number(formData.get('selling_price_estimated'))
      : null,
    notes: (formData.get('notes') as string) || null,
  };

  const { data: newLead, error: leadError } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();

  if (leadError) return { error: leadError.message };

  // Link unit to lead and update status
  const { error: unitError } = await supabase
    .from('census_units')
    .update({
      lead_id: newLead.id,
      contact_status: 'lead_created',
      last_contact_at: new Date().toISOString(),
    })
    .eq('id', unitId);

  if (unitError) return { error: unitError.message };

  // Write contact log
  await supabase.from('census_contact_log').insert({
    unit_id: unitId,
    agent_id: agent.id,
    contact_type: 'door',
    outcome: 'interested',
    notes: `Lead creato: ${newLead.full_name}`,
  });

  revalidatePath('/censimento');
  revalidatePath('/leads');
  redirect(`/leads/${newLead.id}`);
}
