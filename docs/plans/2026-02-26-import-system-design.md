# Sistema di Importazione Dati — Design

## Obiettivo
Permettere agli agenti di importare lead e immobili da file CSV/Excel (export da portali, gestionali, fogli personali) tramite un wizard guidato con mapping colonne e template scaricabili.

## Funzionalità
1. **Template scaricabili** — CSV precompilati per Lead e Immobili
2. **Upload file** — CSV, XLSX, XLS con drag & drop
3. **Mapping colonne** — Auto-detect + mapping manuale
4. **Validazione** — Preview con errori inline
5. **Importazione batch** — Server action con report finale

## Componenti

| File | Scopo |
|---|---|
| `src/app/(dashboard)/settings/import/page.tsx` | Pagina principale |
| `src/app/(dashboard)/settings/import/actions.ts` | Server actions |
| `src/components/import/import-wizard.tsx` | Wizard container |
| `src/components/import/upload-step.tsx` | Step 1: Upload |
| `src/components/import/mapping-step.tsx` | Step 2: Mapping |
| `src/components/import/preview-step.tsx` | Step 3: Preview |
| `src/lib/import/parsers.ts` | CSV/Excel parsing |
| `src/lib/import/field-mapping.ts` | Auto-mapping + definitions |
| `src/lib/import/validators.ts` | Row validation |
| `src/lib/import/templates.ts` | Template CSV generation |

## Dipendenze
- `papaparse` — CSV parsing
- `xlsx` — Excel parsing

## Flusso
Upload → Parse → Auto-map → User mapping → Validate → Preview → Bulk insert → Report
