export type AstrologyInput = {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number;
  utcOffsetMinutes: number;
  timeZone?: string | null;
  latitude: number;
  longitude: number;
};

export type ZodiacSign = {
  index: number;
  name: string;
  glyph: string;
  element: "火" | "土" | "风" | "水";
  modality: "基本" | "固定" | "变动";
};

export type PlanetPosition = {
  key: string;
  name: string;
  glyph: string;
  longitude: number;
  degreeInSign: number;
  sign: ZodiacSign;
  house: number | null;
  retrograde: boolean;
};

export type ChartAngle = {
  key: "asc" | "mc";
  name: string;
  glyph: string;
  longitude: number;
  degreeInSign: number;
  sign: ZodiacSign;
};

export type NatalAspect = {
  key: string;
  name: string;
  glyph: string;
  angle: number;
  orb: number;
  first: string;
  second: string;
};

export type TransitAspect = NatalAspect & {
  transitKey: string;
  transit: string;
  natalKey: string;
  natal: string;
  /** A reproducible relevance score for ordering daily contacts, not a prediction score. */
  priority: number;
  window: "当日" | "数日" | "数周" | "数月" | "长期";
  rationale: string;
};

export type AstrologyTransitResult = {
  date: string;
  transits: PlanetPosition[];
  contacts: TransitAspect[];
  method: string;
};

export type AstrologyProgressionResult = {
  targetDate: string;
  progressedDate: string;
  progressedPlanets: PlanetPosition[];
  contacts: TransitAspect[];
  method: string;
};

export type AstrologyResult = {
  engine: { name: string; version: string; model: string; zodiac: string; houseSystem: string };
  utcTime: string;
  timeKnown: boolean;
  planets: PlanetPosition[];
  angles: ChartAngle[];
  houseCusps: number[] | null;
  aspects: NatalAspect[];
  elementBalance: Record<ZodiacSign["element"], number>;
  modalityBalance: Record<ZodiacSign["modality"], number>;
  headline: string;
  themes: string[];
  rules: string[];
  warnings: string[];
  timing?: {
    calculatedFor: string;
    transits: AstrologyTransitResult;
    progressions: AstrologyProgressionResult;
  };
};
