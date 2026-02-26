'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { MatchStatus } from '@/types/database';

export async function updateMatchStatus(id: string, status: MatchStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('matches')
    .update({ status })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/matches');
  return { success: true };
}

export async function addMatchNote(id: string, note: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('matches')
    .update({ agent_notes: note })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/matches');
  return { success: true };
}

export async function addClientFeedback(id: string, feedback: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('matches')
    .update({ client_feedback: feedback })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/matches');
  return { success: true };
}
