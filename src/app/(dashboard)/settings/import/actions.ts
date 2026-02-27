'use server';

import { createClient } from '@/lib/supabase/server';
import type { ImportResult } from '@/components/import/preview-step';

const BATCH_SIZE = 50;

async function getAgentId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non autenticato');

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!agent) throw new Error('Profilo agente non trovato');
  return agent.id;
}

export async function importLeads(
  rows: Record<string, unknown>[]
): Promise<ImportResult> {
  const agentId = await getAgentId();
  const supabase = await createClient();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Process in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const leadsToInsert = batch.map((row, batchIdx) => {
      const rowNum = i + batchIdx + 1;
      try {
        return {
          agent_id: agentId,
          full_name: String(row.full_name || ''),
          phone: row.phone ? String(row.phone) : null,
          email: row.email ? String(row.email) : null,
          type: (['buyer', 'seller', 'both'].includes(String(row.type || ''))
            ? String(row.type)
            : 'buyer') as string,
          source: row.source ? String(row.source) : null,
          status: ([
            'new', 'contacted', 'qualified', 'active', 'proposal',
            'negotiation', 'closed_won', 'closed_lost', 'dormant',
          ].includes(String(row.status || ''))
            ? String(row.status)
            : 'new') as string,
          temperature: (['hot', 'warm', 'cold'].includes(String(row.temperature || ''))
            ? String(row.temperature)
            : 'warm') as string,
          search_zones: row.search_zones
            ? (row.search_zones as string[])
            : null,
          budget_min: row.budget_min ? Number(row.budget_min) : null,
          budget_max: row.budget_max ? Number(row.budget_max) : null,
          property_types: row.property_types
            ? (row.property_types as string[])
            : null,
          min_rooms: row.min_rooms ? Number(row.min_rooms) : null,
          min_sqm: row.min_sqm ? Number(row.min_sqm) : null,
          must_have: row.must_have ? (row.must_have as string[]) : null,
          nice_to_have: row.nice_to_have
            ? (row.nice_to_have as string[])
            : null,
          timeline: row.timeline ? String(row.timeline) : null,
          selling_address: row.selling_address
            ? String(row.selling_address)
            : null,
          selling_price_requested: row.selling_price_requested
            ? Number(row.selling_price_requested)
            : null,
          selling_price_estimated: row.selling_price_estimated
            ? Number(row.selling_price_estimated)
            : null,
          mandate_type: row.mandate_type ? String(row.mandate_type) : null,
          mandate_expiry: row.mandate_expiry
            ? String(row.mandate_expiry)
            : null,
          notes: row.notes ? String(row.notes) : null,
          score: 50,
        };
      } catch {
        errors.push(`Riga ${rowNum}: errore nella trasformazione dei dati`);
        return null;
      }
    });

    const validLeads = leadsToInsert.filter(
      (l): l is NonNullable<typeof l> => l !== null && !!l.full_name
    );
    skipped += leadsToInsert.length - validLeads.length;

    if (validLeads.length > 0) {
      const { error, data } = await supabase
        .from('leads')
        .insert(validLeads)
        .select('id');

      if (error) {
        errors.push(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`
        );
        skipped += validLeads.length;
      } else {
        imported += data?.length || 0;
      }
    }
  }

  return { imported, skipped, errors, total: rows.length };
}

export async function importProperties(
  rows: Record<string, unknown>[]
): Promise<ImportResult> {
  const agentId = await getAgentId();
  const supabase = await createClient();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const propertiesToInsert = batch.map((row, batchIdx) => {
      const rowNum = i + batchIdx + 1;
      try {
        return {
          agent_id: agentId,
          title: row.title ? String(row.title) : null,
          address: String(row.address || ''),
          city: String(row.city || ''),
          zone: row.zone ? String(row.zone) : null,
          property_type: row.property_type
            ? String(row.property_type)
            : 'Appartamento',
          price: row.price ? Number(row.price) : 0,
          sqm: row.sqm ? Number(row.sqm) : null,
          rooms: row.rooms ? Number(row.rooms) : null,
          bedrooms: row.bedrooms ? Number(row.bedrooms) : null,
          bathrooms: row.bathrooms ? Number(row.bathrooms) : null,
          floor: row.floor ? Number(row.floor) : null,
          total_floors: row.total_floors ? Number(row.total_floors) : null,
          year_built: row.year_built ? Number(row.year_built) : null,
          energy_class: row.energy_class ? String(row.energy_class) : null,
          features: row.features ? (row.features as string[]) : null,
          condition: row.condition ? String(row.condition) : null,
          heating: row.heating ? String(row.heating) : null,
          status: ([
            'draft', 'available', 'reserved', 'sold', 'withdrawn',
          ].includes(String(row.status || ''))
            ? String(row.status)
            : 'available') as string,
          photos: row.photos ? (row.photos as string[]) : null,
          virtual_tour_url: row.virtual_tour_url
            ? String(row.virtual_tour_url)
            : null,
          published_on: row.published_on
            ? (row.published_on as string[])
            : null,
          description: row.description ? String(row.description) : null,
          internal_notes: row.internal_notes
            ? String(row.internal_notes)
            : null,
        };
      } catch {
        errors.push(`Riga ${rowNum}: errore nella trasformazione dei dati`);
        return null;
      }
    });

    const validProperties = propertiesToInsert.filter(
      (p): p is NonNullable<typeof p> =>
        p !== null && !!p.address && !!p.city && p.price > 0
    );
    skipped += propertiesToInsert.length - validProperties.length;

    if (validProperties.length > 0) {
      const { error, data } = await supabase
        .from('properties')
        .insert(validProperties)
        .select('id');

      if (error) {
        errors.push(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`
        );
        skipped += validProperties.length;
      } else {
        imported += data?.length || 0;
      }
    }
  }

  return { imported, skipped, errors, total: rows.length };
}
