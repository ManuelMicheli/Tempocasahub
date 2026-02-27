// ============================================================
// Geocoding via Nominatim (OpenStreetMap) — free, 1 req/sec
// ============================================================

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Geocode an address to lat/lng coordinates using Nominatim.
 * Returns null if address cannot be geocoded.
 * Respects 1 req/sec rate limit via external delay.
 */
export async function geocodeAddress(
  address: string,
  city: string,
  province?: string
): Promise<{ lat: number; lng: number } | null> {
  const query = `${address}, ${city}${province ? `, ${province}` : ''}, Italia`;

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'it');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'TempoCasaCRM/1.0 (censimento)',
      },
    });

    if (!response.ok) return null;

    const results: NominatimResult[] = await response.json();
    if (results.length === 0) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch {
    return null;
  }
}

/** Wait ms milliseconds (for rate limiting) */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
