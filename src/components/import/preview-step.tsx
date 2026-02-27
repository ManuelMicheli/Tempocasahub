'use client';

import { useMemo } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FieldDefinition } from '@/lib/import/field-mapping';
import type { ValidationError } from '@/lib/import/validators';

interface PreviewStepProps {
  rows: Record<string, string>[];
  mapping: Record<string, string>;
  fields: FieldDefinition[];
  validationErrors: ValidationError[];
  importResult: ImportResult | null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  total: number;
}

export function PreviewStep({
  rows,
  mapping,
  fields,
  validationErrors,
  importResult,
}: PreviewStepProps) {
  // Group errors by row
  const errorsByRow = useMemo(() => {
    const map = new Map<number, ValidationError[]>();
    for (const err of validationErrors) {
      if (!map.has(err.row)) map.set(err.row, []);
      map.get(err.row)!.push(err);
    }
    return map;
  }, [validationErrors]);

  const validCount = rows.length - errorsByRow.size;
  const errorCount = errorsByRow.size;

  // Get mapped field keys in order
  const mappedFields = useMemo(() => {
    const result: { header: string; field: FieldDefinition; key: string }[] = [];
    for (const [header, fieldKey] of Object.entries(mapping)) {
      if (fieldKey === '_skip') continue;
      const field = fields.find((f) => f.key === fieldKey);
      if (field) result.push({ header, field, key: fieldKey });
    }
    return result;
  }, [mapping, fields]);

  // If we have import results, show them
  if (importResult) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          {importResult.errors.length === 0 ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          ) : (
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
          )}

          <div>
            <h3 className="text-xl font-bold mb-2">Importazione completata</h3>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {importResult.imported}
                </p>
                <p className="text-sm text-muted-foreground">Importati</p>
              </div>
              {importResult.skipped > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {importResult.skipped}
                  </p>
                  <p className="text-sm text-muted-foreground">Saltati</p>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {importResult.errors.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Errori</p>
                </div>
              )}
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="text-left mt-4">
              <p className="text-sm font-medium mb-2">Dettaglio errori:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-sm text-red-600">
                    {err}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3">
        <Card className="flex-1">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{validCount}</p>
              <p className="text-sm text-muted-foreground">Righe valide</p>
            </div>
          </CardContent>
        </Card>
        {errorCount > 0 && (
          <Card className="flex-1">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{errorCount}</p>
                <p className="text-sm text-muted-foreground">Righe con errori</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="flex-1">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{rows.length}</p>
              <p className="text-sm text-muted-foreground">Totale righe</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Anteprima dati</CardTitle>
          <p className="text-sm text-muted-foreground">
            {validCount > 0
              ? `${validCount} righe verranno importate`
              : 'Nessuna riga valida da importare'}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-16">Stato</TableHead>
                  {mappedFields.map(({ key, field }) => (
                    <TableHead key={key}>
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((row, i) => {
                  const rowErrors = errorsByRow.get(i);
                  const hasErrors = !!rowErrors;
                  return (
                    <TableRow
                      key={i}
                      className={hasErrors ? 'bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      <TableCell className="text-muted-foreground text-xs">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        {hasErrors ? (
                          <Badge variant="destructive" className="text-xs">
                            Errore
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 border-green-200"
                          >
                            OK
                          </Badge>
                        )}
                      </TableCell>
                      {mappedFields.map(({ header, key, field }) => {
                        const cellError = rowErrors?.find(
                          (e) => e.field === key
                        );
                        return (
                          <TableCell
                            key={key}
                            className={`max-w-[200px] truncate ${
                              cellError ? 'text-red-600' : ''
                            }`}
                            title={
                              cellError
                                ? cellError.message
                                : row[header] || ''
                            }
                          >
                            {row[header] || (
                              <span className="text-muted-foreground">
                                {field.required ? '(mancante)' : '—'}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {rows.length > 50 && (
            <p className="text-sm text-muted-foreground text-center py-3">
              Mostrando 50 di {rows.length} righe
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
