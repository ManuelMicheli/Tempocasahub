-- ============================================================
-- TempoCasa CRM - WhatsApp Integration
-- Migration 002: whatsapp_contacts table + interactions update
-- ============================================================

CREATE TABLE whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  wa_jid TEXT NOT NULL,
  wa_name TEXT,
  wa_phone TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  is_monitored BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, wa_jid)
);

-- Index for fast lookups
CREATE INDEX idx_whatsapp_contacts_agent ON whatsapp_contacts(agent_id);
CREATE INDEX idx_whatsapp_contacts_monitored ON whatsapp_contacts(agent_id) WHERE is_monitored = true;
CREATE INDEX idx_whatsapp_contacts_lead ON whatsapp_contacts(lead_id);

-- RLS
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_contacts_own" ON whatsapp_contacts
  FOR ALL USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- Add WhatsApp message ID to interactions for deduplication
ALTER TABLE interactions ADD COLUMN wa_message_id TEXT;
CREATE UNIQUE INDEX idx_interactions_wa_msg ON interactions(wa_message_id) WHERE wa_message_id IS NOT NULL;
