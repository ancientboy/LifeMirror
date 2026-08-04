export type DayBoundary = "midnight" | "late-zi";

export interface BaziInput {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number;
  utcOffsetMinutes: number;
  dayBoundary: DayBoundary;
  longitude?: number | null;
  useTrueSolarTime?: boolean;
}

export interface BaziPillar {
  key: "year" | "month" | "day" | "time";
  label: string;
  ganZhi: string;
  stem: string;
  branch: string;
  hiddenStems: string[];
  fiveElements: string;
  naYin: string;
  stemTenGod: string;
  branchTenGods: string[];
}

export interface BaziResult {
  engine: { name: string; version: string; calendarRange: string };
  input: BaziInput;
  effectiveLocalTime: string;
  trueSolarAdjustmentMinutes: number | null;
  pillars: Array<BaziPillar | null>;
  solarTerms: { previous: string; previousAt: string; next: string; nextAt: string };
  rules: string[];
  warnings: string[];
}
