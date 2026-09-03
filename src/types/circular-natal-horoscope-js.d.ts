declare module "circular-natal-horoscope-js" {
  export interface OriginParams {
    year: number;
    month: number; // 0-indexed
    date: number;
    hour?: number;
    minute?: number;
    second?: number;
    latitude: number;
    longitude: number;
  }

  export class Origin {
    constructor(params: OriginParams);
    year: number;
    month: number;
    date: number;
    hour: number;
    minute: number;
    latitude: number;
    longitude: number;
    localTime: Date;
    utcTime: Date;
    julianDate: number;
  }

  export interface Sign {
    key: string;
    label: string;
  }

  export interface EclipticPosition {
    DecimalDegrees: number;
    Sign?: Sign;
  }

  export interface ChartPosition {
    Ecliptic: EclipticPosition;
    Horizon: Record<string, number>;
  }

  export interface CelestialBody {
    key: string;
    label: string;
    Sign: Sign;
    House?: { id: number; label: string };
    ChartPosition: ChartPosition;
    isRetrograde: boolean;
  }

  export interface HouseCusp {
    key: string;
    label: string;
    Sign: Sign;
    ChartPosition: {
      StartPosition: ChartPosition;
      EndPosition: ChartPosition;
    };
  }

  export interface AspectResult {
    point1Key: string;
    point1Label: string;
    point2Key: string;
    point2Label: string;
    aspectKey: string;
    aspectLevel: string;
    label: string;
    orb: number;
    orbUsed: number;
  }

  export interface HoroscopeParams {
    origin: Origin;
    houseSystem?: string;
    zodiac?: string;
    aspectPoints?: string[];
    aspectWithPoints?: string[];
    aspectTypes?: string[];
    customOrbs?: Record<string, number>;
    language?: string;
  }

  export class Horoscope {
    constructor(params: HoroscopeParams);
    CelestialBodies: Record<string, CelestialBody> & { all: CelestialBody[] };
    CelestialPoints: Record<string, CelestialBody> & { all: CelestialBody[] };
    Houses: HouseCusp[];
    Ascendant: CelestialBody;
    Midheaven: CelestialBody;
    Aspects: { all: AspectResult[]; types: Record<string, AspectResult[]> };
    ZodiacCusps: Array<{ ChartPosition: ChartPosition }>;
  }
}
