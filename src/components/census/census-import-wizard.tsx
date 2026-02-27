'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, ArrowLeft, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseFile, filterValidFiles, type ParseResult } from '@/lib/import/parsers';
import { CENSUS_FIELDS, validateCensusRows } from '@/lib/import/census-fields';
import { autoMapColumns } from '@/lib/import/field-mapping';
import { transformRow } from '@/lib/import/validators';
import { importCensusData } from '@/app/(dashboard)/censimento/import/actions';
import type { CensusImportResult } from '@/app/(dashboard)/censimento/import/actions';

interface CensusImportWizardProps {
  zoneId: string;
  zoneName: string;
}

type Step = 'upload' | 'mapping' | 'preview' | 'result';

export function CensusImportWizard({ zoneId, zoneName }: CensusImportWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CensusImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Step 1: File upload
  const handleFile = useCallback(async (f: File) => {
    const { valid, skipped } = filterValidFiles([f]);
    if (valid.length === 0) {
      alert(`File non supportato: ${skipped.join(', ')}. Usa CSV, XLSX o XLS.`);
      return;
    }
    setFile(f);
    const parsed = await parseFile(f);
    setParseResult(parsed);
    // Auto-map columns
    const autoMap = autoMapColumns(parsed.headers, CENSUS_FIELDS);
    setMapping(autoMap);
    setStep('mapping');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  // Step 2: Column mapping
  const updateMapping = (header: string, fieldKey: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (fieldKey === '_skip') {
        delete next[header];
      } else {
        // Remove fieldKey from any other header
        for (const [h, fk] of Object.entries(next)) {
          if (fk === fieldKey && h !== header) {
            delete next[h];
          }
        }
        next[header] = fieldKey;
      }
      return next;
    });
  };

  const usedFieldKeys = new Set(Object.values(mapping));
  const requiredFields = CENSUS_FIELDS.filter((f) => f.required);
  const allRequiredMapped = requiredFields.every((f) => usedFieldKeys.has(f.key));

  // Step 3: Preview & import
  const handleImport = async () => {
    if (!parseResult) return;

    setImporting(true);
    try {
      // Transform rows using mapping
      const transformedRows = parseResult.rows.map((row) =>
        transformRow(row, mapping, CENSUS_FIELDS)
      );

      const importResult = await importCensusData(zoneId, transformedRows);
      setResult(importResult);
      setStep('result');
    } catch (err) {
      setResult({
        buildings: 0,
        units: 0,
        owners: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : 'Errore sconosciuto'],
      });
      setStep('result');
    } finally {
      setImporting(false);
    }
  };

  // Validation preview
  const validationResult = parseResult
    ? validateCensusRows(parseResult.rows, mapping)
    : null;
  const validRows = parseResult
    ? parseResult.rows.length - (validationResult?.errors.length ?? 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <StepBadge label="1. Carica file" active={step === 'upload'} done={step !== 'upload'} />
        <span className="text-muted-foreground">&rarr;</span>
        <StepBadge label="2. Mappa colonne" active={step === 'mapping'} done={step === 'preview' || step === 'result'} />
        <span className="text-muted-foreground">&rarr;</span>
        <StepBadge label="3. Importa" active={step === 'preview'} done={step === 'result'} />
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importa dati da Elettra
            </CardTitle>
            <CardDescription>
              Carica il file CSV o Excel esportato dalla piattaforma Elettra con i dati catastali
              della zona {zoneName}. Il file deve contenere almeno le colonne indirizzo e civico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`
                relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed
                p-12 transition-colors
                ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              `}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium">
                Trascina il file qui, oppure
              </p>
              <label>
                <Button variant="outline" asChild>
                  <span>Seleziona file</span>
                </Button>
                <input
                  type="file"
                  className="sr-only"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                />
              </label>
              <p className="mt-3 text-xs text-muted-foreground">
                Formati supportati: CSV, XLSX, XLS (max 10 MB)
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold">Colonne supportate:</h4>
              <div className="flex flex-wrap gap-1.5">
                {CENSUS_FIELDS.map((f) => (
                  <Badge key={f.key} variant={f.required ? 'default' : 'outline'} className="text-xs">
                    {f.label} {f.required && '*'}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                * = obbligatorio. Le colonne vengono mappate automaticamente dai nomi del file.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && parseResult && (
        <Card>
          <CardHeader>
            <CardTitle>Mappa colonne</CardTitle>
            <CardDescription>
              Verifica che le colonne del file siano associate correttamente ai campi del censimento.
              {file && (
                <span className="ml-1 font-medium">{file.name} — {parseResult.totalRows} righe trovate</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required fields status */}
            <div className="flex flex-wrap gap-2">
              {requiredFields.map((f) => (
                <Badge
                  key={f.key}
                  variant={usedFieldKeys.has(f.key) ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {f.label} {usedFieldKeys.has(f.key) ? '✓' : '✗'}
                </Badge>
              ))}
            </div>

            {/* Mapping table */}
            <div className="max-h-[400px] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Colonna file</th>
                    <th className="px-3 py-2 text-left font-medium">Anteprima</th>
                    <th className="px-3 py-2 text-left font-medium">Campo CRM</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.headers.map((header) => (
                    <tr key={header} className="border-b">
                      <td className="px-3 py-2 font-mono text-xs">{header}</td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-xs text-muted-foreground">
                        {parseResult.rows.slice(0, 3).map((r) => r[header]).filter(Boolean).join(' | ')}
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={mapping[header] || '_skip'}
                          onValueChange={(val) => updateMapping(header, val)}
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_skip">— Salta —</SelectItem>
                            {CENSUS_FIELDS.map((f) => (
                              <SelectItem
                                key={f.key}
                                value={f.key}
                                disabled={usedFieldKeys.has(f.key) && mapping[header] !== f.key}
                              >
                                {f.label} {f.required ? '*' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Indietro
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!allRequiredMapped}
              >
                Avanti
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview & Import */}
      {step === 'preview' && parseResult && (
        <Card>
          <CardHeader>
            <CardTitle>Anteprima importazione</CardTitle>
            <CardDescription>
              Verifica i dati prima di importarli nella zona {zoneName}.
              I dati esistenti verranno sostituiti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard label="Righe totali" value={parseResult.totalRows} />
              <SummaryCard label="Righe valide" value={validRows} variant="success" />
              <SummaryCard
                label="Righe con errori"
                value={validationResult?.errors.length ?? 0}
                variant={(validationResult?.errors.length ?? 0) > 0 ? 'error' : 'default'}
              />
              <SummaryCard
                label="Colonne mappate"
                value={Object.keys(mapping).length}
              />
            </div>

            {/* Validation errors */}
            {validationResult && validationResult.errors.length > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    {validationResult.errors.length} errori trovati
                  </span>
                </div>
                <div className="max-h-[150px] overflow-auto text-xs text-destructive/80 space-y-0.5">
                  {validationResult.errors.slice(0, 20).map((e, i) => (
                    <div key={i}>
                      Riga {e.row + 2}: {e.message}
                    </div>
                  ))}
                  {validationResult.errors.length > 20 && (
                    <div className="font-medium mt-1">
                      ... e altri {validationResult.errors.length - 20} errori
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview table */}
            <div className="max-h-[300px] overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="px-2 py-1.5 text-left font-medium">#</th>
                    {Object.entries(mapping).map(([header, fieldKey]) => {
                      const field = CENSUS_FIELDS.find((f) => f.key === fieldKey);
                      return (
                        <th key={header} className="px-2 py-1.5 text-left font-medium">
                          {field?.label || header}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.slice(0, 30).map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      {Object.keys(mapping).map((header) => (
                        <td key={header} className="max-w-[150px] truncate px-2 py-1.5">
                          {row[header] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parseResult.totalRows > 30 && (
              <p className="text-xs text-muted-foreground text-center">
                Mostrate le prime 30 righe di {parseResult.totalRows}
              </p>
            )}

            <div className="rounded-md border border-orange-500/50 bg-orange-500/10 p-3">
              <p className="text-sm text-orange-600 dark:text-orange-400">
                <strong>Attenzione:</strong> l&apos;importazione sostituirà tutti i dati esistenti della zona.
                I dati di contatto (stati, log, lead collegati) andranno persi.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Indietro
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || validRows === 0}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Importazione in corso...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Importa {validRows} righe
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Result */}
      {step === 'result' && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.errors.length === 0 ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
              Importazione completata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard label="Edifici creati" value={result.buildings} variant="success" />
              <SummaryCard label="Unità create" value={result.units} variant="success" />
              <SummaryCard label="Proprietari" value={result.owners} variant="success" />
              <SummaryCard
                label="Righe saltate"
                value={result.skipped}
                variant={result.skipped > 0 ? 'error' : 'default'}
              />
            </div>

            {result.owners > 0 && (
              <div className="rounded-md border border-blue-500/50 bg-blue-500/10 p-3">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  I proprietari sono nella sezione Censimento. Per convertirli in lead,
                  apri la scheda dell&apos;unità e clicca &quot;Crea Lead&quot; dopo il contatto.
                </p>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">{err}</p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setStep('upload');
                setFile(null);
                setParseResult(null);
                setMapping({});
                setResult(null);
              }}>
                Nuova importazione
              </Button>
              <Button asChild>
                <a href={`/censimento/${zoneId}`}>
                  Vai alla zona
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Helper components ---

function StepBadge({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <Badge
      variant={active ? 'default' : done ? 'secondary' : 'outline'}
      className="text-xs"
    >
      {done && !active && <Check className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}

function SummaryCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'error';
}) {
  const colorClass = variant === 'success'
    ? 'text-green-500'
    : variant === 'error'
      ? 'text-destructive'
      : '';

  return (
    <div className="rounded-lg border p-3 text-center">
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
