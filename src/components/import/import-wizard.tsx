'use client';

import { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UploadStep } from './upload-step';
import { MappingStep } from './mapping-step';
import { PreviewStep, type ImportResult } from './preview-step';
import { parseMultipleFiles, filterValidFiles, type ParseResult } from '@/lib/import/parsers';
import {
  LEAD_FIELDS,
  PROPERTY_FIELDS,
  autoMapColumns,
  type FieldDefinition,
} from '@/lib/import/field-mapping';
import { transformRow } from '@/lib/import/validators';
import { validateLeadRows, validatePropertyRows } from '@/lib/import/validators';
import { downloadLeadTemplate, downloadPropertyTemplate } from '@/lib/import/templates';
import { importLeads, importProperties } from '@/app/(dashboard)/settings/import/actions';

type ImportType = 'leads' | 'properties';
type Step = 'type' | 'upload' | 'mapping' | 'preview';

const STEPS: { key: Step; label: string }[] = [
  { key: 'type', label: 'Tipo dati' },
  { key: 'upload', label: 'Carica file' },
  { key: 'mapping', label: 'Mapping' },
  { key: 'preview', label: 'Importa' },
];

export function ImportWizard() {
  const [step, setStep] = useState<Step>('type');
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [skippedFiles, setSkippedFiles] = useState<string[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fields: FieldDefinition[] = useMemo(
    () => (importType === 'leads' ? LEAD_FIELDS : PROPERTY_FIELDS),
    [importType]
  );

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const validationResult = useMemo(() => {
    if (!parseResult || !mapping || step !== 'preview') return null;
    if (importType === 'leads') {
      return validateLeadRows(parseResult.rows, mapping);
    }
    return validatePropertyRows(parseResult.rows, mapping);
  }, [parseResult, mapping, importType, step]);

  const validRowCount = useMemo(() => {
    if (!validationResult || !parseResult) return 0;
    const errorRows = new Set(validationResult.errors.map((e) => e.row));
    return parseResult.rows.length - errorRows.size;
  }, [validationResult, parseResult]);

  // --- Handlers ---

  const handleTypeSelect = (type: ImportType) => {
    setImportType(type);
    setStep('upload');
    setFiles([]);
    setSkippedFiles([]);
    setParseResult(null);
    setMapping({});
    setImportResult(null);
  };

  const handleFilesSelected = useCallback(
    async (rawFiles: File[]) => {
      if (rawFiles.length === 0) {
        setFiles([]);
        setSkippedFiles([]);
        setParseResult(null);
        setMapping({});
        return;
      }

      const { valid, skipped } = filterValidFiles(rawFiles);
      setFiles(valid);
      setSkippedFiles(skipped);

      if (valid.length === 0) {
        setParseResult(null);
        setMapping({});
        return;
      }

      // Parse all files and merge
      setParsing(true);
      try {
        const result = await parseMultipleFiles(valid);
        setParseResult(result);

        // Auto-map columns
        if (result.headers.length > 0 && importType) {
          const autoMapping = autoMapColumns(
            result.headers,
            importType === 'leads' ? LEAD_FIELDS : PROPERTY_FIELDS
          );
          setMapping(autoMapping);
        }
      } finally {
        setParsing(false);
      }
    },
    [importType]
  );

  const handleImport = async () => {
    if (!parseResult || !importType || !validationResult) return;

    setImporting(true);
    try {
      const errorRows = new Set(validationResult.errors.map((e) => e.row));
      const validRows = parseResult.rows.filter((_, i) => !errorRows.has(i));

      const transformedRows = validRows.map((row) =>
        transformRow(row, mapping, fields)
      );

      let result: ImportResult;
      if (importType === 'leads') {
        result = await importLeads(transformedRows);
      } else {
        result = await importProperties(transformedRows);
      }

      setImportResult(result);
    } catch (err) {
      setImportResult({
        imported: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : 'Errore durante l\'importazione'],
        total: parseResult.rows.length,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setStep('type');
    setImportType(null);
    setFiles([]);
    setSkippedFiles([]);
    setParseResult(null);
    setMapping({});
    setImportResult(null);
  };

  const canProceed = () => {
    switch (step) {
      case 'type':
        return !!importType;
      case 'upload':
        return !parsing && !!parseResult && parseResult.rows.length > 0;
      case 'mapping': {
        const requiredFields = fields.filter((f) => f.required);
        return requiredFields.every((f) => Object.values(mapping).includes(f.key));
      }
      case 'preview':
        return validRowCount > 0 && !importing;
      default:
        return false;
    }
  };

  const goNext = () => {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  };

  const goBack = () => {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                i === currentStepIndex
                  ? 'bg-primary text-primary-foreground font-medium'
                  : i < currentStepIndex
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                {i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-muted-foreground/25 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 'type' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">Cosa vuoi importare?</h3>
            <p className="text-sm text-muted-foreground">
              Scegli il tipo di dati da importare e scarica il template se necessario
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className={`cursor-pointer transition-all ${
                importType === 'leads'
                  ? 'ring-2 ring-primary'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleTypeSelect('leads')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Lead
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Importa i tuoi clienti (acquirenti e venditori) con le loro esigenze di ricerca e dati di contatto.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadLeadTemplate();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Scarica template CSV
                </Button>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                importType === 'properties'
                  ? 'ring-2 ring-primary'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleTypeSelect('properties')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Immobili
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Importa il tuo portafoglio immobili con caratteristiche, prezzi e dotazioni.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadPropertyTemplate();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Scarica template CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">Carica i tuoi file</h3>
            <p className="text-sm text-muted-foreground">
              Carica uno o piu file CSV/Excel, oppure un&apos;intera cartella.
              I dati verranno unificati automaticamente.
            </p>
          </div>

          <UploadStep
            onFilesSelected={handleFilesSelected}
            selectedFiles={files}
            skippedFiles={skippedFiles}
          />

          {parsing && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analisi dei file in corso...</span>
              </CardContent>
            </Card>
          )}

          {!parsing && parseResult && parseResult.rows.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    <strong>{parseResult.totalRows}</strong> righe trovate
                  </span>
                  <span>
                    <strong>{parseResult.headers.length}</strong> colonne
                  </span>
                  <span>
                    da <strong>{files.length}</strong> file
                  </span>
                  {parseResult.errors.length > 0 && (
                    <span className="text-yellow-600">
                      {parseResult.errors.length} avvisi di parsing
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!parsing && parseResult && parseResult.errors.length > 0 && parseResult.rows.length === 0 && (
            <Card className="border-red-200">
              <CardContent className="p-4">
                <p className="text-sm text-red-600 font-medium mb-1">
                  Errore nel parsing dei file:
                </p>
                {parseResult.errors.map((err, i) => (
                  <p key={i} className="text-sm text-red-600">{err}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {step === 'mapping' && parseResult && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">Mappa le colonne</h3>
            <p className="text-sm text-muted-foreground">
              Associa le colonne del tuo file ai campi del CRM. Abbiamo pre-compilato i
              match trovati automaticamente.
            </p>
          </div>

          <MappingStep
            headers={parseResult.headers}
            rows={parseResult.rows}
            fields={fields}
            mapping={mapping}
            onMappingChange={setMapping}
          />
        </div>
      )}

      {step === 'preview' && parseResult && validationResult && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">
              {importResult ? 'Risultato importazione' : 'Anteprima e importazione'}
            </h3>
            {!importResult && (
              <p className="text-sm text-muted-foreground">
                Verifica i dati prima di procedere con l&apos;importazione
                {files.length > 1 && ` (${files.length} file unificati)`}
              </p>
            )}
          </div>

          <PreviewStep
            rows={parseResult.rows}
            mapping={mapping}
            fields={fields}
            validationErrors={validationResult.errors}
            importResult={importResult}
          />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {step !== 'type' && !importResult && (
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {importResult && (
            <Button onClick={handleReset}>
              <Upload className="h-4 w-4 mr-2" />
              Nuova importazione
            </Button>
          )}
          {step === 'preview' && !importResult && (
            <Button
              onClick={handleImport}
              disabled={!canProceed() || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importazione in corso...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importa {validRowCount} righe
                </>
              )}
            </Button>
          )}
          {step !== 'type' && step !== 'preview' && (
            <Button onClick={goNext} disabled={!canProceed()}>
              Avanti
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
