-- ============================================================
-- TempoCasa CRM - Census Module Schema
-- Migration 003: Census tables for door-to-door cadastral data
-- RLS at agency level (census data is shared within agency)
-- ============================================================

-- ZONE CENSITE

CREATE TABLE census_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) NOT NULL,
  name TEXT NOT NULL,
  municipality_code TEXT, -- codice ISTAT / catastale (es. D019 per Cornaredo)
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

-- EDIFICI

CREATE TABLE census_buildings (
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

-- UNITA IMMOBILIARI

CREATE TABLE census_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES census_buildings(id) ON DELETE CASCADE NOT NULL,
  sheet TEXT, -- foglio catastale
  parcel TEXT, -- particella
  sub TEXT, -- subalterno
  category TEXT, -- categoria catastale (es. A/2, A/3)
  class TEXT, -- classe
  consistency TEXT, -- consistenza (es. "5 vani")
  cadastral_income NUMERIC(12,2), -- rendita catastale
  sqm INTEGER,
  rooms INTEGER,
  floor TEXT,
  internal TEXT, -- interno/scala
  contact_status TEXT DEFAULT 'not_contacted'
    CHECK (contact_status IN ('not_contacted','contacted','interested','not_interested','callback','lead_created')),
  lead_id UUID REFERENCES leads(id),
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  callback_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PROPRIETARI

CREATE TABLE census_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES census_units(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  fiscal_code TEXT, -- codice fiscale
  ownership_type TEXT, -- piena proprieta, nuda proprieta, usufrutto, etc.
  ownership_share TEXT, -- quota (es. "1/1", "1/2")
  is_natural_person BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STORICO COMPRAVENDITE

CREATE TABLE census_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES census_units(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT, -- compravendita, donazione, successione, etc.
  transaction_date DATE,
  price NUMERIC(12,2),
  buyer_name TEXT,
  seller_name TEXT,
  notary TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LOG CONTATTI

CREATE TABLE census_contact_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES census_units(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('door','phone','note')),
  outcome TEXT NOT NULL CHECK (outcome IN ('no_answer','not_interested','interested','callback','info_gathered')),
  notes TEXT,
  callback_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_census_zones_agency ON census_zones(agency_id);
CREATE INDEX idx_census_buildings_zone ON census_buildings(zone_id);
CREATE INDEX idx_census_buildings_coords ON census_buildings(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX idx_census_units_building ON census_units(building_id);
CREATE INDEX idx_census_units_status ON census_units(contact_status);
CREATE INDEX idx_census_units_lead ON census_units(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_census_owners_unit ON census_owners(unit_id);
CREATE INDEX idx_census_transactions_unit ON census_transactions(unit_id);
CREATE INDEX idx_census_contact_log_unit ON census_contact_log(unit_id);
CREATE INDEX idx_census_contact_log_agent ON census_contact_log(agent_id);

-- ============================================================
-- ROW LEVEL SECURITY (agency-level: shared within agency)
-- ============================================================

ALTER TABLE census_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_contact_log ENABLE ROW LEVEL SECURITY;

-- Helper: get current agent's agency_id
CREATE OR REPLACE FUNCTION get_agent_agency_id()
RETURNS UUID AS $$
  SELECT agency_id FROM agents WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Zones: visible to all agents in the same agency
CREATE POLICY "census_zones_agency" ON census_zones FOR ALL
  USING (agency_id = get_agent_agency_id());

-- Buildings: visible if zone belongs to agent's agency
CREATE POLICY "census_buildings_agency" ON census_buildings FOR ALL
  USING (zone_id IN (SELECT id FROM census_zones WHERE agency_id = get_agent_agency_id()));

-- Units: visible if building's zone belongs to agent's agency
CREATE POLICY "census_units_agency" ON census_units FOR ALL
  USING (building_id IN (
    SELECT b.id FROM census_buildings b
    JOIN census_zones z ON z.id = b.zone_id
    WHERE z.agency_id = get_agent_agency_id()
  ));

-- Owners: visible if unit's building's zone belongs to agent's agency
CREATE POLICY "census_owners_agency" ON census_owners FOR ALL
  USING (unit_id IN (
    SELECT u.id FROM census_units u
    JOIN census_buildings b ON b.id = u.building_id
    JOIN census_zones z ON z.id = b.zone_id
    WHERE z.agency_id = get_agent_agency_id()
  ));

-- Transactions: same as owners
CREATE POLICY "census_transactions_agency" ON census_transactions FOR ALL
  USING (unit_id IN (
    SELECT u.id FROM census_units u
    JOIN census_buildings b ON b.id = u.building_id
    JOIN census_zones z ON z.id = b.zone_id
    WHERE z.agency_id = get_agent_agency_id()
  ));

-- Contact log: visible to all agents in same agency (through unit chain)
CREATE POLICY "census_contact_log_agency" ON census_contact_log FOR ALL
  USING (unit_id IN (
    SELECT u.id FROM census_units u
    JOIN census_buildings b ON b.id = u.building_id
    JOIN census_zones z ON z.id = b.zone_id
    WHERE z.agency_id = get_agent_agency_id()
  ));

-- ============================================================
-- TRIGGERS: auto-update counters
-- ============================================================

-- Update building counters when unit contact_status changes
CREATE OR REPLACE FUNCTION update_building_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate counts for the affected building
  UPDATE census_buildings SET
    total_units = (SELECT COUNT(*) FROM census_units WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)),
    contacted_count = (SELECT COUNT(*) FROM census_units WHERE building_id = COALESCE(NEW.building_id, OLD.building_id) AND contact_status != 'not_contacted'),
    interested_count = (SELECT COUNT(*) FROM census_units WHERE building_id = COALESCE(NEW.building_id, OLD.building_id) AND contact_status IN ('interested', 'lead_created'))
  WHERE id = COALESCE(NEW.building_id, OLD.building_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER census_units_counter
  AFTER INSERT OR UPDATE OF contact_status OR DELETE ON census_units
  FOR EACH ROW EXECUTE FUNCTION update_building_counters();

-- Update zone counters when building counters change
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

CREATE TRIGGER census_buildings_counter
  AFTER INSERT OR UPDATE OF total_units, contacted_count, interested_count OR DELETE ON census_buildings
  FOR EACH ROW EXECUTE FUNCTION update_zone_counters();

-- Updated_at triggers for tables that have it
CREATE TRIGGER census_zones_updated_at BEFORE UPDATE ON census_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER census_units_updated_at BEFORE UPDATE ON census_units FOR EACH ROW EXECUTE FUNCTION update_updated_at();
