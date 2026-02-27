// ============================================================
// Field Mapping Definitions & Auto-Detection
// ============================================================

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'select' | 'array';
  options?: string[];
  aliases: string[]; // Column name patterns for auto-detect
}

// --- Lead field definitions ---

export const LEAD_FIELDS: FieldDefinition[] = [
  {
    key: 'full_name',
    label: 'Nome completo',
    required: true,
    type: 'text',
    aliases: ['nome', 'name', 'full_name', 'nome completo', 'nominativo', 'cliente', 'cognome e nome', 'nome e cognome', 'ragione sociale'],
  },
  {
    key: 'phone',
    label: 'Telefono',
    required: false,
    type: 'text',
    aliases: ['telefono', 'phone', 'tel', 'cellulare', 'cell', 'mobile', 'numero', 'numero telefono'],
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    type: 'text',
    aliases: ['email', 'e-mail', 'mail', 'posta elettronica', 'indirizzo email'],
  },
  {
    key: 'type',
    label: 'Tipo (buyer/seller/both)',
    required: false,
    type: 'select',
    options: ['buyer', 'seller', 'both'],
    aliases: ['tipo', 'type', 'tipologia cliente', 'acquirente/venditore'],
  },
  {
    key: 'source',
    label: 'Fonte',
    required: false,
    type: 'text',
    aliases: ['fonte', 'source', 'provenienza', 'canale', 'origine', 'come ci ha trovato'],
  },
  {
    key: 'status',
    label: 'Stato',
    required: false,
    type: 'select',
    options: ['new', 'contacted', 'qualified', 'active', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'dormant'],
    aliases: ['stato', 'status', 'fase', 'step'],
  },
  {
    key: 'temperature',
    label: 'Temperatura',
    required: false,
    type: 'select',
    options: ['hot', 'warm', 'cold'],
    aliases: ['temperatura', 'temperature', 'calore', 'priorità', 'priorita'],
  },
  {
    key: 'search_zones',
    label: 'Zone di ricerca',
    required: false,
    type: 'array',
    aliases: ['zone', 'zone di ricerca', 'search_zones', 'zona', 'quartiere', 'quartieri'],
  },
  {
    key: 'budget_min',
    label: 'Budget minimo (€)',
    required: false,
    type: 'number',
    aliases: ['budget min', 'budget_min', 'budget minimo', 'prezzo minimo', 'da €', 'da euro'],
  },
  {
    key: 'budget_max',
    label: 'Budget massimo (€)',
    required: false,
    type: 'number',
    aliases: ['budget max', 'budget_max', 'budget massimo', 'prezzo massimo', 'a €', 'a euro', 'budget'],
  },
  {
    key: 'property_types',
    label: 'Tipologia immobile',
    required: false,
    type: 'array',
    aliases: ['tipologia immobile', 'property_types', 'tipo immobile', 'tipologia'],
  },
  {
    key: 'min_rooms',
    label: 'Locali minimi',
    required: false,
    type: 'number',
    aliases: ['locali', 'min_rooms', 'locali minimi', 'stanze', 'vani', 'numero locali'],
  },
  {
    key: 'min_sqm',
    label: 'Metratura minima (mq)',
    required: false,
    type: 'number',
    aliases: ['metratura', 'min_sqm', 'mq', 'metratura minima', 'superficie minima', 'mq minimi'],
  },
  {
    key: 'must_have',
    label: 'Must have',
    required: false,
    type: 'array',
    aliases: ['must have', 'must_have', 'requisiti', 'irrinunciabili', 'obbligatori'],
  },
  {
    key: 'nice_to_have',
    label: 'Nice to have',
    required: false,
    type: 'array',
    aliases: ['nice to have', 'nice_to_have', 'desiderata', 'opzionali', 'preferenze'],
  },
  {
    key: 'timeline',
    label: 'Timeline',
    required: false,
    type: 'text',
    aliases: ['timeline', 'tempistica', 'urgenza', 'quando'],
  },
  {
    key: 'selling_address',
    label: 'Indirizzo immobile (vendita)',
    required: false,
    type: 'text',
    aliases: ['indirizzo vendita', 'selling_address', 'indirizzo immobile vendita'],
  },
  {
    key: 'selling_price_requested',
    label: 'Prezzo richiesto (vendita)',
    required: false,
    type: 'number',
    aliases: ['prezzo richiesto', 'selling_price_requested', 'prezzo vendita'],
  },
  {
    key: 'selling_price_estimated',
    label: 'Prezzo stimato (vendita)',
    required: false,
    type: 'number',
    aliases: ['prezzo stimato', 'selling_price_estimated', 'valutazione', 'stima'],
  },
  {
    key: 'mandate_type',
    label: 'Tipo mandato',
    required: false,
    type: 'text',
    aliases: ['mandato', 'mandate_type', 'tipo mandato', 'incarico'],
  },
  {
    key: 'mandate_expiry',
    label: 'Scadenza mandato',
    required: false,
    type: 'date',
    aliases: ['scadenza mandato', 'mandate_expiry', 'scadenza incarico', 'scadenza'],
  },
  {
    key: 'notes',
    label: 'Note',
    required: false,
    type: 'text',
    aliases: ['note', 'notes', 'annotazioni', 'commenti', 'osservazioni'],
  },
];

// --- Property field definitions ---

export const PROPERTY_FIELDS: FieldDefinition[] = [
  {
    key: 'title',
    label: 'Titolo',
    required: false,
    type: 'text',
    aliases: ['titolo', 'title', 'nome', 'descrizione breve', 'titolo annuncio'],
  },
  {
    key: 'address',
    label: 'Indirizzo',
    required: true,
    type: 'text',
    aliases: ['indirizzo', 'address', 'via', 'ubicazione', 'dove'],
  },
  {
    key: 'city',
    label: 'Città',
    required: true,
    type: 'text',
    aliases: ['città', 'citta', 'city', 'comune', 'località', 'localita'],
  },
  {
    key: 'zone',
    label: 'Zona',
    required: false,
    type: 'text',
    aliases: ['zona', 'zone', 'quartiere', 'rione', 'area'],
  },
  {
    key: 'property_type',
    label: 'Tipologia',
    required: true,
    type: 'text',
    aliases: ['tipologia', 'property_type', 'tipo', 'tipo immobile', 'categoria'],
  },
  {
    key: 'price',
    label: 'Prezzo (€)',
    required: true,
    type: 'number',
    aliases: ['prezzo', 'price', 'costo', 'importo', 'valore', 'prezzo vendita', 'prezzo richiesto'],
  },
  {
    key: 'sqm',
    label: 'Superficie (mq)',
    required: false,
    type: 'number',
    aliases: ['superficie', 'sqm', 'mq', 'metratura', 'metri quadri', 'metri quadrati'],
  },
  {
    key: 'rooms',
    label: 'Locali',
    required: false,
    type: 'number',
    aliases: ['locali', 'rooms', 'vani', 'stanze', 'numero locali'],
  },
  {
    key: 'bedrooms',
    label: 'Camere da letto',
    required: false,
    type: 'number',
    aliases: ['camere', 'bedrooms', 'camere da letto', 'letti'],
  },
  {
    key: 'bathrooms',
    label: 'Bagni',
    required: false,
    type: 'number',
    aliases: ['bagni', 'bathrooms', 'servizi', 'numero bagni'],
  },
  {
    key: 'floor',
    label: 'Piano',
    required: false,
    type: 'number',
    aliases: ['piano', 'floor', 'livello'],
  },
  {
    key: 'total_floors',
    label: 'Piani totali',
    required: false,
    type: 'number',
    aliases: ['piani totali', 'total_floors', 'piani edificio', 'totale piani'],
  },
  {
    key: 'year_built',
    label: 'Anno costruzione',
    required: false,
    type: 'number',
    aliases: ['anno costruzione', 'year_built', 'anno', 'costruzione'],
  },
  {
    key: 'energy_class',
    label: 'Classe energetica',
    required: false,
    type: 'text',
    aliases: ['classe energetica', 'energy_class', 'ape', 'classe', 'certificazione energetica'],
  },
  {
    key: 'features',
    label: 'Dotazioni',
    required: false,
    type: 'array',
    aliases: ['dotazioni', 'features', 'caratteristiche', 'servizi', 'accessori', 'optional'],
  },
  {
    key: 'condition',
    label: 'Condizione',
    required: false,
    type: 'text',
    aliases: ['condizione', 'condition', 'stato immobile', 'stato conservazione'],
  },
  {
    key: 'heating',
    label: 'Riscaldamento',
    required: false,
    type: 'text',
    aliases: ['riscaldamento', 'heating', 'tipo riscaldamento'],
  },
  {
    key: 'status',
    label: 'Stato',
    required: false,
    type: 'select',
    options: ['draft', 'available', 'reserved', 'sold', 'withdrawn'],
    aliases: ['stato', 'status', 'disponibilità', 'disponibilita'],
  },
  {
    key: 'description',
    label: 'Descrizione',
    required: false,
    type: 'text',
    aliases: ['descrizione', 'description', 'testo annuncio', 'descrizione annuncio'],
  },
  {
    key: 'internal_notes',
    label: 'Note interne',
    required: false,
    type: 'text',
    aliases: ['note interne', 'internal_notes', 'note', 'annotazioni'],
  },
  {
    key: 'photos',
    label: 'Foto (URL)',
    required: false,
    type: 'array',
    aliases: ['foto', 'photos', 'immagini', 'url foto', 'link foto'],
  },
  {
    key: 'virtual_tour_url',
    label: 'Virtual Tour URL',
    required: false,
    type: 'text',
    aliases: ['virtual tour', 'virtual_tour_url', 'tour virtuale', '360'],
  },
  {
    key: 'published_on',
    label: 'Portali pubblicazione',
    required: false,
    type: 'array',
    aliases: ['portali', 'published_on', 'pubblicato su', 'pubblicazione'],
  },
];

// --- Auto-mapping logic ---

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ');
}

export function autoMapColumns(
  headers: string[],
  fields: FieldDefinition[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedFields = new Set<string>();

  // First pass: exact alias matches
  for (const header of headers) {
    const normalizedHeader = normalize(header);
    for (const field of fields) {
      if (usedFields.has(field.key)) continue;
      const exactMatch = field.aliases.some((a) => normalize(a) === normalizedHeader);
      if (exactMatch) {
        mapping[header] = field.key;
        usedFields.add(field.key);
        break;
      }
    }
  }

  // Second pass: partial matches for unmapped headers
  for (const header of headers) {
    if (mapping[header]) continue;
    const normalizedHeader = normalize(header);
    for (const field of fields) {
      if (usedFields.has(field.key)) continue;
      const partialMatch = field.aliases.some(
        (a) => normalizedHeader.includes(normalize(a)) || normalize(a).includes(normalizedHeader)
      );
      if (partialMatch) {
        mapping[header] = field.key;
        usedFields.add(field.key);
        break;
      }
    }
  }

  return mapping;
}
