import type {
  ICadastralProvider,
  CadastralBuilding,
  CadastralUnit,
  CadastralOwner,
  CadastralTransaction,
} from '../cadastral-provider';

/**
 * OpenAPI.com Catasto Provider
 * Uses catasto.openapi.it for real cadastral data.
 * Costs: ~€0.10-0.30 per query.
 *
 * Note: This is a placeholder implementation following the expected
 * API contract of OpenAPI.com. Actual endpoint paths and response
 * formats may need adjustment based on the real API documentation.
 */
export class OpenAPICatastoProvider implements ICadastralProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl =
      process.env.OPENAPI_CATASTO_URL || 'https://catasto.openapi.it';
    this.apiKey = process.env.OPENAPI_CATASTO_KEY || '';

    if (!this.apiKey) {
      throw new Error(
        'OPENAPI_CATASTO_KEY non configurata. Imposta la variabile ambiente.'
      );
    }
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Catasto error ${response.status}: ${text}`);
    }

    return response.json();
  }

  async fetchBuildings(municipalityCode: string): Promise<CadastralBuilding[]> {
    // Fetch immobili (fabbricati) for the given municipality code
    interface ApiImmobile {
      indirizzo?: string;
      civico?: string;
      foglio?: string;
      particella?: string;
      subalterno?: string;
      categoria?: string;
      classe?: string;
      consistenza?: string;
      rendita?: number;
      superficie?: number;
      vani?: number;
      piano?: string;
      interno?: string;
    }

    const data = await this.request<{ immobili?: ApiImmobile[] }>(
      `/api/v1/catasto/fabbricati/${municipalityCode}`
    );

    if (!data.immobili || data.immobili.length === 0) return [];

    // Group by address + civic number to create buildings
    const buildingMap = new Map<string, { address: string; civic: string; units: CadastralUnit[] }>();

    for (const imm of data.immobili) {
      const address = imm.indirizzo || 'Indirizzo sconosciuto';
      const civic = imm.civico || 'SNC';
      const key = `${address}|${civic}`;

      if (!buildingMap.has(key)) {
        buildingMap.set(key, { address, civic, units: [] });
      }

      buildingMap.get(key)!.units.push({
        sheet: imm.foglio,
        parcel: imm.particella,
        sub: imm.subalterno,
        category: imm.categoria,
        class: imm.classe,
        consistency: imm.consistenza,
        cadastral_income: imm.rendita,
        sqm: imm.superficie,
        rooms: imm.vani,
        floor: imm.piano,
        internal: imm.interno,
      });
    }

    return Array.from(buildingMap.values()).map((b) => ({
      address: b.address,
      civic_number: b.civic,
      units: b.units,
    }));
  }

  async fetchOwners(
    sheet: string,
    parcel: string,
    sub: string
  ): Promise<CadastralOwner[]> {
    interface ApiTitolare {
      nominativo?: string;
      codice_fiscale?: string;
      tipo_diritto?: string;
      quota?: string;
      persona_fisica?: boolean;
    }

    const data = await this.request<{ titolari?: ApiTitolare[] }>(
      `/api/v1/catasto/titolari`,
      { foglio: sheet, particella: parcel, subalterno: sub }
    );

    if (!data.titolari) return [];

    return data.titolari.map((t) => ({
      full_name: t.nominativo || 'Sconosciuto',
      fiscal_code: t.codice_fiscale,
      ownership_type: t.tipo_diritto,
      ownership_share: t.quota,
      is_natural_person: t.persona_fisica ?? true,
    }));
  }

  async fetchTransactions(
    sheet: string,
    parcel: string,
    sub: string
  ): Promise<CadastralTransaction[]> {
    interface ApiTransazione {
      tipo?: string;
      data?: string;
      prezzo?: number;
      acquirente?: string;
      venditore?: string;
      notaio?: string;
      note?: string;
    }

    const data = await this.request<{ transazioni?: ApiTransazione[] }>(
      `/api/v1/catasto/transazioni`,
      { foglio: sheet, particella: parcel, subalterno: sub }
    );

    if (!data.transazioni) return [];

    return data.transazioni.map((t) => ({
      transaction_type: t.tipo,
      transaction_date: t.data,
      price: t.prezzo,
      buyer_name: t.acquirente,
      seller_name: t.venditore,
      notary: t.notaio,
      notes: t.note,
    }));
  }
}
