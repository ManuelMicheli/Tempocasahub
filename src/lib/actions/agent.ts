'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';

export async function saveQuickNotes(notes: string) {
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('agents')
    .update({ quick_notes: notes })
    .eq('id', agent.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  return { success: true };
}
