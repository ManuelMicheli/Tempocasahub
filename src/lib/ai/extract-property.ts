// ============================================================
// AI Property Extraction — GPT-4o-mini
// Extracts structured property data from free-text descriptions
// ============================================================

import OpenAI from 'openai';

const SYSTEM_PROMPT = `Sei un assistente per un CRM immobiliare italiano.
Ricevi una descrizione testuale di un immobile e devi estrarre i dati strutturati.

Rispondi SOLO con un JSON valido, senza testo aggiuntivo. Usa null per i campi non menzionati.

Schema JSON da rispettare:
{
  "title": "string | null - titolo breve dell'annuncio",
  "address": "string | null - indirizzo (via e numero civico)",
  "city": "string | null - città o comune",
  "zone": "string | null - zona/quartiere",
  "property_type": "string | null - una tra: Appartamento, Villa, Loft, Bilocale, Trilocale, Attico, Monolocale, Casa indipendente",
  "price": "number | null - prezzo in euro (numero intero)",
  "sqm": "number | null - superficie in mq",
  "rooms": "number | null - numero totale locali",
  "bedrooms": "number | null - camere da letto",
  "bathrooms": "number | null - numero bagni",
  "floor": "number | null - piano",
  "total_floors": "number | null - piani totali dell'edificio",
  "year_built": "number | null - anno costruzione",
  "energy_class": "string | null - classe energetica (A4, A3, A2, A1, B, C, D, E, F, G)",
  "features": "string[] - dotazioni presenti tra: box, balcone, ascensore, giardino, cantina, terrazzo, doppi servizi, aria condizionata, posto auto",
  "condition": "string | null - una tra: Nuovo, Ristrutturato, Buono, Da ristrutturare",
  "heating": "string | null - una tra: Autonomo, Centralizzato",
  "status": "string | null - default 'available'",
  "description": "string | null - genera una breve descrizione per l'annuncio basata sulle info fornite"
}

Regole:
- Converti "280mila", "280k" → 280000
- "trilocale" implica rooms=3 se non specificato diversamente
- "bilocale" implica rooms=2
- Estrai le features dalle dotazioni menzionate
- Se menziona "box auto" o "garage" → "box"
- Se menziona "doppi servizi" o "2 bagni" → bathrooms=2 + "doppi servizi" in features
- Genera sempre un title sintetico se non fornito
- Genera sempre una description di 1-2 frasi per l'annuncio`;

export interface ExtractedProperty {
  title: string | null;
  address: string | null;
  city: string | null;
  zone: string | null;
  property_type: string | null;
  price: number | null;
  sqm: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  energy_class: string | null;
  features: string[];
  condition: string | null;
  heating: string | null;
  status: string | null;
  description: string | null;
}

export async function extractPropertyFromText(
  text: string
): Promise<ExtractedProperty> {
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
    title: parsed.title || null,
    address: parsed.address || null,
    city: parsed.city || null,
    zone: parsed.zone || null,
    property_type: parsed.property_type || null,
    price: parsed.price ? Number(parsed.price) : null,
    sqm: parsed.sqm ? Number(parsed.sqm) : null,
    rooms: parsed.rooms ? Number(parsed.rooms) : null,
    bedrooms: parsed.bedrooms ? Number(parsed.bedrooms) : null,
    bathrooms: parsed.bathrooms ? Number(parsed.bathrooms) : null,
    floor: parsed.floor != null ? Number(parsed.floor) : null,
    total_floors: parsed.total_floors ? Number(parsed.total_floors) : null,
    year_built: parsed.year_built ? Number(parsed.year_built) : null,
    energy_class: parsed.energy_class || null,
    features: Array.isArray(parsed.features) ? parsed.features : [],
    condition: parsed.condition || null,
    heating: parsed.heating || null,
    status: parsed.status || 'available',
    description: parsed.description || null,
  };
}
