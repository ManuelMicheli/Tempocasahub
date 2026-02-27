'use client';

import { useState } from 'react';
import { Home, Eye, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CensusUnitDetail } from './census-unit-detail';
import type { CensusUnit, CensusBuilding, CensusOwner } from '@/types/database';

interface CensusUnitRowProps {
  unit: CensusUnit;
  building: CensusBuilding;
  owners: CensusOwner[];
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  not_contacted: { label: 'Non contattato', variant: 'outline' },
  contacted: { label: 'Contattato', variant: 'secondary' },
  interested: { label: 'Interessato', variant: 'default' },
  not_interested: { label: 'Non interessato', variant: 'destructive' },
  callback: { label: 'Richiamare', variant: 'secondary' },
  lead_created: { label: 'Lead creato', variant: 'default' },
};

export function CensusUnitRow({ unit, building, owners }: CensusUnitRowProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const statusInfo = STATUS_LABELS[unit.contact_status] || STATUS_LABELS.not_contacted;

  return (
    <>
      <div className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-accent/30">
        <Home className="h-4 w-4 shrink-0 text-muted-foreground" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {unit.internal || `Sub. ${unit.sub || '?'}`}
            </span>
            {unit.floor && (
              <span className="text-xs text-muted-foreground">
                Piano {unit.floor === 'T' ? 'Terra' : unit.floor}
              </span>
            )}
            {unit.category && (
              <Badge variant="outline" className="text-[10px]">
                {unit.category}
              </Badge>
            )}
          </div>

          {/* Proprietari */}
          {owners.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground">
                {owners.map((o) => o.full_name).join(', ')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {unit.sqm && <span>{unit.sqm} mq</span>}
            {unit.rooms && <span>{unit.rooms} vani</span>}
            {unit.cadastral_income && (
              <span>
                R.C. €{Number(unit.cadastral_income).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        <Badge variant={statusInfo.variant} className="text-xs shrink-0">
          {statusInfo.label}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDetailOpen(true)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      <CensusUnitDetail
        unit={unit}
        building={building}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
