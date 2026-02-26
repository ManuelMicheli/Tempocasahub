import type { Lead, Interaction } from '@/types/database';

const WEIGHTS = {
  reactivity: 0.25,
  timeline: 0.20,
  budget: 0.20,
  completeness: 0.15,
  source: 0.10,
  engagement: 0.10,
};

/**
 * Calculate the overall lead score based on 6 weighted factors.
 * Returns a number from 0 to 100.
 */
export function calculateLeadScore(lead: Lead, interactions: Interaction[]): number {
  const scores = {
    reactivity: calculateReactivity(lead, interactions),
    timeline: calculateTimeline(lead),
    budget: calculateBudget(lead),
    completeness: calculateCompleteness(lead),
    source: calculateSourceQuality(lead),
    engagement: calculateEngagement(interactions),
  };

  return Math.round(
    scores.reactivity * WEIGHTS.reactivity +
    scores.timeline * WEIGHTS.timeline +
    scores.budget * WEIGHTS.budget +
    scores.completeness * WEIGHTS.completeness +
    scores.source * WEIGHTS.source +
    scores.engagement * WEIGHTS.engagement
  );
}

/**
 * Reactivity (25%): Measures how responsive the lead is based on interactions.
 * - 0 interactions -> 30
 * - Has inbound interactions -> bonus
 * - 5+ total interactions -> 100
 * - 3+ -> 80
 * - else -> 60
 */
function calculateReactivity(_lead: Lead, interactions: Interaction[]): number {
  if (interactions.length === 0) return 30;

  const inboundTypes = ['call_inbound', 'whatsapp_received', 'email_received'];
  const hasInbound = interactions.some((i) => inboundTypes.includes(i.type));

  let score: number;
  if (interactions.length >= 5) {
    score = 100;
  } else if (interactions.length >= 3) {
    score = 80;
  } else {
    score = 60;
  }

  // Inbound interactions indicate the lead is proactively engaging
  if (hasInbound) {
    score = Math.min(100, score + 10);
  }

  return score;
}

/**
 * Timeline (20%): How urgent is the lead's timeline?
 * - 'urgente' -> 100
 * - '1-3 mesi' -> 80
 * - '3-6 mesi' -> 50
 * - 'esplorativo' -> 20
 * - null/unknown -> 40
 */
function calculateTimeline(lead: Lead): number {
  if (!lead.timeline) return 40;

  const normalized = lead.timeline.toLowerCase().trim();

  if (normalized === 'urgente') return 100;
  if (normalized === '1-3 mesi') return 80;
  if (normalized === '3-6 mesi') return 50;
  if (normalized === 'esplorativo') return 20;

  return 40;
}

/**
 * Budget (20%): Does the lead have clear financial parameters?
 * - Seller with selling_price_requested -> 80, without -> 30
 * - Buyer with budget_min or budget_max -> 80, without -> 30
 */
function calculateBudget(lead: Lead): number {
  if (lead.type === 'seller') {
    return lead.selling_price_requested ? 80 : 30;
  }

  // buyer or both
  if (lead.budget_min || lead.budget_max) {
    return 80;
  }

  return 30;
}

/**
 * Completeness (15%): How many profile fields are filled out?
 * Checks: full_name, phone, email, type, source, search_zones,
 *         budget_min, budget_max, property_types, timeline, must_have, notes
 * Score = (filled / total) * 100
 */
function calculateCompleteness(lead: Lead): number {
  const fields: boolean[] = [
    !!lead.full_name,
    !!lead.phone,
    !!lead.email,
    !!lead.type,
    !!lead.source,
    !!(lead.search_zones && lead.search_zones.length > 0),
    lead.budget_min != null,
    lead.budget_max != null,
    !!(lead.property_types && lead.property_types.length > 0),
    !!lead.timeline,
    !!(lead.must_have && lead.must_have.length > 0),
    !!lead.notes,
  ];

  const filled = fields.filter(Boolean).length;
  const total = fields.length;

  return Math.round((filled / total) * 100);
}

/**
 * Source quality (10%): How valuable is the lead source?
 * - 'referral' -> 100
 * - 'walk-in' -> 80
 * - 'social' -> 60
 * - 'immobiliare.it' or 'idealista' -> 50
 * - default -> 40
 */
function calculateSourceQuality(lead: Lead): number {
  if (!lead.source) return 40;

  const normalized = lead.source.toLowerCase().trim();

  if (normalized === 'referral') return 100;
  if (normalized === 'walk-in') return 80;
  if (normalized === 'social') return 60;
  if (normalized === 'immobiliare.it' || normalized === 'idealista') return 50;

  return 40;
}

/**
 * Engagement (10%): What level of engagement has the lead shown?
 * - Has proposals -> 100
 * - 3+ visits -> 90
 * - 1+ visits -> 70
 * - else -> 30
 */
function calculateEngagement(interactions: Interaction[]): number {
  const hasProposals = interactions.some((i) => i.type === 'proposal');
  if (hasProposals) return 100;

  const visitCount = interactions.filter((i) => i.type === 'visit').length;
  if (visitCount >= 3) return 90;
  if (visitCount >= 1) return 70;

  return 30;
}
