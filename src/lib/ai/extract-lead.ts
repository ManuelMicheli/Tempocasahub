// ============================================================
// AI Lead Extraction — GPT-4o-mini
// Extracts structured lead data from free-text descriptions
// ============================================================

import OpenAI from 'openai';

const SYSTEM_PROMPT = `Sei un assistente per un CRM immobiliare italiano.
Ricevi una descrizione testuale di un cliente (lead) e devi estrarre i dati strutturati.

Rispondi SOLO con un JSON valido, senza testo aggiuntivo. Usa null per i campi non menzionati.

Schema JSON da rispettare:
{
  "full_name": "string | null - nome completo del cliente",
  "phone": "string | null - numero di telefono",
  "email": "string | null - indirizzo email",
  "type": "string | null - una tra: buyer, seller, both",
  "source": "string | null - da dove arriva il contatto",
  "temperature": "string | null - una tra: hot, warm, cold",
  "search_zones": "string[] - zone/quartieri di ricerca",
  "budget_min": "number | null - budget minimo in euro",
  "budget_max": "number | null - budget massimo in euro",
  "property_types": "string[] - tipologie cercate (Appartamento, Villa, Bilocale, ecc.)",
  "min_rooms": "number | null - numero minimo locali",
  "min_sqm": "number | null - metratura minima",
  "must_have": "string[] - requisiti irrinunciabili (box, ascensore, balcone, ecc.)",
  "nice_to_have": "string[] - requisiti desiderati ma non essenziali",
  "timeline": "string | null - una tra: Urgente, 1-3 mesi, 3-6 mesi, Esplorativo",
  "selling_address": "string | null - indirizzo immobile da vendere (se venditore)",
  "selling_price_requested": "number | null - prezzo richiesto per vendita",
  "selling_price_estimated": "number | null - prezzo stimato",
  "mandate_type": "string | null - Esclusiva o Non esclusiva",
  "notes": "string | null - note aggiuntive rilevanti"
}

Regole:
- Se dice "cerca casa", "vuole comprare" → type = "buyer"
- Se dice "vuole vendere", "ha un immobile da vendere" → type = "seller"
- Se dice "urgente", "ha fretta" → timeline = "Urgente", temperature = "hot"
- "200-300k" o "tra 200 e 300mila" → budget_min=200000, budget_max=300000
- "massimo 250mila" → budget_max=250000
- "almeno 3 locali" → min_rooms=3
- "zona centro, sempione" → search_zones=["Centro", "Sempione"]
- "deve avere il box" → must_have=["box"]
- "preferibilmente con terrazzo" → nice_to_have=["terrazzo"]
- Inferisci temperature da urgenza e contesto se non specificata`;

export interface ExtractedLead {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  type: string | null;
  source: string | null;
  temperature: string | null;
  search_zones: string[];
  budget_min: number | null;
  budget_max: number | null;
  property_types: string[];
  min_rooms: number | null;
  min_sqm: number | null;
  must_have: string[];
  nice_to_have: string[];
  timeline: string | null;
  selling_address: string | null;
  selling_price_requested: number | null;
  selling_price_estimated: number | null;
  mandate_type: string | null;
  notes: string | null;
}

export async function extractLeadFromText(
  text: string
): Promise<ExtractedLead> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Nessuna risposta dall\'AI');
  }

  const parsed = JSON.parse(content);

  return {
    full_name: parsed.full_name || null,
    phone: parsed.phone || null,
    email: parsed.email || null,
    type: parsed.type || null,
    source: parsed.source || null,
    temperature: parsed.temperature || null,
    search_zones: Array.isArray(parsed.search_zones) ? parsed.search_zones : [],
    budget_min: parsed.budget_min ? Number(parsed.budget_min) : null,
    budget_max: parsed.budget_max ? Number(parsed.budget_max) : null,
    property_types: Array.isArray(parsed.property_types) ? parsed.property_types : [],
    min_rooms: parsed.min_rooms ? Number(parsed.min_rooms) : null,
    min_sqm: parsed.min_sqm ? Number(parsed.min_sqm) : null,
    must_have: Array.isArray(parsed.must_have) ? parsed.must_have : [],
    nice_to_have: Array.isArray(parsed.nice_to_have) ? parsed.nice_to_have : [],
    timeline: parsed.timeline || null,
    selling_address: parsed.selling_address || null,
    selling_price_requested: parsed.selling_price_requested ? Number(parsed.selling_price_requested) : null,
    selling_price_estimated: parsed.selling_price_estimated ? Number(parsed.selling_price_estimated) : null,
    mandate_type: parsed.mandate_type || null,
    notes: parsed.notes || null,
  };
}
