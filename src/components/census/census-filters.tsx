'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CensusFiltersProps {
  streets: string[];
}

const CONTACT_STATUSES = [
  { value: 'all', label: 'Tutti gli stati' },
  { value: 'not_contacted', label: 'Non contattati' },
  { value: 'contacted', label: 'Contattati' },
  { value: 'interested', label: 'Interessati' },
  { value: 'not_interested', label: 'Non interessati' },
  { value: 'callback', label: 'Da richiamare' },
  { value: 'lead_created', label: 'Lead creato' },
];

export function CensusFilters({ streets }: CensusFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={searchParams.get('status') || 'all'}
        onValueChange={(v) => updateParam('status', v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Stato contatto" />
        </SelectTrigger>
        <SelectContent>
          {CONTACT_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {streets.length > 0 && (
        <Select
          value={searchParams.get('street') || 'all'}
          onValueChange={(v) => updateParam('street', v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Via" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le vie</SelectItem>
            {streets.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
