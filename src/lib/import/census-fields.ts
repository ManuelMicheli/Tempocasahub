// ============================================================
// Census Field Mapping — Elettra / Catasto Import
// Matches typical "visura catastale" export formats
// ============================================================

import type { FieldDefinition } from './field-mapping';

export const CENSUS_FIELDS: FieldDefinition[] = [
  // --- Building-level fields ---
  {
    key: 'address',
    label: 'Indirizzo (via/piazza)',
    required: true,
    type: 'text',
    aliases: [
      'indirizzo', 'via', 'address', 'ubicazione', 'toponomastica',
      'denominazione strada', 'nome strada', 'strada',
    ],
  },
  {
    key: 'civic_number',
    label: 'Numero civico',
    required: true,
    type: 'text',
    aliases: [
      'civico', 'civic_number', 'numero civico', 'n. civico', 'n.civico',
      'num civico', 'nciv', 'num', 'numero',
    ],
  },

  // --- Unit-level cadastral fields ---
  {
    key: 'sheet',
    label: 'Foglio',
    required: false,
    type: 'text',
    aliases: ['foglio', 'sheet', 'fg', 'fg.', 'n. foglio'],
  },
  {
    key: 'parcel',
    label: 'Particella',
    required: false,
    type: 'text',
    aliases: [
      'particella', 'parcel', 'part', 'part.', 'mappale',
      'n. particella', 'n. mappale',
    ],
  },
  {
    key: 'sub',
    label: 'Subalterno',
    required: false,
    type: 'text',
    aliases: [
      'subalterno', 'sub', 'sub.', 'subaltern', 'n. subalterno',
    ],
  },
  {
    key: 'category',
    label: 'Categoria catastale',
    required: false,
    type: 'text',
    aliases: [
      'categoria', 'category', 'cat', 'cat.', 'categoria catastale',
      'dest. uso', 'destinazione uso',
    ],
  },
  {
    key: 'class',
    label: 'Classe',
    required: false,
    type: 'text',
    aliases: ['classe', 'class', 'cl', 'cl.', 'classe catastale'],
  },
  {
    key: 'consistency',
    label: 'Consistenza',
    required: false,
    type: 'text',
    aliases: [
      'consistenza', 'consistency', 'consist', 'consist.',
      'vani', 'n. vani',
    ],
  },
  {
    key: 'cadastral_income',
    label: 'Rendita catastale (€)',
    required: false,
    type: 'number',
    aliases: [
      'rendita', 'rendita catastale', 'cadastral_income', 'r.c.',
      'rc', 'rend. catastale', 'rendita €',
    ],
  },
  {
    key: 'sqm',
    label: 'Superficie (mq)',
    required: false,
    type: 'number',
    aliases: [
      'superficie', 'sqm', 'mq', 'metratura', 'metri quadri',
      'sup.', 'superficie catastale',
    ],
  },
  {
    key: 'rooms',
    label: 'Vani',
    required: false,
    type: 'number',
    aliases: ['locali', 'rooms', 'stanze', 'numero locali', 'n. locali'],
  },
  {
    key: 'floor',
    label: 'Piano',
    required: false,
    type: 'text',
    aliases: ['piano', 'floor', 'p.', 'livello'],
  },
  {
    key: 'internal',
    label: 'Interno',
    required: false,
    type: 'text',
    aliases: [
      'interno', 'internal', 'int', 'int.', 'n. interno',
      'scala/interno', 'porta',
    ],
  },

  // --- Owner fields ---
  {
    key: 'owner_name',
    label: 'Proprietario (nome)',
    required: false,
    type: 'text',
    aliases: [
      'proprietario', 'owner_name', 'nome proprietario', 'intestatario',
      'nominativo', 'titolare', 'cognome e nome', 'nome e cognome',
      'denominazione', 'ragione sociale', 'soggetto',
    ],
  },
  {
    key: 'fiscal_code',
    label: 'Codice fiscale',
    required: false,
    type: 'text',
    aliases: [
      'codice fiscale', 'fiscal_code', 'cf', 'c.f.', 'cod. fiscale',
      'cod fiscale', 'p.iva', 'partita iva',
    ],
  },
  {
    key: 'ownership_type',
    label: 'Tipo proprietà',
    required: false,
    type: 'text',
    aliases: [
      'tipo proprietà', 'tipo proprieta', 'ownership_type', 'diritto',
      'tipo diritto', 'titolo', 'diritto reale',
      'proprietà', 'proprieta', 'nuda proprietà', 'usufrutto',
    ],
  },
  {
    key: 'ownership_share',
    label: 'Quota proprietà',
    required: false,
    type: 'text',
    aliases: [
      'quota', 'ownership_share', 'quota proprietà', 'quota proprieta',
      'quota %', 'percentuale', 'quota di possesso',
    ],
  },
];

// Validate census import rows
export function validateCensusRows(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): { valid: boolean; errors: { row: number; field: string; message: string }[] } {
  const errors: { row: number; field: string; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const mappedValues: Record<string, string> = {};
    for (const [header, fieldKey] of Object.entries(mapping)) {
      if (fieldKey && fieldKey !== '_skip') {
        mappedValues[fieldKey] = rows[i][header] || '';
      }
    }

    // Address is required
    if (!mappedValues.address?.trim()) {
      errors.push({ row: i, field: 'address', message: '"Indirizzo" è obbligatorio' });
    }
    // Civic number is required
    if (!mappedValues.civic_number?.trim()) {
      errors.push({ row: i, field: 'civic_number', message: '"Numero civico" è obbligatorio' });
    }

    // Validate cadastral_income as number
    if (mappedValues.cadastral_income) {
      const cleaned = mappedValues.cadastral_income
        .replace(/[€$\s.]/g, '')
        .replace(',', '.');
      if (cleaned && isNaN(Number(cleaned))) {
        errors.push({ row: i, field: 'cadastral_income', message: '"Rendita catastale" deve essere un numero' });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
