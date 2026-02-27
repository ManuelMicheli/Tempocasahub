import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/whatsapp/status — returns bridge connection info for the current agent
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: 'Agente non trovato' }, { status: 404 });
  }

  // Count monitored contacts
  const { count: monitoredCount } = await supabase
    .from('whatsapp_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agent.id)
    .eq('is_monitored', true);

  // Count total contacts
  const { count: totalCount } = await supabase
    .from('whatsapp_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agent.id);

  // Count synced interactions (last 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentSyncs } = await supabase
    .from('interactions')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agent.id)
    .not('wa_message_id', 'is', null)
    .gte('created_at', yesterday);

  return NextResponse.json({
    agentId: agent.id,
    monitoredContacts: monitoredCount || 0,
    totalContacts: totalCount || 0,
    recentSyncs: recentSyncs || 0,
    bridgeUrl: `ws://localhost:${process.env.WA_BRIDGE_PORT || '3001'}`,
  });
}
