// ============================================================
// TempoCasa CRM - Follow-up Scheduler
// Schedules follow-ups based on trigger events and active rules
// ============================================================

import { createClient } from '@/lib/supabase/server';

/**
 * Schedule all follow-ups for a lead based on a trigger event.
 * Looks up active rules for the lead's agent and creates queue entries.
 */
export async function scheduleFollowUps(
  leadId: string,
  triggerEvent: string
) {
  const supabase = await createClient();

  // Get lead's agent
  const { data: lead } = await supabase
    .from('leads')
    .select('agent_id')
    .eq('id', leadId)
    .single();

  if (!lead) return;

  // Get active rules for this trigger event
  const { data: rules } = await supabase
    .from('follow_up_rules')
    .select('*')
    .eq('agent_id', lead.agent_id)
    .eq('trigger_event', triggerEvent)
    .eq('is_active', true);

  if (!rules || rules.length === 0) return;

  const queueEntries = rules.map((rule) => ({
    lead_id: leadId,
    rule_id: rule.id,
    scheduled_at: new Date(
      Date.now() + rule.delay_hours * 60 * 60 * 1000
    ).toISOString(),
    status: 'pending' as const,
  }));

  await supabase.from('follow_up_queue').insert(queueEntries);
}

/**
 * Cancel all pending follow-ups for a lead.
 * Used when lead status changes or follow-ups are no longer relevant.
 */
export async function cancelPendingFollowUps(leadId: string) {
  const supabase = await createClient();
  await supabase
    .from('follow_up_queue')
    .update({ status: 'cancelled' })
    .eq('lead_id', leadId)
    .eq('status', 'pending');
}
