'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { geocodeAddress, delay } from '@/lib/census/geocoding';

export interface CensusImportResult {
  buildings: number;
  units: number;
  owners: number;
  skipped: number;
  errors: string[];
}

interface ImportRow {
  address: string;
  civic_number: string;
  sheet?: string;
  parcel?: string;
  sub?: string;
  category?: string;
  class?: string;
  consistency?: string;
  cadastral_income?: number;
  sqm?: number;
  rooms?: number;
  floor?: string;
  internal?: string;
  owner_name?: string;
  fiscal_code?: string;
  ownership_type?: string;
  ownership_share?: string;
}

export async function importCensusData(
  zoneId: string,
  rows: Record<string, unknown>[]
): Promise<CensusImportResult> {
  const supabase = await createClient();
  const agent = await getCurrentAgent();

  if (!agent) {
    return { buildings: 0, units: 0, owners: 0, skipped: 0, errors: ['Non autenticato'] };
  }

  // Verify the zone exists
  const { data: zone } = await supabase
    .from('census_zones')
    .select('*')
    .eq('id', zoneId)
    .single();

  if (!zone) {
    return { buildings: 0, units: 0, owners: 0, skipped: 0, errors: ['Zona non trovata'] };
  }

  const errors: string[] = [];
  let skipped = 0;

  // Parse rows into typed objects
  const parsedRows: ImportRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const address = String(row.address || '').trim();
    const civic = String(row.civic_number || '').trim();

    if (!address || !civic) {
      skipped++;
      continue;
    }

    parsedRows.push({
      address,
      civic_number: civic,
      sheet: row.sheet ? String(row.sheet).trim() : undefined,
      parcel: row.parcel ? String(row.parcel).trim() : undefined,
      sub: row.sub ? String(row.sub).trim() : undefined,
      category: row.category ? String(row.category).trim() : undefined,
      class: row.class ? String(row.class).trim() : undefined,
      consistency: row.consistency ? String(row.consistency).trim() : undefined,
      cadastral_income: row.cadastral_income ? Number(row.cadastral_income) : undefined,
      sqm: row.sqm ? Number(row.sqm) : undefined,
      rooms: row.rooms ? Number(row.rooms) : undefined,
      floor: row.floor ? String(row.floor).trim() : undefined,
      internal: row.internal ? String(row.internal).trim() : undefined,
      owner_name: row.owner_name ? String(row.owner_name).trim() : undefined,
      fiscal_code: row.fiscal_code ? String(row.fiscal_code).trim() : undefined,
      ownership_type: row.ownership_type ? String(row.ownership_type).trim() : undefined,
      ownership_share: row.ownership_share ? String(row.ownership_share).trim() : undefined,
    });
  }

  if (parsedRows.length === 0) {
    return { buildings: 0, units: 0, owners: 0, skipped, errors: ['Nessuna riga valida trovata'] };
  }

  // Group rows by building (address + civic_number)
  const buildingMap = new Map<string, ImportRow[]>();
  for (const row of parsedRows) {
    const key = `${row.address}|${row.civic_number}`;
    const list = buildingMap.get(key) ?? [];
    list.push(row);
    buildingMap.set(key, list);
  }

  // Delete existing data for this zone (clean import)
  await supabase.from('census_buildings').delete().eq('zone_id', zoneId);

  // Geocode unique addresses
  const addressCoords = new Map<string, { lat: number; lng: number } | null>();
  const buildingKeys = Array.from(buildingMap.keys());
  let geocodeCount = 0;

  for (const key of buildingKeys) {
    const [address, civic] = key.split('|');
    const fullAddress = `${address} ${civic}`;

    if (!addressCoords.has(fullAddress)) {
      const coords = await geocodeAddress(fullAddress, zone.name, zone.province);
      addressCoords.set(fullAddress, coords);
      geocodeCount++;
      if (geocodeCount < buildingKeys.length) {
        await delay(1100);
      }
    }
  }

  // Batch insert buildings
  const buildingRows = buildingKeys.map((key) => {
    const [address, civic] = key.split('|');
    const unitRows = buildingMap.get(key) ?? [];
    const coords = addressCoords.get(`${address} ${civic}`);
    return {
      zone_id: zoneId,
      address,
      civic_number: civic,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      total_units: unitRows.length,
    };
  });

  const { data: insertedBuildings, error: bError } = await supabase
    .from('census_buildings')
    .insert(buildingRows)
    .select();

  if (bError || !insertedBuildings) {
    return {
      buildings: 0,
      units: 0,
      owners: 0,
      skipped,
      errors: [bError?.message || 'Errore inserimento edifici'],
    };
  }

  // Map building key → building id
  const buildingIdMap = new Map<string, string>();
  for (const b of insertedBuildings) {
    buildingIdMap.set(`${b.address}|${b.civic_number}`, b.id);
  }

  // Batch insert units
  const allUnitRows: Record<string, unknown>[] = [];
  const unitOwnerData: { owner_name?: string; fiscal_code?: string; ownership_type?: string; ownership_share?: string }[] = [];

  for (const key of buildingKeys) {
    const buildingId = buildingIdMap.get(key);
    if (!buildingId) continue;

    const unitRows = buildingMap.get(key) ?? [];
    for (const row of unitRows) {
      allUnitRows.push({
        building_id: buildingId,
        sheet: row.sheet ?? null,
        parcel: row.parcel ?? null,
        sub: row.sub ?? null,
        category: row.category ?? null,
        class: row.class ?? null,
        consistency: row.consistency ?? null,
        cadastral_income: row.cadastral_income ?? null,
        sqm: row.sqm ?? null,
        rooms: row.rooms ?? null,
        floor: row.floor ?? null,
        internal: row.internal ?? null,
      });
      unitOwnerData.push({
        owner_name: row.owner_name,
        fiscal_code: row.fiscal_code,
        ownership_type: row.ownership_type,
        ownership_share: row.ownership_share,
      });
    }
  }

  const { data: insertedUnits, error: uError } = await supabase
    .from('census_units')
    .insert(allUnitRows)
    .select();

  if (uError) {
    errors.push(`Errore inserimento unità: ${uError.message}`);
  }

  const totalUnits = insertedUnits?.length ?? 0;

  // Batch insert owners (into census_owners only — NOT as leads)
  let totalOwners = 0;
  if (insertedUnits && insertedUnits.length > 0) {
    const ownerRows: Record<string, unknown>[] = [];

    for (let i = 0; i < insertedUnits.length; i++) {
      const ownerInfo = unitOwnerData[i];
      if (!ownerInfo?.owner_name) continue;

      let shareValue: string | null = ownerInfo.ownership_share ?? null;
      if (shareValue) shareValue = shareValue.trim();

      const isNatural = ownerInfo.fiscal_code
        ? ownerInfo.fiscal_code.length === 16
        : !ownerInfo.owner_name.match(/\b(s\.?r\.?l\.?|s\.?p\.?a\.?|s\.?a\.?s\.?|s\.?n\.?c\.?|srl|spa|sas|snc)\b/i);

      ownerRows.push({
        unit_id: insertedUnits[i].id,
        full_name: ownerInfo.owner_name,
        fiscal_code: ownerInfo.fiscal_code ?? null,
        ownership_type: ownerInfo.ownership_type ?? 'Proprietà',
        ownership_share: shareValue,
        is_natural_person: isNatural,
      });
    }

    if (ownerRows.length > 0) {
      const { data: insertedOwners, error: oError } = await supabase
        .from('census_owners')
        .insert(ownerRows)
        .select('id');

      if (oError) {
        errors.push(`Errore inserimento proprietari: ${oError.message}`);
      } else {
        totalOwners = insertedOwners?.length ?? 0;
      }
    }
  }

  // Update zone synced_at + counters
  await supabase
    .from('census_zones')
    .update({
      synced_at: new Date().toISOString(),
      total_buildings: insertedBuildings.length,
      total_units: totalUnits,
    })
    .eq('id', zoneId);

  return {
    buildings: insertedBuildings.length,
    units: totalUnits,
    owners: totalOwners,
    skipped,
    errors,
  };
}
