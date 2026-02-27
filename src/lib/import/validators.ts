// ============================================================
// Row Validation for Import
// ============================================================

import { LEAD_FIELDS, PROPERTY_FIELDS, type FieldDefinition } from './field-mapping';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

function validateRow(
  row: Record<string, string>,
  mapping: Record<string, string>,
  fields: FieldDefinition[],
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const mappedValues: Record<string, string> = {};

  // Build mapped values
  for (const [header, fieldKey] of Object.entries(mapping)) {
    if (fieldKey && fieldKey !== '_skip') {
      mappedValues[fieldKey] = row[header] || '';
    }
  }

  // Check required fields
  for (const field of fields) {
    if (field.required) {
      const value = mappedValues[field.key]?.trim();
      if (!value) {
        errors.push({
          row: rowIndex,
          field: field.key,
          message: `"${field.label}" è obbligatorio`,
        });
      }
    }
  }

  // Validate number fields
  for (const field of fields) {
    if (field.type === 'number' && mappedValues[field.key]) {
      const cleaned = mappedValues[field.key]
        .replace(/[€$\s.]/g, '')
        .replace(',', '.');
      if (cleaned && isNaN(Number(cleaned))) {
        errors.push({
          row: rowIndex,
          field: field.key,
          message: `"${field.label}" deve essere un numero`,
        });
      }
    }
  }

  // Validate select fields
  for (const field of fields) {
    if (field.type === 'select' && field.options && mappedValues[field.key]) {
      const value = mappedValues[field.key].trim().toLowerCase();
      if (value && !field.options.includes(value)) {
        errors.push({
          row: rowIndex,
          field: field.key,
          message: `"${field.label}": valore "${mappedValues[field.key]}" non valido. Valori accettati: ${field.options.join(', ')}`,
        });
      }
    }
  }

  return errors;
}

export function validateLeadRows(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): ValidationResult {
  const errors: ValidationError[] = [];
  for (let i = 0; i < rows.length; i++) {
    errors.push(...validateRow(rows[i], mapping, LEAD_FIELDS, i));
  }
  return { valid: errors.length === 0, errors };
}

export function validatePropertyRows(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): ValidationResult {
  const errors: ValidationError[] = [];
  for (let i = 0; i < rows.length; i++) {
    errors.push(...validateRow(rows[i], mapping, PROPERTY_FIELDS, i));
  }
  return { valid: errors.length === 0, errors };
}

// Transform a raw row into a database-ready object
export function transformRow(
  row: Record<string, string>,
  mapping: Record<string, string>,
  fields: FieldDefinition[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [header, fieldKey] of Object.entries(mapping)) {
    if (!fieldKey || fieldKey === '_skip') continue;
    const field = fields.find((f) => f.key === fieldKey);
    if (!field) continue;

    const rawValue = row[header]?.trim() || '';
    if (!rawValue) continue;

    switch (field.type) {
      case 'number': {
        const cleaned = rawValue.replace(/[€$\s.]/g, '').replace(',', '.');
        const num = Number(cleaned);
        if (!isNaN(num)) result[fieldKey] = Math.round(num);
        break;
      }
      case 'array': {
        result[fieldKey] = rawValue
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      }
      case 'select': {
        result[fieldKey] = rawValue.toLowerCase().trim();
        break;
      }
      case 'date': {
        // Try to parse common Italian date formats
        const dateStr = rawValue.trim();
        // DD/MM/YYYY
        const ddmmyyyy = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
        if (ddmmyyyy) {
          result[fieldKey] = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
        } else {
          // Try ISO format or pass through
          result[fieldKey] = dateStr;
        }
        break;
      }
      default: {
        result[fieldKey] = rawValue;
      }
    }
  }

  return result;
}
