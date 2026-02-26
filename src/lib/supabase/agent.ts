import { createClient } from './server';
import type { Agent } from '@/types/database';

export async function getCurrentAgent(): Promise<Agent | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return agent as Agent | null;
}
