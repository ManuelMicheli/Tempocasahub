'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { DEFAULT_RULES } from '@/lib/follow-up/rules';

/**
 * Seed default follow-up rules for the current agent.
 * Only inserts if no rules exist yet.
 */
export async function seedDefaultRules() {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  // Check if rules already exist
  const { data: existing } = await supabase
    .from('follow_up_rules')
    .select('id')
    .eq('agent_id', agent.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: true, message: 'Regole gia presenti' };
  }

  const rules = DEFAULT_RULES.map((rule) => ({
    agent_id: agent.id,
    trigger_event: rule.trigger_event,
    delay_hours: rule.delay_hours,
    channel: rule.channel,
    template_key: rule.template_key,
    is_active: true,
  }));

  const { error } = await supabase.from('follow_up_rules').insert(rules);
  if (error) return { error: error.message };

  revalidatePath('/settings/follow-up');
  return { success: true };
}

/**
 * Toggle a follow-up rule active/inactive.
 */
export async function toggleRule(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('follow_up_rules')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/settings/follow-up');
  return { success: true };
}

/**
 * Update a follow-up rule's delay or channel.
 */
export async function updateRule(
  id: string,
  data: { delay_hours?: number; channel?: string }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('follow_up_rules')
    .update(data)
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/settings/follow-up');
  return { success: true };
}

/**
 * Cancel a pending follow-up queue item.
 */
export async function cancelFollowUp(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('follow_up_queue')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/settings/follow-up');
  return { success: true };
}
