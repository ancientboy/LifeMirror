export type DayBoundary = "midnight" | "late-zi";
export type LuckGender = "male" | "female";

export interface BaziInput {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number;
  utcOffsetMinutes: number;
  timeZone?: string | null;
  dayBoundary: DayBoundary;
  longitude?: number | null;
  useTrueSolarTime?: boolean;
  luckGender?: LuckGender | null;
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
  fiveElementProfile: {
    scores: Record<"木" | "火" | "土" | "金" | "水", number>;
    strongest: string[];
    weakest: string[];
    dayMaster: string;
    dayMasterElement: "木" | "火" | "土" | "金" | "水";
    supportiveShare: number;
    strengthBand: "偏强" | "中和" | "偏弱";
    method: string;
  };
  tenGodProfile: {
    scores: Record<"比肩" | "劫财" | "食神" | "伤官" | "偏财" | "正财" | "七杀" | "正官" | "偏印" | "正印", number>;
    dominant: string[];
    method: string;
  };
  seasonalProfile: {
    monthBranch: string;
    monthElement: "木" | "火" | "土" | "金" | "水";
    relationToDayMaster: "生扶" | "同类" | "泄耗" | "受制" | "财耗";
    method: string;
  };
  interactions: Array<{ kind: "合" | "冲" | "刑" | "害"; members: string; note: string }>;
  luck: null | {
    gender: LuckGender;
    direction: "顺排" | "逆排";
    startsAfter: string;
    cycles: Array<{ ganZhi: string; startYear: number; endYear: number; startAge: number; endAge: number; stemTenGod: string; branchTenGod: string }>;
    annual: Array<{ year: number; ganZhi: string; age: number; tenGod: string; branchTenGod: string; branchRelations: Array<{ natalBranch: string; kind: "合" | "冲" | "害" | "刑" }> }>;
    method: string;
  };
  rules: string[];
  warnings: string[];
}

export type BaziDailyRelation = {
  dayPillar: string;
  dayTenGod: string;
  branchRelations: Array<{ natalBranch: string; kind: "合" | "冲" | "害" | "刑" }>;
  method: string;
};
