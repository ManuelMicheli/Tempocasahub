'use client';

import { useMemo } from 'react';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { FieldDefinition } from '@/lib/import/field-mapping';

interface MappingStepProps {
  headers: string[];
  rows: Record<string, string>[];
  fields: FieldDefinition[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

export function MappingStep({
  headers,
  rows,
  fields,
  mapping,
  onMappingChange,
}: MappingStepProps) {
  const previewRows = useMemo(() => rows.slice(0, 3), [rows]);
  const requiredFields = useMemo(() => fields.filter((f) => f.required), [fields]);
  const mappedRequired = useMemo(
    () =>
      requiredFields.filter((f) =>
        Object.values(mapping).includes(f.key)
      ),
    [requiredFields, mapping]
  );

  const handleFieldChange = (header: string, fieldKey: string) => {
    const newMapping = { ...mapping };
    if (fieldKey === '_skip') {
      delete newMapping[header];
    } else {
      // Remove any existing mapping to this field
      for (const [h, fk] of Object.entries(newMapping)) {
        if (fk === fieldKey && h !== header) {
          delete newMapping[h];
        }
      }
      newMapping[header] = fieldKey;
    }
    onMappingChange(newMapping);
  };

  const usedFieldKeys = new Set(Object.values(mapping));

  return (
    <div className="space-y-4">
      {/* Required fields status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium mr-2">Campi obbligatori:</span>
            {requiredFields.map((f) => {
              const isMapped = Object.values(mapping).includes(f.key);
              return (
                <Badge
                  key={f.key}
                  variant={isMapped ? 'default' : 'destructive'}
                  className="gap-1"
                >
                  {isMapped ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {f.label}
                </Badge>
              );
            })}
            <span className="text-sm text-muted-foreground ml-auto">
              {mappedRequired.length}/{requiredFields.length} mappati
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Column mapping table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mapping colonne</CardTitle>
          <p className="text-sm text-muted-foreground">
            Associa ogni colonna del tuo file al campo corrispondente del CRM
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {headers.map((header) => (
              <div
                key={header}
                className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center"
              >
                {/* Source column */}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{header}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {previewRows.map((r) => r[header]).filter(Boolean).join(' | ') ||
                      '(vuoto)'}
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                {/* Target field */}
                <Select
                  value={mapping[header] || '_skip'}
                  onValueChange={(v) => handleFieldChange(header, v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Salta colonna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">
                      <span className="text-muted-foreground">— Salta colonna —</span>
                    </SelectItem>
                    {fields.map((field) => {
                      const isUsed =
                        usedFieldKeys.has(field.key) && mapping[header] !== field.key;
                      return (
                        <SelectItem
                          key={field.key}
                          value={field.key}
                          disabled={isUsed}
                        >
                          <span className={isUsed ? 'text-muted-foreground' : ''}>
                            {field.label}
                            {field.required && ' *'}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
