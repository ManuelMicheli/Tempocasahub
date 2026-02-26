// ============================================================
// TempoCasa CRM - AI Placeholder Functions
// These functions generate rule-based suggestions.
// Replace with OpenAI calls for production use.
// ============================================================

export async function generateAISuggestions(context: {
  lead: {
    full_name: string;
    budget_min: number | null;
    budget_max: number | null;
    must_have: string[] | null;
    notes: string | null;
  };
  property: {
    price: number;
    sqm: number | null;
    features: string[] | null;
    address: string;
  } | null;
  interactions: { type: string; summary: string | null; outcome: string | null }[];
}): Promise<string> {
  const { lead, property, interactions } = context;
  const visitCount = interactions.filter((i) => i.type === 'visit').length;

  let suggestion = `Il cliente e' alla visita numero ${visitCount + 1}. `;

  if (lead.budget_min || lead.budget_max) {
    suggestion += `Budget: \u20AC${lead.budget_min?.toLocaleString('it-IT') || '?'} - \u20AC${lead.budget_max?.toLocaleString('it-IT') || '?'}. `;
  }

  if (property) {
    suggestion += `Immobile a \u20AC${property.price.toLocaleString('it-IT')}. `;
    if (property.sqm) suggestion += `${property.sqm} mq. `;
  }

  // Analyze previous visit feedback
  const previousVisits = interactions.filter(
    (i) => i.type === 'visit' && i.outcome,
  );
  if (previousVisits.length > 0) {
    const lastVisit = previousVisits[previousVisits.length - 1];
    if (lastVisit.outcome === 'not_interested' && lastVisit.summary) {
      suggestion += `Attenzione: nell'ultima visita il cliente non era interessato. Motivo: "${lastVisit.summary}". `;
    }
  }

  suggestion +=
    '[Suggerimento AI placeholder - collegare OpenAI per suggerimenti personalizzati]';

  return suggestion;
}

export async function generateMatchMessage(
  lead: { full_name: string },
  property: {
    title: string | null;
    address: string;
    city: string;
    rooms: number | null;
    sqm: number | null;
    price: number;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _score: number,
): Promise<string> {
  return (
    `Buongiorno ${lead.full_name}, ho un immobile che potrebbe interessarti: ` +
    `${property.title || property.address}, ${property.city}. ` +
    `${property.rooms || '?'} locali, ${property.sqm || '?'} mq a \u20AC${property.price.toLocaleString('it-IT')}. ` +
    `Vuoi organizzare una visita?`
  );
}
