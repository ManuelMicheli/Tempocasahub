// ============================================================
// CSV Template Generation for Download
// ============================================================

export const LEAD_TEMPLATE_HEADERS = [
  'Nome completo',
  'Telefono',
  'Email',
  'Tipo (buyer/seller/both)',
  'Fonte',
  'Stato',
  'Temperatura (hot/warm/cold)',
  'Zone di ricerca',
  'Budget minimo',
  'Budget massimo',
  'Tipologia immobile',
  'Locali minimi',
  'Metratura minima (mq)',
  'Must have',
  'Nice to have',
  'Timeline',
  'Indirizzo immobile (vendita)',
  'Prezzo richiesto',
  'Prezzo stimato',
  'Tipo mandato',
  'Scadenza mandato',
  'Note',
];

export const LEAD_TEMPLATE_EXAMPLE = [
  'Mario Rossi',
  '+39 333 1234567',
  'mario.rossi@email.it',
  'buyer',
  'Portale immobiliare',
  'new',
  'hot',
  'Centro, Sempione, Isola',
  '150000',
  '250000',
  'Appartamento, Bilocale',
  '3',
  '60',
  'box, ascensore',
  'balcone, terrazzo',
  '1-3 mesi',
  '',
  '',
  '',
  '',
  '',
  'Cerca bilocale per investimento',
];

export const PROPERTY_TEMPLATE_HEADERS = [
  'Titolo',
  'Indirizzo',
  'Città',
  'Zona',
  'Tipologia',
  'Prezzo',
  'Superficie (mq)',
  'Locali',
  'Camere da letto',
  'Bagni',
  'Piano',
  'Piani totali',
  'Anno costruzione',
  'Classe energetica',
  'Dotazioni',
  'Condizione',
  'Riscaldamento',
  'Stato (available/draft/reserved/sold)',
  'Descrizione',
  'Note interne',
  'Foto (URL)',
  'Virtual Tour URL',
  'Portali',
];

export const PROPERTY_TEMPLATE_EXAMPLE = [
  'Trilocale luminoso con terrazzo',
  'Via Roma 15',
  'Milano',
  'Centro',
  'Appartamento',
  '280000',
  '85',
  '3',
  '2',
  '1',
  '3',
  '5',
  '1990',
  'C',
  'box, balcone, ascensore, cantina',
  'Buono',
  'Autonomo',
  'available',
  'Luminoso trilocale con terrazzo abitabile, zona servita',
  'Proprietario motivato alla vendita',
  '',
  '',
  'Immobiliare.it, Idealista',
];

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCSV(headers: string[], exampleRow: string[]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const exampleLine = exampleRow.map(escapeCSV).join(',');
  // BOM for Excel UTF-8 compatibility
  return '\uFEFF' + headerLine + '\n' + exampleLine + '\n';
}

export function downloadLeadTemplate(): void {
  const csv = generateCSV(LEAD_TEMPLATE_HEADERS, LEAD_TEMPLATE_EXAMPLE);
  downloadFile(csv, 'template_lead_tempocasa.csv', 'text/csv;charset=utf-8');
}

export function downloadPropertyTemplate(): void {
  const csv = generateCSV(PROPERTY_TEMPLATE_HEADERS, PROPERTY_TEMPLATE_EXAMPLE);
  downloadFile(csv, 'template_immobili_tempocasa.csv', 'text/csv;charset=utf-8');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
