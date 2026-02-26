import { createClient } from '@/lib/supabase/server';
import { calculateLeadScore } from './calculate-lead-score';
import type { Lead, Interaction } from '@/types/database';

/**
 * Fetches a lead and all its interactions from the database,
 * recalculates the lead score, and persists the updated value.
 */
export async function updateLeadScore(leadId: string) {
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead) return;

  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  const score = calculateLeadScore(lead as Lead, (interactions || []) as Interaction[]);

  await supabase.from('leads').update({ score }).eq('id', leadId);
}
