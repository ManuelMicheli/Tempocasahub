'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { CensusBuilding, CensusUnit, CensusZone } from '@/types/database';

const CensusMapInner = dynamic(() => import('./census-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-lg border bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Caricamento mappa...
      </div>
    </div>
  ),
});

interface CensusMapViewProps {
  buildings: CensusBuilding[];
  unitsByBuilding: Map<string, CensusUnit[]>;
  zone: CensusZone;
}

export function CensusMapView({ buildings, unitsByBuilding, zone }: CensusMapViewProps) {
  // Serialize Map to plain object for the dynamic import component
  const unitsByBuildingObj: Record<string, CensusUnit[]> = {};
  unitsByBuilding.forEach((units, key) => {
    unitsByBuildingObj[key] = units;
  });

  return (
    <CensusMapInner
      buildings={buildings}
      unitsByBuildingObj={unitsByBuildingObj}
      zone={zone}
    />
  );
}
