// ============================================================
// CSV / Excel Parsers
// ============================================================

import Papa from 'papaparse';

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  errors: string[];
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = (results.data as Record<string, string>[]).filter((row) =>
          Object.values(row).some((v) => v && v.trim() !== '')
        );
        const errors = results.errors.map(
          (e) => `Riga ${e.row !== undefined ? e.row + 2 : '?'}: ${e.message}`
        );
        resolve({ headers, rows, totalRows: rows.length, errors });
      },
      error: (error: Error) => {
        resolve({ headers: [], rows: [], totalRows: 0, errors: [error.message] });
      },
    });
  });
}

export function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
          defval: '',
          raw: false,
        });

        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [], totalRows: 0, errors: ['Il file è vuoto'] });
          return;
        }

        const headers = Object.keys(jsonData[0]);
        const rows = jsonData.filter((row) =>
          Object.values(row).some((v) => v && String(v).trim() !== '')
        );

        resolve({ headers, rows, totalRows: rows.length, errors: [] });
      } catch {
        resolve({
          headers: [],
          rows: [],
          totalRows: 0,
          errors: ['Errore nella lettura del file Excel'],
        });
      }
    };
    reader.onerror = () => {
      resolve({
        headers: [],
        rows: [],
        totalRows: 0,
        errors: ['Errore nella lettura del file'],
      });
    };
    reader.readAsArrayBuffer(file);
  });
}

export function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return parseCSV(file);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file);
  return Promise.resolve({
    headers: [],
    rows: [],
    totalRows: 0,
    errors: ['Formato file non supportato. Usa CSV, XLSX o XLS.'],
  });
}

function isValidExt(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase();
  return ['csv', 'xlsx', 'xls'].includes(ext || '');
}

export function filterValidFiles(files: File[]): { valid: File[]; skipped: string[] } {
  const valid: File[] = [];
  const skipped: string[] = [];
  for (const f of files) {
    if (!isValidExt(f.name)) {
      skipped.push(f.name);
    } else if (f.size > 10 * 1024 * 1024) {
      skipped.push(`${f.name} (troppo grande)`);
    } else {
      valid.push(f);
    }
  }
  return { valid, skipped };
}

export async function parseMultipleFiles(files: File[]): Promise<ParseResult> {
  if (files.length === 0) {
    return { headers: [], rows: [], totalRows: 0, errors: ['Nessun file valido selezionato'] };
  }

  if (files.length === 1) {
    return parseFile(files[0]);
  }

  const results = await Promise.all(files.map((f) => parseFile(f)));

  // Merge: use union of all headers, fill missing with ''
  const headerSet = new Set<string>();
  for (const r of results) {
    for (const h of r.headers) headerSet.add(h);
  }
  const headers = Array.from(headerSet);

  const allRows: Record<string, string>[] = [];
  const allErrors: string[] = [];

  for (let fi = 0; fi < results.length; fi++) {
    const r = results[fi];
    const fileName = files[fi].name;

    // Add file-prefixed errors
    for (const err of r.errors) {
      allErrors.push(`[${fileName}] ${err}`);
    }

    // Normalize rows to have all headers
    for (const row of r.rows) {
      const normalized: Record<string, string> = {};
      for (const h of headers) {
        normalized[h] = row[h] || '';
      }
      allRows.push(normalized);
    }
  }

  return {
    headers,
    rows: allRows,
    totalRows: allRows.length,
    errors: allErrors,
  };
}
