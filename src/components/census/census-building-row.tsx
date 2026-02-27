'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CensusUnitRow } from './census-unit-row';
import type { CensusBuilding, CensusUnit, CensusOwner } from '@/types/database';

interface CensusBuildingRowProps {
  building: CensusBuilding;
  units: CensusUnit[];
  ownersByUnit: Map<string, CensusOwner[]>;
}

function getBuildingStatusColor(building: CensusBuilding): string {
  if (building.interested_count > 0) return 'bg-green-500';
  if (building.contacted_count === building.total_units && building.total_units > 0)
    return 'bg-blue-500';
  if (building.contacted_count > 0) return 'bg-orange-500';
  return 'bg-gray-500';
}

export function CensusBuildingRow({ building, units, ownersByUnit }: CensusBuildingRowProps) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getBuildingStatusColor(building);

  return (
    <div className="rounded-lg border">
      <button
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className={`h-3 w-3 shrink-0 rounded-full ${statusColor}`} />
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-medium">
          n. {building.civic_number}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {building.total_units} unità
          </Badge>
          <Badge
            variant={building.contacted_count > 0 ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {building.contacted_count}/{building.total_units} contattati
          </Badge>
          {building.interested_count > 0 && (
            <Badge className="bg-green-500/20 text-green-500 text-xs">
              {building.interested_count} interessati
            </Badge>
          )}
        </div>
      </button>

      {expanded && units.length > 0 && (
        <div className="border-t">
          {units.map((unit) => (
            <CensusUnitRow
              key={unit.id}
              unit={unit}
              building={building}
              owners={ownersByUnit.get(unit.id) ?? []}
            />
          ))}
        </div>
      )}

      {expanded && units.length === 0 && (
        <div className="border-t p-3 text-center text-sm text-muted-foreground">
          Nessuna unità trovata per questo edificio
        </div>
      )}
    </div>
  );
}
