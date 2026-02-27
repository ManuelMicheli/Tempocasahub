import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/whatsapp/session-manager';

// POST /api/whatsapp/sync-contacts — sync in-memory Baileys contacts to DB
export async function POST() {
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

  const session = getSession();
  const contacts = session.getContacts();

  if (contacts.length === 0) {
    return NextResponse.json({
      synced: 0,
      matched: 0,
      message: 'Nessun contatto disponibile dalla sessione WhatsApp',
    });
  }

  // Fetch agent's leads with phone numbers for auto-matching
  const { data: leads } = await supabase
    .from('leads')
    .select('id, phone, full_name')
    .eq('agent_id', agent.id)
    .not('phone', 'is', null);

  // Build normalized phone → lead_id map
  const phoneToLead = new Map<string, string>();
  if (leads) {
    for (const lead of leads) {
      if (lead.phone) {
        const normalized = normalizePhone(lead.phone);
        phoneToLead.set(normalized, lead.id);
      }
    }
  }

  let matched = 0;

  for (const contact of contacts) {
    const waPhone = contact.phone;
    const normalizedWaPhone = normalizePhone(waPhone);
    const leadId = phoneToLead.get(normalizedWaPhone) || null;
    if (leadId) matched++;

    await supabase.from('whatsapp_contacts').upsert(
      {
        agent_id: agent.id,
        wa_jid: contact.jid,
        wa_name: contact.name,
        wa_phone: waPhone,
        lead_id: leadId,
      },
      { onConflict: 'agent_id,wa_jid' }
    );
  }

  return NextResponse.json({
    synced: contacts.length,
    matched,
    message: `${contacts.length} contatti sincronizzati, ${matched} abbinati a lead`,
  });
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  if (!cleaned.startsWith('+')) cleaned = '+39' + cleaned;
  return cleaned;
}
