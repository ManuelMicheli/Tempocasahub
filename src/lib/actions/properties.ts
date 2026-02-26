'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import type { PropertyStatus } from '@/types/database';
import { matchPropertyToLeads } from '@/lib/matching/run-matching';

function parseArrayField(value: string | null): string[] | null {
  if (!value) return null;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseMultilineField(value: string | null): string[] | null {
  if (!value) return null;
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  const property = {
    agent_id: agent.id,
    title: (formData.get('title') as string) || null,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    zone: (formData.get('zone') as string) || null,
    property_type: formData.get('property_type') as string,
    price: Number(formData.get('price')),
    sqm: formData.get('sqm') ? Number(formData.get('sqm')) : null,
    rooms: formData.get('rooms') ? Number(formData.get('rooms')) : null,
    bedrooms: formData.get('bedrooms') ? Number(formData.get('bedrooms')) : null,
    bathrooms: formData.get('bathrooms') ? Number(formData.get('bathrooms')) : null,
    floor: formData.get('floor') ? Number(formData.get('floor')) : null,
    total_floors: formData.get('total_floors') ? Number(formData.get('total_floors')) : null,
    year_built: formData.get('year_built') ? Number(formData.get('year_built')) : null,
    energy_class: (formData.get('energy_class') as string) || null,
    features: parseArrayField(formData.get('features') as string),
    condition: (formData.get('condition') as string) || null,
    heating: (formData.get('heating') as string) || null,
    status: (formData.get('status') as string) || 'available',
    photos: parseMultilineField(formData.get('photos') as string),
    virtual_tour_url: (formData.get('virtual_tour_url') as string) || null,
    published_on: parseArrayField(formData.get('published_on') as string),
    owner_lead_id: (formData.get('owner_lead_id') as string) || null,
    description: (formData.get('description') as string) || null,
    internal_notes: (formData.get('internal_notes') as string) || null,
  };

  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/properties');

  // Trigger matching for available properties
  if (data.status === 'available') {
    await matchPropertyToLeads(data.id);
  }

  redirect(`/properties/${data.id}`);
}

export async function updateProperty(id: string, formData: FormData) {
  const supabase = await createClient();

  const updates = {
    title: (formData.get('title') as string) || null,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    zone: (formData.get('zone') as string) || null,
    property_type: formData.get('property_type') as string,
    price: Number(formData.get('price')),
    sqm: formData.get('sqm') ? Number(formData.get('sqm')) : null,
    rooms: formData.get('rooms') ? Number(formData.get('rooms')) : null,
    bedrooms: formData.get('bedrooms') ? Number(formData.get('bedrooms')) : null,
    bathrooms: formData.get('bathrooms') ? Number(formData.get('bathrooms')) : null,
    floor: formData.get('floor') ? Number(formData.get('floor')) : null,
    total_floors: formData.get('total_floors') ? Number(formData.get('total_floors')) : null,
    year_built: formData.get('year_built') ? Number(formData.get('year_built')) : null,
    energy_class: (formData.get('energy_class') as string) || null,
    features: parseArrayField(formData.get('features') as string),
    condition: (formData.get('condition') as string) || null,
    heating: (formData.get('heating') as string) || null,
    status: (formData.get('status') as string) || 'available',
    photos: parseMultilineField(formData.get('photos') as string),
    virtual_tour_url: (formData.get('virtual_tour_url') as string) || null,
    published_on: parseArrayField(formData.get('published_on') as string),
    owner_lead_id: (formData.get('owner_lead_id') as string) || null,
    description: (formData.get('description') as string) || null,
    internal_notes: (formData.get('internal_notes') as string) || null,
  };

  const { error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/properties');
  revalidatePath(`/properties/${id}`);
  redirect(`/properties/${id}`);
}

export async function updatePropertyStatus(id: string, status: PropertyStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('properties')
    .update({ status })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/properties');
  revalidatePath(`/properties/${id}`);
  return { success: true };
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('properties').delete().eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/properties');
  redirect('/properties');
}
