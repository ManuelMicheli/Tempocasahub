import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/whatsapp/session-manager';

// POST /api/whatsapp/disconnect — disconnect Baileys session and clear monitoring
export async function POST() {
  // Disconnect the Baileys session
  try {
    const session = getSession();
    session.disconnect();
  } catch (err) {
    console.error('[WA Disconnect] Session error:', err);
  }

  // Also clear monitoring in Supabase (best-effort)
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (agent) {
        await supabase
          .from('whatsapp_contacts')
          .update({ is_monitored: false })
          .eq('agent_id', agent.id);
      }
    }
  } catch {
    // Supabase cleanup is best-effort
  }

  return NextResponse.json({ success: true });
}
