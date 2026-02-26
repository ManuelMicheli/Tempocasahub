import type { Lead, Property } from '@/types/database';

export interface ScoreBreakdown {
  price: number;
  zone: number;
  type: number;
  sqm: number;
  must_have: number;
  nice_to_have: number;
}

const WEIGHTS = {
  price: 0.30,
  zone: 0.25,
  type: 0.15,
  sqm: 0.10,
  must_have: 0.15,
  nice_to_have: 0.05,
};

export function calculateMatchScore(
  lead: Lead,
  property: Property
): { score: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    price: calculatePriceScore(lead, property),
    zone: calculateZoneScore(lead, property),
    type: calculateTypeScore(lead, property),
    sqm: calculateSqmScore(lead, property),
    must_have: calculateMustHaveScore(lead, property),
    nice_to_have: calculateNiceToHaveScore(lead, property),
  };

  const score = Math.round(
    breakdown.price * WEIGHTS.price +
      breakdown.zone * WEIGHTS.zone +
      breakdown.type * WEIGHTS.type +
      breakdown.sqm * WEIGHTS.sqm +
      breakdown.must_have * WEIGHTS.must_have +
      breakdown.nice_to_have * WEIGHTS.nice_to_have
  );

  return { score, breakdown };
}

// PRICE (30%):
// In budget range -> 100
// Up to 10% over max -> 70
// Up to 20% over max -> 40
// Over 20% -> 0
// Under budget -> 80
// No budget info -> 50
function calculatePriceScore(lead: Lead, property: Property): number {
  if (!lead.budget_min && !lead.budget_max) return 50;
  const price = property.price;
  const max = lead.budget_max || Infinity;
  const min = lead.budget_min || 0;

  if (price >= min && price <= max) return 100;
  if (price > max && max !== Infinity) {
    const overPercent = ((price - max) / max) * 100;
    if (overPercent <= 10) return 70;
    if (overPercent <= 20) return 40;
    return 0;
  }
  return 80;
}

// ZONE (25%):
// Exact zone match -> 100
// Same city/adjacent -> 60
// Other -> 20
function calculateZoneScore(lead: Lead, property: Property): number {
  if (!lead.search_zones || lead.search_zones.length === 0) return 50;
  const propertyZone = (property.zone || '').toLowerCase();
  const propertyCity = property.city.toLowerCase();

  for (const zone of lead.search_zones) {
    const z = zone.toLowerCase();
    if (
      propertyZone &&
      (propertyZone.includes(z) || z.includes(propertyZone))
    )
      return 100;
    if (propertyCity.includes(z) || z.includes(propertyCity)) return 60;
  }
  return 20;
}

// TYPE (15%):
// Exact match -> 100
// Compatible -> 50
// No match -> 30
function calculateTypeScore(lead: Lead, property: Property): number {
  if (!lead.property_types || lead.property_types.length === 0) return 50;
  const propType = property.property_type.toLowerCase();
  for (const t of lead.property_types) {
    if (propType.includes(t.toLowerCase()) || t.toLowerCase().includes(propType))
      return 100;
  }
  return 30;
}

// SQM (10%):
// >= min_sqm -> 100
// Within 10% under -> 70
// Further under -> 30
// No info -> 50
function calculateSqmScore(lead: Lead, property: Property): number {
  if (!lead.min_sqm || !property.sqm) return 50;
  if (property.sqm >= lead.min_sqm) return 100;
  const deficit = ((lead.min_sqm - property.sqm) / lead.min_sqm) * 100;
  if (deficit <= 10) return 70;
  return 30;
}

// MUST-HAVE (15%):
// All present -> 100
// Missing 1 -> 50
// Missing 2+ -> 10
// No must-haves -> 100
function calculateMustHaveScore(lead: Lead, property: Property): number {
  if (!lead.must_have || lead.must_have.length === 0) return 100;
  const features = (property.features || []).map((f) => f.toLowerCase());
  let missing = 0;
  for (const must of lead.must_have) {
    if (!features.includes(must.toLowerCase())) missing++;
  }
  if (missing === 0) return 100;
  if (missing === 1) return 50;
  return 10;
}

// NICE-TO-HAVE (5%):
// Proportional to matches
// No nice-to-haves -> 50
function calculateNiceToHaveScore(lead: Lead, property: Property): number {
  if (!lead.nice_to_have || lead.nice_to_have.length === 0) return 50;
  const features = (property.features || []).map((f) => f.toLowerCase());
  let matched = 0;
  for (const nice of lead.nice_to_have) {
    if (features.includes(nice.toLowerCase())) matched++;
  }
  return Math.round((matched / lead.nice_to_have.length) * 100);
}
