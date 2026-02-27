// ============================================================
// ICadastralProvider — Interface for cadastral data sources
// ============================================================

export interface CadastralBuilding {
  address: string;
  civic_number: string;
  lat?: number;
  lng?: number;
  units: CadastralUnit[];
}

export interface CadastralUnit {
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
}

export interface CadastralOwner {
  full_name: string;
  fiscal_code?: string;
  ownership_type?: string;
  ownership_share?: string;
  is_natural_person: boolean;
}

export interface CadastralTransaction {
  transaction_type?: string;
  transaction_date?: string;
  price?: number;
  buyer_name?: string;
  seller_name?: string;
  notary?: string;
  notes?: string;
}

export interface ICadastralProvider {
  /** Fetch buildings + units for a municipality */
  fetchBuildings(municipalityCode: string): Promise<CadastralBuilding[]>;

  /** Fetch owners for a specific unit (on-demand) */
  fetchOwners(sheet: string, parcel: string, sub: string): Promise<CadastralOwner[]>;

  /** Fetch transaction history for a specific unit (on-demand) */
  fetchTransactions(sheet: string, parcel: string, sub: string): Promise<CadastralTransaction[]>;
}
