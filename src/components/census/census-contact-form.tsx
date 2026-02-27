'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateCensusContactStatus } from '@/lib/actions/census';
import type { CensusUnit, CensusContactStatus } from '@/types/database';

interface CensusContactFormProps {
  unit: CensusUnit;
}

const STATUS_OPTIONS: { value: CensusContactStatus; label: string }[] = [
  { value: 'contacted', label: 'Contattato' },
  { value: 'interested', label: 'Interessato' },
  { value: 'not_interested', label: 'Non interessato' },
  { value: 'callback', label: 'Da richiamare' },
];

export function CensusContactForm({ unit }: CensusContactFormProps) {
  const [status, setStatus] = useState<CensusContactStatus>(unit.contact_status);
  const [notes, setNotes] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateCensusContactStatus(
      unit.id,
      status,
      notes || undefined,
      callbackDate || undefined
    );

    if (result?.error) {
      alert(result.error);
    } else {
      router.refresh();
    }

    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Esito contatto</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as CensusContactStatus)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona esito" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {status === 'callback' && (
        <div className="space-y-2">
          <Label htmlFor="callback_date">Data richiamo</Label>
          <Input
            id="callback_date"
            type="date"
            value={callbackDate}
            onChange={(e) => setCallbackDate(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Note</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Appunti sul contatto..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Salvataggio...' : 'Aggiorna Stato'}
      </Button>
    </form>
  );
}
