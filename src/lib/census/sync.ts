// ============================================================
// Census Sync — orchestrates fetch + geocode + save to Supabase
// Optimized with batch inserts for speed
// Owners stay in census_owners only — leads are created manually
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { getCadastralProvider } from './providers';
import { geocodeAddress, delay } from './geocoding';
import type { CadastralBuilding } from './cadastral-provider';

export async function syncCensusZone(
  zoneId: string
): Promise<{ buildings: number; units: number; error?: string }> {
  const supabase = await createClient();
  const provider = getCadastralProvider();

  // Get zone details
  const { data: zone, error: zoneError } = await supabase
    .from('census_zones')
    .select('*')
    .eq('id', zoneId)
    .single();

  if (zoneError || !zone) {
    return { buildings: 0, units: 0, error: 'Zona non trovata' };
  }

  // Phase 1: Fetch cadastral data (instant for mock)
  const municipalityCode = zone.municipality_code || zone.name;
  let cadastralBuildings: CadastralBuilding[];

  try {
    cadastralBuildings = await provider.fetchBuildings(municipalityCode);
  } catch (err) {
    return {
      buildings: 0,
      units: 0,
      error: `Errore nel recupero dati catastali: ${err instanceof Error ? err.message : 'sconosciuto'}`,
    };
  }

  if (cadastralBuildings.length === 0) {
    return { buildings: 0, units: 0, error: 'Nessun edificio trovato' };
  }

  // Phase 2: Geocode only buildings without coordinates
  const addressCoords = new Map<string, { lat: number; lng: number } | null>();

  for (const b of cadastralBuildings) {
    if (b.lat != null && b.lng != null) {
      addressCoords.set(`${b.address} ${b.civic_number}`, { lat: b.lat, lng: b.lng });
    }
  }

  const needGeocode = cadastralBuildings.filter((b) => {
    return !addressCoords.has(`${b.address} ${b.civic_number}`);
  });

  for (let i = 0; i < needGeocode.length; i++) {
    const b = needGeocode[i];
    const key = `${b.address} ${b.civic_number}`;
    const coords = await geocodeAddress(key, zone.name, zone.province);
    addressCoords.set(key, coords);
    if (i < needGeocode.length - 1) await delay(1100);
  }

  // Phase 3: Save — delete old data, then batch insert
  await supabase.from('census_buildings').delete().eq('zone_id', zoneId);

  // Batch insert ALL buildings at once
  const buildingRows = cadastralBuildings.map((b) => {
    const coords = addressCoords.get(`${b.address} ${b.civic_number}`);
    return {
      zone_id: zoneId,
      address: b.address,
      civic_number: b.civic_number,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      total_units: b.units.length,
    };
  });

  const { data: insertedBuildings, error: bError } = await supabase
    .from('census_buildings')
    .insert(buildingRows)
    .select();

  if (bError || !insertedBuildings) {
    return { buildings: 0, units: 0, error: bError?.message || 'Errore inserimento edifici' };
  }

  // Build a map: "address|civic" -> building id
  const buildingIdMap = new Map<string, string>();
  for (const b of insertedBuildings) {
    buildingIdMap.set(`${b.address}|${b.civic_number}`, b.id);
  }

  // Batch insert ALL units at once
  const allUnitRows: Record<string, unknown>[] = [];
  const unitMeta: { sheet: string; parcel: string; sub: string }[] = [];

  for (const b of cadastralBuildings) {
    const buildingId = buildingIdMap.get(`${b.address}|${b.civic_number}`);
    if (!buildingId) continue;

    for (const u of b.units) {
      allUnitRows.push({
        building_id: buildingId,
        sheet: u.sheet ?? null,
        parcel: u.parcel ?? null,
        sub: u.sub ?? null,
        category: u.category ?? null,
        class: u.class ?? null,
        consistency: u.consistency ?? null,
        cadastral_income: u.cadastral_income ?? null,
        sqm: u.sqm ?? null,
        rooms: u.rooms ?? null,
        floor: u.floor ?? null,
        internal: u.internal ?? null,
      });
      unitMeta.push({
        sheet: u.sheet ?? '',
        parcel: u.parcel ?? '',
        sub: u.sub ?? '',
      });
    }
  }

  const { data: insertedUnits, error: uError } = await supabase
    .from('census_units')
    .insert(allUnitRows)
    .select();

  const totalUnits = insertedUnits?.length ?? 0;

  // Phase 4: Fetch owners and save to census_owners (NOT as leads)
  if (!uError && insertedUnits && insertedUnits.length > 0) {
    const allOwnerRows: Record<string, unknown>[] = [];

    for (let i = 0; i < insertedUnits.length; i++) {
      const meta = unitMeta[i];
      if (!meta.sheet || !meta.parcel || !meta.sub) continue;

      try {
        const owners = await provider.fetchOwners(meta.sheet, meta.parcel, meta.sub);
        for (const o of owners) {
          allOwnerRows.push({
            unit_id: insertedUnits[i].id,
            full_name: o.full_name,
            fiscal_code: o.fiscal_code ?? null,
            ownership_type: o.ownership_type ?? null,
            ownership_share: o.ownership_share ?? null,
            is_natural_person: o.is_natural_person,
          });
        }
      } catch {
        // Skip
      }
    }

    if (allOwnerRows.length > 0) {
      await supabase.from('census_owners').insert(allOwnerRows);
    }
  }

  // Update zone synced_at
  await supabase
    .from('census_zones')
    .update({ synced_at: new Date().toISOString() })
    .eq('id', zoneId);

  return { buildings: insertedBuildings.length, units: totalUnits };
}
