'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tutti gli stati' },
  { value: 'draft', label: 'Bozza' },
  { value: 'available', label: 'Disponibile' },
  { value: 'reserved', label: 'Riservato' },
  { value: 'sold', label: 'Venduto' },
  { value: 'withdrawn', label: 'Ritirato' },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: 'all', label: 'Tutte le tipologie' },
  { value: 'appartamento', label: 'Appartamento' },
  { value: 'villa', label: 'Villa' },
  { value: 'loft', label: 'Loft' },
  { value: 'bilocale', label: 'Bilocale' },
  { value: 'trilocale', label: 'Trilocale' },
  { value: 'attico', label: 'Attico' },
  { value: 'monolocale', label: 'Monolocale' },
  { value: 'casa_indipendente', label: 'Casa indipendente' },
];

export function PropertyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value && value !== 'all') {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      }
      return current.toString();
    },
    [searchParams]
  );

  function updateParam(key: string, value: string) {
    const qs = createQueryString({ [key]: value });
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card/50 p-4">
      {/* Search */}
      <div className="w-full sm:w-auto sm:min-w-[220px]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per titolo, indirizzo..."
            className="pl-9"
            defaultValue={searchParams.get('q') ?? ''}
            onBlur={(e) => updateParam('q', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParam('q', (e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>
      </div>

      {/* Status */}
      <div className="w-full sm:w-auto sm:min-w-[160px]">
        <Select
          value={searchParams.get('status') ?? 'all'}
          onValueChange={(v) => updateParam('status', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="w-full sm:w-auto sm:min-w-[140px]">
        <Input
          placeholder="Citta"
          defaultValue={searchParams.get('city') ?? ''}
          onBlur={(e) => updateParam('city', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('city', (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>

      {/* Price min */}
      <div className="w-full sm:w-auto sm:min-w-[120px]">
        <Input
          type="number"
          placeholder="Prezzo min"
          defaultValue={searchParams.get('price_min') ?? ''}
          onBlur={(e) => updateParam('price_min', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('price_min', (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>

      {/* Price max */}
      <div className="w-full sm:w-auto sm:min-w-[120px]">
        <Input
          type="number"
          placeholder="Prezzo max"
          defaultValue={searchParams.get('price_max') ?? ''}
          onBlur={(e) => updateParam('price_max', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('price_max', (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>

      {/* Property type */}
      <div className="w-full sm:w-auto sm:min-w-[170px]">
        <Select
          value={searchParams.get('type') ?? 'all'}
          onValueChange={(v) => updateParam('type', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipologia" />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rooms min */}
      <div className="w-full sm:w-auto sm:min-w-[110px]">
        <Input
          type="number"
          placeholder="Locali min"
          min={0}
          defaultValue={searchParams.get('rooms_min') ?? ''}
          onBlur={(e) => updateParam('rooms_min', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('rooms_min', (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Cancella filtri
        </Button>
      )}
    </div>
  );
}
