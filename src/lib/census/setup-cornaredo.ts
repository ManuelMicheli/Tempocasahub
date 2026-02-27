import { syncCensusZone } from './sync';
import type { SupabaseClient } from '@supabase/supabase-js';

interface SetupResult {
  success: boolean;
  zoneId?: string;
  agencyId?: string;
  error?: string;
}

/**
 * Ensures the agent has an agency and a synced Cornaredo census zone.
 * Called during registration and as fallback from /censimento page.
 * Non-throwing: all errors are returned in the result object.
 */
export async function setupCornaredo(
  supabase: SupabaseClient,
  agentId: string,
  agentAgencyId: string | null
): Promise<SetupResult> {
  // Step 1: Ensure agency exists and agent is linked
  let agencyId = agentAgencyId;

  if (!agencyId) {
    // Find the Tempo Casa Cornaredo agency (should always exist)
    const { data: existingAgency } = await supabase
      .from('agencies')
      .select('id')
      .eq('city', 'Cornaredo')
      .limit(1)
      .single();

    if (existingAgency) {
      agencyId = existingAgency.id;
    } else {
      // Fallback: create agency if missing
      const { data: newAgency, error: agencyError } = await supabase
        .from('agencies')
        .insert({ name: 'Tempo Casa Cornaredo', city: 'Cornaredo' })
        .select()
        .single();

      if (agencyError || !newAgency) {
        return {
          success: false,
          error: `Errore creazione agenzia: ${agencyError?.message}`,
        };
      }
      agencyId = newAgency.id;
    }

    // Link agent to agency
    const { error: updateError } = await supabase
      .from('agents')
      .update({ agency_id: agencyId })
      .eq('id', agentId);

    if (updateError) {
      return {
        success: false,
        error: `Errore associazione agenzia: ${updateError.message}`,
      };
    }
  }

  // Step 2: Check if zone already exists
  const { data: existingZones } = await supabase
    .from('census_zones')
    .select('id, synced_at')
    .order('created_at', { ascending: true })
    .limit(1);

  if (existingZones && existingZones.length > 0) {
    const zone = existingZones[0];
    if (!zone.synced_at) {
      await syncCensusZone(zone.id);
    }
    return { success: true, zoneId: zone.id, agencyId: agencyId ?? undefined };
  }

  // Step 3: Create Cornaredo zone
  const { data: newZone, error: zoneError } = await supabase
    .from('census_zones')
    .insert({
      agency_id: agencyId,
      name: 'Cornaredo',
      municipality_code: 'D019',
      province: 'MI',
      region: 'Lombardia',
    })
    .select()
    .single();

  if (zoneError || !newZone) {
    return {
      success: false,
      agencyId: agencyId ?? undefined,
      error: `Errore creazione zona: ${zoneError?.message}`,
    };
  }

  // Step 4: Sync census data (buildings, units, owners)
  const syncResult = await syncCensusZone(newZone.id);
  if (syncResult.error) {
    return {
      success: false,
      zoneId: newZone.id,
      agencyId: agencyId ?? undefined,
      error: syncResult.error,
    };
  }

  return { success: true, zoneId: newZone.id, agencyId: agencyId ?? undefined };
}
