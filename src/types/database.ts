// ============================================================
// TempoCasa CRM - Database Types
// TypeScript types matching the Supabase schema
// ============================================================

// --- Enum / Union Types ---

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'active'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'dormant';

export type LeadType = 'buyer' | 'seller' | 'both';

export type Temperature = 'hot' | 'warm' | 'cold';

export type LeadSource = string; // flexible free-text source

export type Timeline = string; // flexible free-text timeline

export type PropertyStatus = 'draft' | 'available' | 'reserved' | 'sold' | 'withdrawn';

export type PropertyCondition = string; // e.g. 'new', 'renovated', 'to_renovate', etc.

export type InteractionType =
  | 'call_outbound'
  | 'call_inbound'
  | 'whatsapp_sent'
  | 'whatsapp_received'
  | 'email_sent'
  | 'email_received'
  | 'visit'
  | 'meeting'
  | 'proposal'
  | 'note';

export type InteractionOutcome = string; // flexible free-text outcome

export type MatchStatus =
  | 'suggested'
  | 'sent'
  | 'visit_booked'
  | 'visited'
  | 'interested'
  | 'rejected'
  | 'proposal';

export type FollowUpChannel = string; // e.g. 'whatsapp', 'email', 'sms', 'call'

export type FollowUpQueueStatus = 'pending' | 'sent' | 'cancelled' | 'failed';

export type AgentRole = 'agent' | 'manager' | 'admin';

// --- Score Breakdown ---

export interface ScoreBreakdown {
  price: number;
  zone: number;
  type: number;
  sqm: number;
  must_have: number;
  nice_to_have: number;
}

// --- Table Interfaces ---

export interface Agency {
  id: string;
  name: string;
  city: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  agency_id: string | null;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: AgentRole;
  created_at: string;
}

export interface Lead {
  id: string;
  agent_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  type: LeadType;
  source: LeadSource | null;
  status: LeadStatus;
  temperature: Temperature;
  search_zones: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  property_types: string[] | null;
  min_rooms: number | null;
  min_sqm: number | null;
  must_have: string[] | null;
  nice_to_have: string[] | null;
  timeline: Timeline | null;
  selling_address: string | null;
  selling_price_requested: number | null;
  selling_price_estimated: number | null;
  mandate_type: string | null;
  mandate_expiry: string | null;
  score: number;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  agent_id: string | null;
  title: string | null;
  address: string;
  city: string;
  zone: string | null;
  property_type: string;
  price: number;
  sqm: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  energy_class: string | null;
  features: string[] | null;
  condition: PropertyCondition | null;
  heating: string | null;
  status: PropertyStatus;
  photos: string[] | null;
  virtual_tour_url: string | null;
  published_on: string[] | null;
  owner_lead_id: string | null;
  description: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  lead_id: string | null;
  agent_id: string | null;
  type: InteractionType;
  property_id: string | null;
  summary: string | null;
  outcome: InteractionOutcome | null;
  scheduled_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface Match {
  id: string;
  lead_id: string | null;
  property_id: string | null;
  score: number;
  score_breakdown: ScoreBreakdown | null;
  status: MatchStatus;
  agent_notes: string | null;
  client_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpRule {
  id: string;
  agent_id: string | null;
  trigger_event: string;
  delay_hours: number;
  channel: FollowUpChannel;
  template_key: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FollowUpQueue {
  id: string;
  lead_id: string | null;
  rule_id: string | null;
  scheduled_at: string;
  sent_at: string | null;
  status: FollowUpQueueStatus;
  message_preview: string | null;
  created_at: string;
}
