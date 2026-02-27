-- ============================================================
-- SAFE MIGRATION: applica 002 + 003 + 004 senza errori se esistono già
-- Incolla tutto nel SQL Editor di Supabase e clicca "Run"
-- ============================================================

-- ===================== MIGRATION 002: WhatsApp =====================

CREATE TABLE IF NOT EXISTS whatsapp_contacts (
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

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_agent ON whatsapp_contacts(agent_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_monitored ON whatsapp_contacts(agent_id) WHERE is_monitored = true;
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_lead ON whatsapp_contacts(lead_id);

ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "whatsapp_contacts_own" ON whatsapp_contacts
    FOR ALL USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE interactions ADD COLUMN wa_message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_interactions_wa_msg ON interactions(wa_message_id) WHERE wa_message_id IS NOT NULL;


-- ===================== MIGRATION 003: Census =====================

CREATE TABLE IF NOT EXISTS census_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) NOT NULL,
  name TEXT NOT NULL,
  municipality_code TEXT,
  province TEXT,
  region TEXT,
  total_buildings INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  contacted_count INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS census_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES census_zones(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  civic_number TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  total_units INTEGER DEFAULT 0,
  contacted_count INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS census_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES census_buildings(id) ON DELETE CASCADE NOT NULL,
  sheet TEXT,
  parcel TEXT,
  sub TEXT,
  category TEXT,
  class TEXT,
  consistency TEXT,
  cadastral_income NUMERIC(12,2),
  sqm INTEGER,
  rooms INTEGER,
  floor TEXT,
  internal TEXT,
  contact_status TEXT DEFAULT 'not_contacted'
    CHECK (contact_status IN ('not_contacted','contacted','interested','not_interested','callback','lead_created')),
  lead_id UUID REFERENCES leads(id),
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  callback_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS census_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES census_units(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  fiscal_code TEXT,
  ownership_type TEXT,
  ownership_share TEXT,
  is_natural_person BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS census_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES census_units(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT,
  transaction_date DATE,
  price NUMERIC(12,2),
  buyer_name TEXT,
  seller_name TEXT,
  notary TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS census_contact_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES census_units(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('door','phone','note')),
  outcome TEXT NOT NULL CHECK (outcome IN ('no_answer','not_interested','interested','callback','info_gathered')),
  notes TEXT,
  callback_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_census_zones_agency ON census_zones(agency_id);
CREATE INDEX IF NOT EXISTS idx_census_buildings_zone ON census_buildings(zone_id);
CREATE INDEX IF NOT EXISTS idx_census_buildings_coords ON census_buildings(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_census_units_building ON census_units(building_id);
CREATE INDEX IF NOT EXISTS idx_census_units_status ON census_units(contact_status);
CREATE INDEX IF NOT EXISTS idx_census_units_lead ON census_units(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_census_owners_unit ON census_owners(unit_id);
CREATE INDEX IF NOT EXISTS idx_census_transactions_unit ON census_transactions(unit_id);
CREATE INDEX IF NOT EXISTS idx_census_contact_log_unit ON census_contact_log(unit_id);
CREATE INDEX IF NOT EXISTS idx_census_contact_log_agent ON census_contact_log(agent_id);

-- RLS
ALTER TABLE census_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_contact_log ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_agent_agency_id()
RETURNS UUID AS $$
  SELECT agency_id FROM agents WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policies (safe: skip if already exists)
DO $$ BEGIN
  CREATE POLICY "census_zones_agency" ON census_zones FOR ALL
    USING (agency_id = get_agent_agency_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "census_buildings_agency" ON census_buildings FOR ALL
    USING (zone_id IN (SELECT id FROM census_zones WHERE agency_id = get_agent_agency_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "census_units_agency" ON census_units FOR ALL
    USING (building_id IN (
      SELECT b.id FROM census_buildings b
      JOIN census_zones z ON z.id = b.zone_id
      WHERE z.agency_id = get_agent_agency_id()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "census_owners_agency" ON census_owners FOR ALL
    USING (unit_id IN (
      SELECT u.id FROM census_units u
      JOIN census_buildings b ON b.id = u.building_id
      JOIN census_zones z ON z.id = b.zone_id
      WHERE z.agency_id = get_agent_agency_id()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "census_transactions_agency" ON census_transactions FOR ALL
    USING (unit_id IN (
      SELECT u.id FROM census_units u
      JOIN census_buildings b ON b.id = u.building_id
      JOIN census_zones z ON z.id = b.zone_id
      WHERE z.agency_id = get_agent_agency_id()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "census_contact_log_agency" ON census_contact_log FOR ALL
    USING (unit_id IN (
      SELECT u.id FROM census_units u
      JOIN census_buildings b ON b.id = u.building_id
      JOIN census_zones z ON z.id = b.zone_id
      WHERE z.agency_id = get_agent_agency_id()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Triggers
CREATE OR REPLACE FUNCTION update_building_counters()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE census_buildings SET
    total_units = (SELECT COUNT(*) FROM census_units WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)),
    contacted_count = (SELECT COUNT(*) FROM census_units WHERE building_id = COALESCE(NEW.building_id, OLD.building_id) AND contact_status != 'not_contacted'),
    interested_count = (SELECT COUNT(*) FROM census_units WHERE building_id = COALESCE(NEW.building_id, OLD.building_id) AND contact_status IN ('interested', 'lead_created'))
  WHERE id = COALESCE(NEW.building_id, OLD.building_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS census_units_counter ON census_units;
CREATE TRIGGER census_units_counter
  AFTER INSERT OR UPDATE OF contact_status OR DELETE ON census_units
  FOR EACH ROW EXECUTE FUNCTION update_building_counters();

CREATE OR REPLACE FUNCTION update_zone_counters()
RETURNS TRIGGER AS $$
DECLARE
  v_zone_id UUID;
BEGIN
  v_zone_id := COALESCE(NEW.zone_id, OLD.zone_id);
  UPDATE census_zones SET
    total_buildings = (SELECT COUNT(*) FROM census_buildings WHERE zone_id = v_zone_id),
    total_units = (SELECT COALESCE(SUM(total_units), 0) FROM census_buildings WHERE zone_id = v_zone_id),
    contacted_count = (SELECT COALESCE(SUM(contacted_count), 0) FROM census_buildings WHERE zone_id = v_zone_id),
    interested_count = (SELECT COALESCE(SUM(interested_count), 0) FROM census_buildings WHERE zone_id = v_zone_id),
    updated_at = now()
  WHERE id = v_zone_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS census_buildings_counter ON census_buildings;
CREATE TRIGGER census_buildings_counter
  AFTER INSERT OR UPDATE OF total_units, contacted_count, interested_count OR DELETE ON census_buildings
  FOR EACH ROW EXECUTE FUNCTION update_zone_counters();

DROP TRIGGER IF EXISTS census_zones_updated_at ON census_zones;
CREATE TRIGGER census_zones_updated_at BEFORE UPDATE ON census_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS census_units_updated_at ON census_units;
CREATE TRIGGER census_units_updated_at BEFORE UPDATE ON census_units FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ===================== MIGRATION 004: Agencies policies =====================

DO $$ BEGIN
  CREATE POLICY "agencies_insert" ON agencies FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "agencies_update" ON agencies FOR UPDATE
    USING (id IN (SELECT agency_id FROM agents WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ===================== SETUP: Crea agenzia per admin =====================
-- Crea l'agenzia TempoCasa Cornaredo e collegala all'agente admin

DO $$
DECLARE
  v_agency_id UUID;
  v_agent_id UUID;
BEGIN
  -- Trova l'agente admin
  SELECT id INTO v_agent_id FROM agents WHERE email = 'admin@tempocasa.it' LIMIT 1;

  IF v_agent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM agents WHERE email = 'admin@tempocasa.it' AND agency_id IS NOT NULL) THEN
    -- Crea agenzia
    INSERT INTO agencies (name, city) VALUES ('TempoCasa Cornaredo', 'Cornaredo')
    RETURNING id INTO v_agency_id;

    -- Collega agente all'agenzia
    UPDATE agents SET agency_id = v_agency_id WHERE id = v_agent_id;
  END IF;
END $$;
