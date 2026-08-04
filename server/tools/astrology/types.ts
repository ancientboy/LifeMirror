export type AstrologyInput = {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number;
  utcOffsetMinutes: number;
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
};
