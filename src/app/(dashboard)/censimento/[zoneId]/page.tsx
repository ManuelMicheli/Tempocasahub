import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { Button } from '@/components/ui/button';
import { CensusZoneStats } from '@/components/census/census-zone-stats';
import { CensusViewToggle } from '@/components/census/census-view-toggle';
import { CensusFilters } from '@/components/census/census-filters';
import { CensusListView } from '@/components/census/census-list-view';
import { CensusMapView } from '@/components/census/census-map-view';
import { CensusSyncButton } from '@/components/census/census-sync-button';
import { PageTransition } from '@/components/motion';
import type { CensusZone, CensusBuilding, CensusUnit, CensusOwner } from '@/types/database';

interface ZonePageProps {
  params: Promise<{ zoneId: string }>;
  searchParams: Promise<{
    view?: string;
    status?: string;
    street?: string;
  }>;
}

export default async function CensusZonePage({ params, searchParams }: ZonePageProps) {
  const { zoneId } = await params;
  const search = await searchParams;
  const supabase = await createClient();
  const agent = await getCurrentAgent();

  if (!agent) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Non autenticato. Effettua il login.
      </div>
    );
  }

  // Fetch zone
  const { data: zone } = await supabase
    .from('census_zones')
    .select('*')
    .eq('id', zoneId)
    .single();

  if (!zone) notFound();

  const censusZone = zone as CensusZone;

  // Fetch buildings
  const { data: buildings } = await supabase
    .from('census_buildings')
    .select('*')
    .eq('zone_id', zoneId)
    .order('address', { ascending: true })
    .order('civic_number', { ascending: true });
  const censusBuildings = (buildings ?? []) as CensusBuilding[];

  // Fetch all units for these buildings
  const buildingIds = censusBuildings.map((b) => b.id);
  let unitsQuery = supabase
    .from('census_units')
    .select('*')
    .in('building_id', buildingIds.length > 0 ? buildingIds : ['__none__'])
    .order('floor', { ascending: true })
    .order('internal', { ascending: true });

  if (search.status && search.status !== 'all') {
    unitsQuery = unitsQuery.eq('contact_status', search.status);
  }

  const { data: units } = await unitsQuery;
  const censusUnits = (units ?? []) as CensusUnit[];

  // Fetch owners for all units
  const unitIds = censusUnits.map((u) => u.id);
  const { data: owners } = await supabase
    .from('census_owners')
    .select('*')
    .in('unit_id', unitIds.length > 0 ? unitIds : ['__none__']);
  const censusOwners = (owners ?? []) as CensusOwner[];

  // Group owners by unit
  const ownersByUnit = new Map<string, CensusOwner[]>();
  for (const owner of censusOwners) {
    const list = ownersByUnit.get(owner.unit_id) ?? [];
    list.push(owner);
    ownersByUnit.set(owner.unit_id, list);
  }

  // Filter buildings by street if needed
  const filteredBuildings = search.street && search.street !== 'all'
    ? censusBuildings.filter((b) =>
        b.address.toLowerCase().includes(search.street!.toLowerCase())
      )
    : censusBuildings;

  // Group units by building
  const unitsByBuilding = new Map<string, CensusUnit[]>();
  for (const unit of censusUnits) {
    const list = unitsByBuilding.get(unit.building_id) ?? [];
    list.push(unit);
    unitsByBuilding.set(unit.building_id, list);
  }

  // Get unique street names for filter
  const streets = Array.from(new Set(censusBuildings.map((b) => b.address))).sort();

  // Default view: map. URL param overrides.
  const viewMode = search.view === 'list' ? 'list' : 'map';

  return (
    <PageTransition>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Censimento — {censusZone.name}</h1>
          <p className="text-sm text-muted-foreground">
            {censusZone.province && `${censusZone.province} `}
            {censusZone.municipality_code && `· Cod. ${censusZone.municipality_code} `}
            · {censusZone.total_buildings} edifici · {censusZone.total_units} unità
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/censimento/import?zoneId=${zoneId}`}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Importa da Elettra
            </Link>
          </Button>
          <CensusSyncButton zoneId={zoneId} syncedAt={censusZone.synced_at} />
        </div>
      </div>

      {/* KPI Bar */}
      <CensusZoneStats zone={censusZone} />

      {/* Filters + View Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <CensusFilters streets={streets} />
        <div className="ml-auto">
          <CensusViewToggle currentView={viewMode} />
        </div>
      </div>

      {/* Content: mappa + lista sotto, oppure solo uno dei due */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <CensusMapView
            buildings={filteredBuildings}
            unitsByBuilding={unitsByBuilding}
            zone={censusZone}
          />
          {/* Lista compatta sotto la mappa */}
          <CensusListView
            buildings={filteredBuildings}
            unitsByBuilding={unitsByBuilding}
            ownersByUnit={ownersByUnit}
          />
        </div>
      ) : (
        <CensusListView
          buildings={filteredBuildings}
          unitsByBuilding={unitsByBuilding}
          ownersByUnit={ownersByUnit}
        />
      )}
    </div>
    </PageTransition>
  );
}
