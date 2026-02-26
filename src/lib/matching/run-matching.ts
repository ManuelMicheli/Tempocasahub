import { createClient } from '@/lib/supabase/server';
import { calculateMatchScore } from './calculate-match';
import type { Lead, Property } from '@/types/database';

// Match a property against all active buyer leads of the same agent
export async function matchPropertyToLeads(propertyId: string) {
  const supabase = await createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (!property || property.status !== 'available') return;

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('agent_id', property.agent_id)
    .in('type', ['buyer', 'both'])
    .not('status', 'in', '("closed_won","closed_lost")');

  if (!leads || leads.length === 0) return;

  const matches = [];
  for (const lead of leads) {
    const { score, breakdown } = calculateMatchScore(
      lead as Lead,
      property as Property
    );
    if (score >= 50) {
      matches.push({
        lead_id: lead.id,
        property_id: property.id,
        score,
        score_breakdown: breakdown,
        status: 'suggested' as const,
      });
    }
  }

  if (matches.length > 0) {
    await supabase
      .from('matches')
      .upsert(matches, { onConflict: 'lead_id,property_id' });
  }

  return matches.length;
}

// Match a lead against all available properties of the same agent
export async function matchLeadToProperties(leadId: string) {
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead || !['buyer', 'both'].includes(lead.type)) return;
  if (['closed_won', 'closed_lost'].includes(lead.status)) return;

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('agent_id', lead.agent_id)
    .eq('status', 'available');

  if (!properties || properties.length === 0) return;

  const matches = [];
  for (const property of properties) {
    const { score, breakdown } = calculateMatchScore(
      lead as Lead,
      property as Property
    );
    if (score >= 50) {
      matches.push({
        lead_id: lead.id,
        property_id: property.id,
        score,
        score_breakdown: breakdown,
        status: 'suggested' as const,
      });
    }
  }

  if (matches.length > 0) {
    await supabase
      .from('matches')
      .upsert(matches, { onConflict: 'lead_id,property_id' });
  }

  return matches.length;
}

// Recalculate all matches for an agent
export async function recalculateAllMatches(agentId: string) {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'available');

  if (!properties) return 0;

  let totalMatches = 0;
  for (const property of properties) {
    const count = await matchPropertyToLeads(property.id);
    totalMatches += count || 0;
  }

  return totalMatches;
}
