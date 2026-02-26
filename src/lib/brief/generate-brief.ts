// ============================================================
// TempoCasa CRM - Appointment Brief Generation
// Fetches all context for an appointment and generates a brief.
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { generateAISuggestions } from '@/lib/ai/placeholder';
import type { Lead, Property, Interaction, Match } from '@/types/database';

export interface AppointmentBrief {
  appointment: Interaction;
  lead: Lead;
  property: Property | null;
  interactions: Interaction[];
  match: Match | null;
  strengths: string[];
  objections: string[];
  aiSuggestions: string;
}

export async function generateBrief(
  interactionId: string,
): Promise<AppointmentBrief | null> {
  const supabase = await createClient();

  // 1. Fetch the appointment
  const { data: appointment } = await supabase
    .from('interactions')
    .select('*')
    .eq('id', interactionId)
    .single();
  if (!appointment) return null;

  // 2. Fetch the lead
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', appointment.lead_id)
    .single();
  if (!lead) return null;

  // 3. Fetch property if linked
  let property: Property | null = null;
  if (appointment.property_id) {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('id', appointment.property_id)
      .single();
    property = data as Property | null;
  }

  // 4. Fetch all interactions for this lead (chronological)
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: true });

  // 5. Fetch match if property linked
  let match: Match | null = null;
  if (property) {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('property_id', property.id)
      .maybeSingle();
    match = data as Match | null;
  }

  // 6. Calculate strengths and objections
  const strengths: string[] = [];
  const objections: string[] = [];

  if (property && lead) {
    // Price check
    if (lead.budget_max && property.price <= lead.budget_max) {
      strengths.push(
        `Nel budget (\u20AC${property.price.toLocaleString('it-IT')} vs max \u20AC${lead.budget_max.toLocaleString('it-IT')})`,
      );
    } else if (lead.budget_max && property.price > lead.budget_max) {
      const overPercent = Math.round(
        ((property.price - lead.budget_max) / lead.budget_max) * 100,
      );
      objections.push(
        `Sopra budget del ${overPercent}% (\u20AC${property.price.toLocaleString('it-IT')} vs max \u20AC${lead.budget_max.toLocaleString('it-IT')})`,
      );
    }

    // Must-have check
    if (lead.must_have && property.features) {
      const features = property.features.map((f) => f.toLowerCase());
      for (const must of lead.must_have) {
        if (features.includes(must.toLowerCase())) {
          strengths.push(`${must} presente`);
        } else {
          objections.push(`${must} non presente`);
        }
      }
    }

    // Sqm check
    if (lead.min_sqm && property.sqm) {
      if (property.sqm >= lead.min_sqm) {
        strengths.push(`${property.sqm} mq (cercava min ${lead.min_sqm})`);
      } else {
        objections.push(`${property.sqm} mq (cercava min ${lead.min_sqm})`);
      }
    }

    // Floor check
    if (property.floor !== null && property.floor > 0) {
      strengths.push(
        `Piano ${property.floor}${property.total_floors ? '/' + property.total_floors : ''}`,
      );
    }

    // Energy class
    if (property.energy_class) {
      if (['A4', 'A3', 'A2', 'A1', 'B'].includes(property.energy_class)) {
        strengths.push(`Classe energetica ${property.energy_class}`);
      } else if (['F', 'G'].includes(property.energy_class)) {
        objections.push(
          `Classe energetica ${property.energy_class} (bassa)`,
        );
      }
    }
  }

  // 7. Generate AI suggestions
  const aiSuggestions = await generateAISuggestions({
    lead: {
      full_name: lead.full_name,
      budget_min: lead.budget_min,
      budget_max: lead.budget_max,
      must_have: lead.must_have,
      notes: lead.notes,
    },
    property: property
      ? {
          price: property.price,
          sqm: property.sqm,
          features: property.features,
          address: property.address,
        }
      : null,
    interactions: (interactions || []).map((i) => ({
      type: i.type,
      summary: i.summary,
      outcome: i.outcome,
    })),
  });

  return {
    appointment: appointment as Interaction,
    lead: lead as Lead,
    property,
    interactions: (interactions || []) as Interaction[],
    match,
    strengths,
    objections,
    aiSuggestions,
  };
}
