// ============================================================
// WhatsApp Contact Management
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface Contact {
  jid: string;
  name: string | null;
  phone: string;
}

/**
 * Normalize phone number for comparison.
 * Strips spaces, dashes, parentheses, and leading 0 after country code.
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '');
  // If starts with 00, convert to +
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  // If no +, assume Italian +39
  if (!cleaned.startsWith('+')) cleaned = '+39' + cleaned;
  return cleaned;
}

/**
 * Extract phone number from WhatsApp JID.
 * JID format: "393331234567@s.whatsapp.net"
 */
function phoneFromJid(jid: string): string {
  const num = jid.split('@')[0];
  return '+' + num;
}

/**
 * Sync a list of WhatsApp contacts into the whatsapp_contacts table
 * and auto-match with existing leads by phone number.
 */
export async function syncContacts(
  agentId: string,
  waContacts: Contact[]
): Promise<{
  matched: number;
  unmatched: number;
  total: number;
}> {
  const supabase = getSupabase();

  // Fetch all agent's leads with phone numbers
  const { data: leads } = await supabase
    .from('leads')
    .select('id, phone, full_name')
    .eq('agent_id', agentId)
    .not('phone', 'is', null);

  // Build a normalized phone → lead_id map
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
  let unmatched = 0;

  for (const contact of waContacts) {
    const waPhone = contact.phone || phoneFromJid(contact.jid);
    const normalizedWaPhone = normalizePhone(waPhone);

    // Try to find a matching lead
    const leadId = phoneToLead.get(normalizedWaPhone) || null;
    if (leadId) matched++;
    else unmatched++;

    // Upsert into whatsapp_contacts
    await supabase.from('whatsapp_contacts').upsert(
      {
        agent_id: agentId,
        wa_jid: contact.jid,
        wa_name: contact.name,
        wa_phone: waPhone,
        lead_id: leadId,
      },
      { onConflict: 'agent_id,wa_jid' }
    );
  }

  return { matched, unmatched, total: waContacts.length };
}

/**
 * Get all WhatsApp contacts for an agent from the DB.
 */
export async function getStoredContacts(agentId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select(`
      id,
      wa_jid,
      wa_name,
      wa_phone,
      lead_id,
      is_monitored,
      last_sync_at,
      leads:lead_id (id, full_name, phone)
    `)
    .eq('agent_id', agentId)
    .order('is_monitored', { ascending: false })
    .order('wa_name', { ascending: true });

  if (error) {
    console.error('[WA Contacts] Error fetching contacts:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Toggle monitoring for a contact.
 */
export async function setContactMonitored(
  contactId: string,
  agentId: string,
  monitored: boolean
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('whatsapp_contacts')
    .update({ is_monitored: monitored })
    .eq('id', contactId)
    .eq('agent_id', agentId);

  return !error;
}

/**
 * Manually link a contact to a lead.
 */
export async function linkContactToLead(
  contactId: string,
  agentId: string,
  leadId: string | null
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('whatsapp_contacts')
    .update({ lead_id: leadId })
    .eq('id', contactId)
    .eq('agent_id', agentId);

  return !error;
}
