'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Update a lead's next_follow_up_at date.
 * Used after post-visit feedback to schedule a follow-up.
 */
export async function updateLeadFollowUp(leadId: string, followUpAt: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('leads')
    .update({ next_follow_up_at: followUpAt })
    .eq('id', leadId);

  if (error) return { error: error.message };

  revalidatePath('/leads');
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/calendar');
  return { success: true };
}
