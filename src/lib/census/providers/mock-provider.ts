import type {
  ICadastralProvider,
  CadastralBuilding,
  CadastralOwner,
  CadastralTransaction,
} from '../cadastral-provider';

// Real streets in Cornaredo (MI) with approximate center coordinates
const CORNAREDO_STREETS: { name: string; baseLat: number; baseLng: number }[] = [
  { name: 'Via Milano', baseLat: 45.4985, baseLng: 9.0210 },
  { name: 'Via Roma', baseLat: 45.4990, baseLng: 9.0235 },
  { name: 'Via Garibaldi', baseLat: 45.4978, baseLng: 9.0255 },
  { name: 'Via Mazzini', baseLat: 45.5000, baseLng: 9.0220 },
  { name: 'Via Dante', baseLat: 45.4970, baseLng: 9.0190 },
  { name: 'Via Leopardi', baseLat: 45.5008, baseLng: 9.0270 },
  { name: 'Via Carducci', baseLat: 45.4965, baseLng: 9.0240 },
  { name: 'Via Cavour', baseLat: 45.5015, baseLng: 9.0200 },
  { name: 'Via Verdi', baseLat: 45.4995, baseLng: 9.0180 },
  { name: 'Via Marconi', baseLat: 45.4960, baseLng: 9.0260 },
  { name: 'Via Volta', baseLat: 45.5020, baseLng: 9.0245 },
  { name: 'Via Colombo', baseLat: 45.4975, baseLng: 9.0215 },
  { name: 'Via San Pietro', baseLat: 45.5005, baseLng: 9.0195 },
  { name: 'Via della Repubblica', baseLat: 45.4982, baseLng: 9.0275 },
  { name: 'Via Vittorio Emanuele', baseLat: 45.5012, baseLng: 9.0230 },
  { name: 'Via Matteotti', baseLat: 45.4968, baseLng: 9.0205 },
  { name: 'Via Gramsci', baseLat: 45.5025, baseLng: 9.0185 },
  { name: 'Corso Italia', baseLat: 45.4988, baseLng: 9.0250 },
  { name: 'Via dei Tigli', baseLat: 45.5002, baseLng: 9.0165 },
  { name: 'Via delle Rose', baseLat: 45.4955, baseLng: 9.0225 },
];

const CATEGORIES = ['A/2', 'A/3', 'A/4', 'A/7', 'A/10', 'C/6'];
const CLASSES = ['1', '2', '3', '4', '5'];
const FIRST_NAMES = [
  'Marco', 'Giuseppe', 'Antonio', 'Francesco', 'Alessandro',
  'Maria', 'Anna', 'Laura', 'Giulia', 'Francesca',
  'Roberto', 'Paolo', 'Giovanni', 'Luca', 'Andrea',
  'Elena', 'Paola', 'Chiara', 'Sara', 'Valentina',
];
const LAST_NAMES = [
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi',
  'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
  'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini',
  'Costa', 'Giordano', 'Mazza', 'Rizzo', 'Lombardi',
];
const OWNERSHIP_TYPES = [
  'Piena proprietà',
  'Nuda proprietà',
  'Usufrutto',
  'Diritto di abitazione',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

export class MockCadastralProvider implements ICadastralProvider {
  async fetchBuildings(municipalityCode: string): Promise<CadastralBuilding[]> {
    const rand = seededRandom(municipalityCode.charCodeAt(0) * 1000 + 42);
    const buildings: CadastralBuilding[] = [];

    // Generate ~50 buildings across different streets
    const numBuildings = 45 + Math.floor(rand() * 10);
    let sheet = 1;
    let parcel = 100;

    for (let i = 0; i < numBuildings; i++) {
      const streetData = pick(CORNAREDO_STREETS, rand);
      const civicNumber = String(Math.floor(rand() * 80) + 1);
      const numUnits = 2 + Math.floor(rand() * 7); // 2-8 units per building

      // Offset lat/lng slightly per building so pins don't overlap
      const latOffset = (rand() - 0.5) * 0.004;
      const lngOffset = (rand() - 0.5) * 0.004;

      const units = [];
      for (let j = 0; j < numUnits; j++) {
        const category = pick(CATEGORIES, rand);
        const isResidential = category.startsWith('A/');
        const floor = j === 0 ? 'T' : String(j);
        const sqm = isResidential
          ? 45 + Math.floor(rand() * 80)
          : 15 + Math.floor(rand() * 30);
        const rooms = isResidential
          ? 2 + Math.floor(rand() * 4)
          : undefined;

        units.push({
          sheet: String(sheet),
          parcel: String(parcel),
          sub: String(j + 1),
          category,
          class: pick(CLASSES, rand),
          consistency: rooms ? `${rooms} vani` : `${sqm} mq`,
          cadastral_income: Math.round((300 + rand() * 1200) * 100) / 100,
          sqm,
          rooms,
          floor,
          internal: `Int. ${j + 1}`,
        });
      }

      buildings.push({
        address: streetData.name,
        civic_number: civicNumber,
        lat: streetData.baseLat + latOffset,
        lng: streetData.baseLng + lngOffset,
        units,
      });

      parcel++;
      if (i % 10 === 9) sheet++;
    }

    return buildings;
  }

  async fetchOwners(sheet: string, parcel: string, sub: string): Promise<CadastralOwner[]> {
    const seed = Number(sheet) * 10000 + Number(parcel) * 100 + Number(sub);
    const rand = seededRandom(seed);
    const numOwners = rand() > 0.7 ? 2 : 1;
    const owners: CadastralOwner[] = [];

    for (let i = 0; i < numOwners; i++) {
      const firstName = pick(FIRST_NAMES, rand);
      const lastName = pick(LAST_NAMES, rand);

      const birthYear = 50 + Math.floor(rand() * 40);
      const fiscalCode =
        lastName.slice(0, 3).toUpperCase() +
        firstName.slice(0, 3).toUpperCase() +
        String(birthYear) +
        'A01' +
        'D019' +
        String(Math.floor(rand() * 10));

      owners.push({
        full_name: `${firstName} ${lastName}`,
        fiscal_code: fiscalCode,
        ownership_type: pick(OWNERSHIP_TYPES, rand),
        ownership_share: numOwners === 1 ? '1/1' : '1/2',
        is_natural_person: true,
      });
    }

    return owners;
  }

  async fetchTransactions(
    sheet: string,
    parcel: string,
    sub: string
  ): Promise<CadastralTransaction[]> {
    const seed = Number(sheet) * 10000 + Number(parcel) * 100 + Number(sub) + 999;
    const rand = seededRandom(seed);

    if (rand() > 0.6) return [];

    const numTransactions = 1 + (rand() > 0.7 ? 1 : 0);
    const transactions: CadastralTransaction[] = [];

    for (let i = 0; i < numTransactions; i++) {
      const year = 2000 + Math.floor(rand() * 24);
      const month = 1 + Math.floor(rand() * 12);
      const day = 1 + Math.floor(rand() * 28);
      const price = (80000 + Math.floor(rand() * 250000));

      const buyerFirst = pick(FIRST_NAMES, rand);
      const buyerLast = pick(LAST_NAMES, rand);
      const sellerFirst = pick(FIRST_NAMES, rand);
      const sellerLast = pick(LAST_NAMES, rand);

      transactions.push({
        transaction_type: rand() > 0.8 ? 'Donazione' : 'Compravendita',
        transaction_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        price: rand() > 0.8 ? undefined : price,
        buyer_name: `${buyerFirst} ${buyerLast}`,
        seller_name: `${sellerFirst} ${sellerLast}`,
        notary: `Dott. ${pick(FIRST_NAMES, rand)} ${pick(LAST_NAMES, rand)}`,
      });
    }

    return transactions;
  }
}
