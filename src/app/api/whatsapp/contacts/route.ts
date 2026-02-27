import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/whatsapp/contacts — list all WhatsApp contacts for this agent
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

  const { data: contacts, error } = await supabase
    .from('whatsapp_contacts')
    .select(`
      id,
      wa_jid,
      wa_name,
      wa_phone,
      lead_id,
      is_monitored,
      last_sync_at
    `)
    .eq('agent_id', agent.id)
    .order('is_monitored', { ascending: false })
    .order('wa_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch lead names for matched contacts
  const leadIds = contacts
    ?.filter((c) => c.lead_id)
    .map((c) => c.lead_id) || [];

  let leadMap: Record<string, string> = {};
  if (leadIds.length > 0) {
    const { data: leads } = await supabase
      .from('leads')
      .select('id, full_name')
      .in('id', leadIds);

    if (leads) {
      leadMap = Object.fromEntries(leads.map((l) => [l.id, l.full_name]));
    }
  }

  const enriched = (contacts || []).map((c) => ({
    ...c,
    lead_name: c.lead_id ? leadMap[c.lead_id] || null : null,
  }));

  return NextResponse.json({ contacts: enriched });
}

// PATCH /api/whatsapp/contacts — update monitoring or lead link
export async function PATCH(req: NextRequest) {
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

  const body = await req.json();
  const { contactId, is_monitored, lead_id } = body;

  if (!contactId) {
    return NextResponse.json({ error: 'contactId richiesto' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof is_monitored === 'boolean') updates.is_monitored = is_monitored;
  if (lead_id !== undefined) updates.lead_id = lead_id;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
  }

  const { error } = await supabase
    .from('whatsapp_contacts')
    .update(updates)
    .eq('id', contactId)
    .eq('agent_id', agent.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
