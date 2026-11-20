// ============================================================
// TYPES
// ============================================================

export interface SubVehicle {
  id: string;
  name: string;
  short: string;
  icon: string;
}

export interface VehicleCategory {
  id: string;
  name: string;
  short: string;
  icon: string;
  group?: string;
  vehicles: SubVehicle[];
}

export interface Intersection {
  id: string;
  name: string;
  direction: string;
  pendekat: string;
}

export interface DirectionCount {
  left: number;
  straight: number;
  right: number;
}

export interface SessionData {
  [intersectionId: string]: {
    [intervalIndex: string]: {
      [vehicleId: string]: number | DirectionCount;
    };
  };
}

export interface Session {
  name: string;
  observer: string;
  startTime: string;
  intervalMinutes: number;
  surveyType: 'ruas' | 'simpang';
  weather: string;
  roadName: string;
  flowDirections: string;
  intersections: Intersection[];
  categories: VehicleCategory[];
  data: SessionData;
  status: 'idle' | 'running' | 'paused' | 'done';
  elapsedSeconds: number;
  totalIntervals: number;
}

export interface CurrentCounts {
  [intersectionId: string]: {
    [vehicleId: string]: number | DirectionCount;
  };
}

// ============================================================
// CONSTANTS
// ============================================================

export const SIMPANG_CATEGORIES: VehicleCategory[] = [
  {
    id: 'um', name: 'UN-MOTORIZED', short: 'UM', icon: '🚲', group: 'UN-MOTORIZED',
    vehicles: [
      { id: 'sgp', name: 'Sepeda, Gerobak, Pedati', short: 'SGP', icon: '🚲' },
      { id: 'pk', name: 'Pejalan Kaki', short: 'PK', icon: '🚶' },
    ],
  },
  {
    id: 'sm', name: 'SEPEDA MOTOR', short: 'SM', icon: '🏍️', group: 'SEPEDA MOTOR',
    vehicles: [
      { id: 'sm_v', name: 'Sepeda Motor', short: 'SM', icon: '🏍️' },
    ],
  },
  {
    id: 'mp', name: 'MOBIL PENUMPANG', short: 'MP', icon: '🚗', group: 'MOBIL PENUMPANG',
    vehicles: [
      { id: 'mp_v', name: 'Sedan, Jeep, MP, Mini Bus, Pick Up', short: 'MP', icon: '🚗' },
    ],
  },
  {
    id: 'ks', name: 'KENDARAAN SEDANG/BERAT', short: 'KS', icon: '🚛', group: 'KENDARAAN SEDANG/BERAT',
    vehicles: [
      { id: 'ks_v', name: 'Bus, Truck, Trailer, Gandeng, Container', short: 'KS', icon: '🚛' },
    ],
  },
  {
    id: 'au', name: 'ANGKUTAN UMUM', short: 'AU', icon: '🚐', group: 'ANGKUTAN UMUM',
    vehicles: [
      { id: 'au_v', name: 'Angkot, Elf, Bis Kota', short: 'AU', icon: '🚐' },
    ],
  },
];

export const RUAS_CATEGORIES: VehicleCategory[] = [
  {
    id: 'rm', name: 'KENDARAAN RODA DUA', short: 'R2', icon: '🏍️',
    vehicles: [
      { id: 'sm', name: 'Sepeda Motor', short: 'SM', icon: '🏍️' },
    ],
  },
  {
    id: 'r4', name: 'KENDARAAN RODA EMPAT', short: 'R4', icon: '🚗',
    vehicles: [
      { id: 'mp', name: 'Mobil Pribadi', short: 'MP', icon: '🚗' },
    ],
  },
  {
    id: 'au_r', name: 'ANGKUTAN UMUM', short: 'AU', icon: '🚐',
    vehicles: [
      { id: 'bk', name: 'Bus Kecil', short: 'BK', icon: '🚌' },
      { id: 'bsd', name: 'Bus Sedang', short: 'BSD', icon: '🚍' },
      { id: 'bb', name: 'Bus Besar', short: 'BB', icon: '🚎' },
      { id: 'ak', name: 'Angkot', short: 'AK', icon: '🚐' },
    ],
  },
  {
    id: 'kb', name: 'KENDARAAN BERAT', short: 'KB', icon: '🚛',
    vehicles: [
      { id: 'ts', name: 'Truk Sedang', short: 'TS', icon: '🚚' },
      { id: 'tb', name: 'Truk Besar', short: 'TB', icon: '🛻' },
    ],
  },
  {
    id: 'll', name: 'LAIN-LAIN', short: 'LL', icon: '🚶',
    vehicles: [
      { id: 'pk', name: 'Pejalan Kaki', short: 'PK', icon: '🚶' },
      { id: 'ktb', name: 'KTB', short: 'KTB', icon: '🚙' },
    ],
  },
];

export const INTERVAL_OPTIONS = [5, 10, 15, 30, 60];

export const TAB_COLORS = [
  '#38bdf8', '#a78bfa', '#f472b6', '#34d399',
  '#fb923c', '#facc15', '#f87171', '#2dd4bf',
];

export const STORAGE_KEY = 'traffic_counter_session';
export const HISTORY_STORAGE_KEY = 'traffic_counter_history';