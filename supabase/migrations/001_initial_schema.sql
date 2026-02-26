-- ============================================================
-- TempoCasa CRM - Initial Database Schema
-- Migration 001: All tables, indexes, RLS policies, triggers
-- ============================================================

-- ORGANIZZAZIONE

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'agent', -- 'agent', 'manager', 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT NOT NULL CHECK (type IN ('buyer', 'seller', 'both')),
  source TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','active','proposal','negotiation','closed_won','closed_lost','dormant')),
  temperature TEXT DEFAULT 'warm' CHECK (temperature IN ('hot', 'warm', 'cold')),
  search_zones TEXT[],
  budget_min INTEGER,
  budget_max INTEGER,
  property_types TEXT[],
  min_rooms INTEGER,
  min_sqm INTEGER,
  must_have TEXT[],
  nice_to_have TEXT[],
  timeline TEXT,
  selling_address TEXT,
  selling_price_requested INTEGER,
  selling_price_estimated INTEGER,
  mandate_type TEXT,
  mandate_expiry DATE,
  score INTEGER DEFAULT 50,
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  title TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zone TEXT,
  property_type TEXT NOT NULL,
  price INTEGER NOT NULL,
  sqm INTEGER,
  rooms INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  floor INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  energy_class TEXT,
  features TEXT[],
  condition TEXT,
  heating TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('draft','available','reserved','sold','withdrawn')),
  photos TEXT[],
  virtual_tour_url TEXT,
  published_on TEXT[],
  owner_lead_id UUID REFERENCES leads(id),
  description TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  type TEXT NOT NULL CHECK (type IN ('call_outbound','call_inbound','whatsapp_sent','whatsapp_received','email_sent','email_received','visit','meeting','proposal','note')),
  property_id UUID REFERENCES properties(id),
  summary TEXT,
  outcome TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  score_breakdown JSONB,
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested','sent','visit_booked','visited','interested','rejected','proposal')),
  agent_notes TEXT,
  client_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, property_id)
);

CREATE TABLE follow_up_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  trigger_event TEXT NOT NULL,
  delay_hours INTEGER DEFAULT 0,
  channel TEXT NOT NULL,
  template_key TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE follow_up_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES follow_up_rules(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','cancelled','failed')),
  message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_leads_agent ON leads(agent_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_temperature ON leads(temperature);
CREATE INDEX idx_leads_next_followup ON leads(next_follow_up_at);
CREATE INDEX idx_properties_agent ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city_zone ON properties(city, zone);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_interactions_lead ON interactions(lead_id);
CREATE INDEX idx_interactions_scheduled ON interactions(scheduled_at);
CREATE INDEX idx_matches_lead ON matches(lead_id);
CREATE INDEX idx_matches_property ON matches(property_id);
CREATE INDEX idx_matches_score ON matches(score DESC);
CREATE INDEX idx_followup_queue_scheduled ON follow_up_queue(scheduled_at) WHERE status = 'pending';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_own" ON agents FOR ALL USING (user_id = auth.uid());
CREATE POLICY "agencies_own" ON agencies FOR SELECT USING (id IN (SELECT agency_id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY "leads_own" ON leads FOR ALL USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY "properties_own" ON properties FOR ALL USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY "interactions_own" ON interactions FOR ALL USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY "matches_own" ON matches FOR ALL USING (lead_id IN (SELECT id FROM leads WHERE agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())));
CREATE POLICY "followup_rules_own" ON follow_up_rules FOR ALL USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY "followup_queue_own" ON follow_up_queue FOR ALL USING (lead_id IN (SELECT id FROM leads WHERE agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())));

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
