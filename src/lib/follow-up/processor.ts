// ============================================================
// TempoCasa CRM - Follow-up Processor
// Processes pending follow-ups from the queue
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { renderTemplate } from './templates';
import { sendWhatsApp, sendEmail } from '@/lib/notifications/placeholder';

/**
 * Process all pending follow-ups that are due.
 * Returns the number of items processed.
 */
export async function processPendingFollowUps(): Promise<number> {
  const supabase = await createClient();

  const now = new Date().toISOString();
  const { data: pendingItems } = await supabase
    .from('follow_up_queue')
    .select(
      '*, lead:leads(full_name, phone, email, search_zones, agent_id), rule:follow_up_rules(channel, template_key)'
    )
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(50);

  if (!pendingItems || pendingItems.length === 0) return 0;

  let processed = 0;
  for (const item of pendingItems) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lead = item.lead as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rule = item.rule as any;
    if (!lead || !rule) continue;

    // Get agent name
    const { data: agent } = await supabase
      .from('agents')
      .select('full_name')
      .eq('id', lead.agent_id)
      .single();

    const message = renderTemplate(rule.template_key, {
      leadName: lead.full_name,
      agentName: agent?.full_name || 'Il tuo agente',
      zone: lead.search_zones?.[0] || undefined,
    });

    let success = false;
    if (rule.channel === 'whatsapp' && lead.phone) {
      success = await sendWhatsApp(lead.phone, message);
    } else if (rule.channel === 'email' && lead.email) {
      success = await sendEmail(lead.email, 'Follow-up TempoCasa', message);
    } else {
      // call_reminder: mark as sent (shown in dashboard)
      success = true;
    }

    await supabase
      .from('follow_up_queue')
      .update({
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        message_preview: message,
      })
      .eq('id', item.id);

    processed++;
  }

  return processed;
}
