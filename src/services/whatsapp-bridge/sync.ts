// ============================================================
// WhatsApp Message Sync — Writes messages to Supabase as interactions
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for server-side inserts (bypasses RLS)
function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface WAMessage {
  key: {
    remoteJid?: string;
    fromMe?: boolean;
    id?: string;
  };
  message?: Record<string, unknown>;
  messageTimestamp?: number;
}

function extractMessageText(message: Record<string, unknown> | undefined): string {
  if (!message) return '[Messaggio vuoto]';

  if (message.conversation) return String(message.conversation);
  if (message.extendedTextMessage) {
    const ext = message.extendedTextMessage as Record<string, unknown>;
    return String(ext.text || '');
  }
  if (message.imageMessage) return '[Immagine]';
  if (message.videoMessage) return '[Video]';
  if (message.audioMessage) return '[Audio]';
  if (message.documentMessage) {
    const doc = message.documentMessage as Record<string, unknown>;
    return `[Documento: ${doc.fileName || 'file'}]`;
  }
  if (message.stickerMessage) return '[Sticker]';
  if (message.contactMessage) return '[Contatto]';
  if (message.locationMessage) return '[Posizione]';

  return '[Messaggio]';
}

export async function syncMessage(msg: WAMessage, agentId: string): Promise<void> {
  const { key, message, messageTimestamp } = msg;
  if (!key.remoteJid || !key.id) return;

  // Skip group messages — only sync individual chats
  if (key.remoteJid.endsWith('@g.us')) return;

  // Skip status broadcasts
  if (key.remoteJid === 'status@broadcast') return;

  const supabase = getSupabase();
  const waJid = key.remoteJid;
  const waMessageId = key.id;

  // Check if this contact is monitored by the agent
  const { data: contact } = await supabase
    .from('whatsapp_contacts')
    .select('id, lead_id, is_monitored')
    .eq('agent_id', agentId)
    .eq('wa_jid', waJid)
    .single();

  if (!contact || !contact.is_monitored || !contact.lead_id) return;

  // Check for duplicate message
  const { data: existing } = await supabase
    .from('interactions')
    .select('id')
    .eq('wa_message_id', waMessageId)
    .single();

  if (existing) return; // Already synced

  // Extract message content
  const text = extractMessageText(message);
  const summary = text.length > 500 ? text.substring(0, 497) + '...' : text;
  const timestamp = messageTimestamp
    ? new Date(Number(messageTimestamp) * 1000).toISOString()
    : new Date().toISOString();

  const interactionType = key.fromMe ? 'whatsapp_sent' : 'whatsapp_received';

  // Insert interaction
  const { error: insertError } = await supabase.from('interactions').insert({
    lead_id: contact.lead_id,
    agent_id: agentId,
    type: interactionType,
    summary,
    completed_at: timestamp,
    wa_message_id: waMessageId,
  });

  if (insertError) {
    console.error('[WA Sync] Insert error:', insertError.message);
    return;
  }

  // Update lead's last_contact_at
  await supabase
    .from('leads')
    .update({ last_contact_at: timestamp })
    .eq('id', contact.lead_id);

  // Update contact's last_sync_at
  await supabase
    .from('whatsapp_contacts')
    .update({ last_sync_at: timestamp })
    .eq('id', contact.id);

  console.log(
    `[WA Sync] ${interactionType} → Lead ${contact.lead_id}: ${summary.substring(0, 60)}`
  );
}
