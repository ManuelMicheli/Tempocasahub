'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tutti gli stati' },
  { value: 'new', label: 'Nuovo' },
  { value: 'contacted', label: 'Contattato' },
  { value: 'qualified', label: 'Qualificato' },
  { value: 'active', label: 'Attivo' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'negotiation', label: 'Trattativa' },
  { value: 'closed_won', label: 'Chiuso (vinto)' },
  { value: 'closed_lost', label: 'Chiuso (perso)' },
  { value: 'dormant', label: 'Dormiente' },
];

const TEMPERATURE_OPTIONS = [
  { value: 'all', label: 'Tutte le temperature' },
  { value: 'hot', label: 'Caldo' },
  { value: 'warm', label: 'Tiepido' },
  { value: 'cold', label: 'Freddo' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Tutte le fonti' },
  { value: 'portale', label: 'Portale immobiliare' },
  { value: 'passaparola', label: 'Passaparola' },
  { value: 'social', label: 'Social media' },
  { value: 'sito_web', label: 'Sito web' },
  { value: 'cartello', label: 'Cartello' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'telefono', label: 'Telefono' },
  { value: 'evento', label: 'Evento' },
  { value: 'altro', label: 'Altro' },
];

export function LeadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || 'all';
  const currentTemperature = searchParams.get('temperature') || 'all';
  const currentSource = searchParams.get('source') || 'all';

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
      <Input
        placeholder="Cerca nome, telefono, email..."
        defaultValue={currentSearch}
        onChange={(e) => {
          updateParams('search', e.target.value);
        }}
        className="sm:col-span-2 lg:w-64"
      />
      <Select
        value={currentStatus}
        onValueChange={(val) => updateParams('status', val)}
      >
        <SelectTrigger className="lg:w-44">
          <SelectValue placeholder="Stato" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={currentTemperature}
        onValueChange={(val) => updateParams('temperature', val)}
      >
        <SelectTrigger className="lg:w-44">
          <SelectValue placeholder="Temperatura" />
        </SelectTrigger>
        <SelectContent>
          {TEMPERATURE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={currentSource}
        onValueChange={(val) => updateParams('source', val)}
      >
        <SelectTrigger className="lg:w-44">
          <SelectValue placeholder="Fonte" />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
