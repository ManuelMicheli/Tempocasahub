'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLeadFromCensus } from '@/lib/actions/census';
import type { CensusUnit, CensusBuilding, CensusOwner } from '@/types/database';

interface CensusCreateLeadFormProps {
  unit: CensusUnit;
  building: CensusBuilding;
  owners: CensusOwner[];
}

export function CensusCreateLeadForm({
  unit,
  building,
  owners,
}: CensusCreateLeadFormProps) {
  const [saving, setSaving] = useState(false);

  // Pre-fill from first owner if available
  const primaryOwner = owners[0];
  const fullAddress = `${building.address} ${building.civic_number}`;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    await createLeadFromCensus(unit.id, formData);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-green-500">
        <UserPlus className="h-4 w-4" />
        Crea Lead da Proprietario Interessato
      </div>

      <form action={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={primaryOwner?.full_name || ''}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="selling_address">Indirizzo Immobile</Label>
          <Input
            id="selling_address"
            name="selling_address"
            defaultValue={fullAddress}
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="selling_price_estimated">Prezzo Stimato (€)</Label>
          <Input
            id="selling_price_estimated"
            name="selling_price_estimated"
            type="number"
            placeholder="es. 180000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Note</Label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={
              unit.category
                ? `Cat. ${unit.category} — ${unit.sqm ? `${unit.sqm} mq` : ''} ${unit.rooms ? `${unit.rooms} vani` : ''} — ${unit.internal || ''}`
                : ''
            }
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Creazione lead...' : 'Crea Lead Venditore'}
        </Button>
      </form>
    </div>
  );
}
