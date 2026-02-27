'use client';

import { StaggerContainer, StaggerItem } from '@/components/motion';
import { CensusBuildingRow } from './census-building-row';
import type { CensusBuilding, CensusUnit, CensusOwner } from '@/types/database';

interface CensusListViewProps {
  buildings: CensusBuilding[];
  unitsByBuilding: Map<string, CensusUnit[]>;
  ownersByUnit: Map<string, CensusOwner[]>;
}

export function CensusListView({ buildings, unitsByBuilding, ownersByUnit }: CensusListViewProps) {
  if (buildings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Nessun edificio trovato. Sincronizza i dati catastali per popolare la lista.
      </div>
    );
  }

  // Group buildings by street
  const byStreet = new Map<string, CensusBuilding[]>();
  for (const b of buildings) {
    const list = byStreet.get(b.address) ?? [];
    list.push(b);
    byStreet.set(b.address, list);
  }

  const sortedStreets = Array.from(byStreet.keys()).sort();

  return (
    <StaggerContainer className="space-y-4">
      {sortedStreets.map((street) => {
        const streetBuildings = byStreet.get(street)!;
        return (
          <StaggerItem key={street}>
          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {street}
            </h3>
            <div className="space-y-1">
              {streetBuildings.map((building) => (
                <CensusBuildingRow
                  key={building.id}
                  building={building}
                  units={unitsByBuilding.get(building.id) ?? []}
                  ownersByUnit={ownersByUnit}
                />
              ))}
            </div>
          </div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
