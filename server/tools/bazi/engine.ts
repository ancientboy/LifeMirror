import { Solar, type EightCharValue } from "lunar-javascript";
import type { BaziDailyRelation, BaziInput, BaziPillar, BaziResult } from "./types.js";
import { resolveCivilOffsetMinutes } from "../../civil-time.js";

const ENGINE_VERSION = "bazi-core/0.2.0+lunar-javascript-1.7.7";
const PILLAR_KEYS = ["year", "month", "day", "time"] as const;
const PILLAR_LABELS = ["年柱", "月柱", "日柱", "时柱"] as const;
const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
type Element = typeof ELEMENTS[number];
const STEM_META: Record<string, { element: Element; yang: boolean }> = {
  甲: { element: "木", yang: true }, 乙: { element: "木", yang: false },
  丙: { element: "火", yang: true }, 丁: { element: "火", yang: false },
  戊: { element: "土", yang: true }, 己: { element: "土", yang: false },
  庚: { element: "金", yang: true }, 辛: { element: "金", yang: false },
  壬: { element: "水", yang: true }, 癸: { element: "水", yang: false },
};
const GENERATES: Record<Element, Element> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS: Record<Element, Element> = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
const TEN_GODS = ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"] as const;
const BRANCH_MAIN_STEM: Record<string, string> = { 子: "癸", 丑: "己", 寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙", 午: "丁", 未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬" };

function assertInteger(value: number, name: string, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max}`);
  }
}

function validateInput(input: BaziInput) {
  assertInteger(input.year, "year", 1900, 2100);
  assertInteger(input.month, "month", 1, 12);
  assertInteger(input.day, "day", 1, 31);
  assertInteger(input.minute, "minute", 0, 59);
  assertInteger(input.utcOffsetMinutes, "utcOffsetMinutes", -720, 840);
  if (input.hour !== null) assertInteger(input.hour, "hour", 0, 23);
  const check = new Date(Date.UTC(input.year, input.month - 1, input.day));
  if (check.getUTCFullYear() !== input.year || check.getUTCMonth() !== input.month - 1 || check.getUTCDate() !== input.day) {
    throw new RangeError("date is not a valid Gregorian calendar date");
  }
  if (input.dayBoundary !== "midnight" && input.dayBoundary !== "late-zi") {
    throw new RangeError("dayBoundary must be midnight or late-zi");
  }
  if (input.useTrueSolarTime && (input.longitude === null || input.longitude === undefined)) {
    throw new RangeError("longitude is required when true solar time is enabled");
  }
  if (input.longitude !== null && input.longitude !== undefined && (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180)) {
    throw new RangeError("longitude must be between -180 and 180");
  }
}

function equationOfTimeMinutes(year: number, month: number, day: number, hour: number) {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  const dayOfYear = Math.floor((current - start) / 86_400_000) + 1;
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hour - 12) / 24);
  return 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
}

function normalizeEffectiveTime(input: BaziInput) {
  const hour = input.hour ?? 12;
  const resolvedOffset = resolveCivilOffsetMinutes({ year: input.year, month: input.month, day: input.day, hour, minute: input.minute }, input.timeZone);
  const utcOffsetMinutes = resolvedOffset ?? input.utcOffsetMinutes;
  let adjustment = 0;
  if (input.useTrueSolarTime && input.longitude !== null && input.longitude !== undefined) {
    const zoneMeridian = (utcOffsetMinutes / 60) * 15;
    adjustment = 4 * (input.longitude - zoneMeridian) + equationOfTimeMinutes(input.year, input.month, input.day, hour);
  }
  const utc = Date.UTC(input.year, input.month - 1, input.day, hour, input.minute + Math.round(adjustment));
  const date = new Date(utc);
  return {
    year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(),
    hour: date.getUTCHours(), minute: date.getUTCMinutes(), adjustment: Math.round(adjustment), utcOffsetMinutes,
  };
}

function pillar(eightChar: EightCharValue, index: number): BaziPillar {
  const prefixes = ["Year", "Month", "Day", "Time"] as const;
  const prefix = prefixes[index];
  const call = <T>(suffix: string) => (eightChar as unknown as Record<string, () => T>)[`get${prefix}${suffix}`]();
  return {
    key: PILLAR_KEYS[index], label: PILLAR_LABELS[index], ganZhi: call<string>(""),
    stem: call<string>("Gan"), branch: call<string>("Zhi"), hiddenStems: call<string[]>("HideGan"),
    fiveElements: call<string>("WuXing"), naYin: call<string>("NaYin"),
    stemTenGod: call<string>("ShiShenGan"), branchTenGods: call<string[]>("ShiShenZhi"),
  };
}

function elementProfile(pillars: Array<BaziPillar | null>): BaziResult["fiveElementProfile"] {
  const raw = Object.fromEntries(ELEMENTS.map((element) => [element, 0])) as Record<Element, number>;
  pillars.forEach((item, pillarIndex) => {
    if (!item) return;
    raw[STEM_META[item.stem].element] += pillarIndex === 1 ? 1.2 : 1;
    const weights = item.hiddenStems.length === 1 ? [1] : item.hiddenStems.length === 2 ? [0.7, 0.3] : [0.6, 0.3, 0.1];
    item.hiddenStems.forEach((stem, index) => { raw[STEM_META[stem].element] += weights[index] * (pillarIndex === 1 ? 1.5 : 1); });
  });
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
  const scores = Object.fromEntries(ELEMENTS.map((element) => [element, Number((raw[element] / total * 100).toFixed(1))])) as Record<Element, number>;
  const dayMaster = pillars[2]!.stem;
  const dayMasterElement = STEM_META[dayMaster].element;
  const resource = ELEMENTS.find((element) => GENERATES[element] === dayMasterElement)!;
  const supportiveShare = Number((scores[dayMasterElement] + scores[resource]).toFixed(1));
  const ordered = [...ELEMENTS].sort((a, b) => scores[b] - scores[a]);
  return {
    scores,
    strongest: ordered.filter((element) => scores[element] === scores[ordered[0]]),
    weakest: ordered.filter((element) => scores[element] === scores[ordered.at(-1)!]),
    dayMaster,
    dayMasterElement,
    supportiveShare,
    strengthBand: supportiveShare >= 48 ? "偏强" : supportiveShare < 36 ? "偏弱" : "中和",
    method: "四柱天干计 1 权重；地支按主气/中气/余气分配，月令权重提高；以同类与生扶日主占比给出可复算的初步旺衰区间。未纳入格局、调候与流派用神判断。",
  };
}

function branchInteractions(pillars: Array<BaziPillar | null>): BaziResult["interactions"] {
  const branches = pillars.filter((item): item is BaziPillar => Boolean(item)).map((item) => item.branch);
  const rules: Array<{ kind: "合" | "冲" | "刑" | "害"; pairs: string[]; note: string }> = [
    { kind: "合", pairs: ["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"], note: "六合表示两支之间存在趋向连接的传统结构，是否化气仍需结合月令与全局。" },
    { kind: "冲", pairs: ["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"], note: "六冲表示位置或力量相对，不能直接等同于现实中的坏事。" },
    { kind: "害", pairs: ["子未", "丑午", "寅巳", "卯辰", "申亥", "酉戌"], note: "六害是传统关系标记，需要结合具体十神和宫位解释。" },
    { kind: "刑", pairs: ["子卯", "寅巳", "巳申", "寅申", "丑戌", "戌未", "丑未"], note: "相刑提示结构摩擦；三刑是否成立需看相关地支是否齐备。" },
  ];
  const found: BaziResult["interactions"] = [];
  for (const rule of rules) for (const pair of rule.pairs) {
    const [a, b] = [...pair];
    if (branches.includes(a) && branches.includes(b)) found.push({ kind: rule.kind, members: `${a}${b}`, note: rule.note });
  }
  for (const branch of ["辰", "午", "酉", "亥"]) if (branches.filter((item) => item === branch).length > 1) {
    found.push({ kind: "刑", members: `${branch}${branch}`, note: "同支重复形成自刑标记；只表示传统结构上的反复，不可脱离全盘断事。" });
  }
  return found;
}

function tenGod(dayStem: string, otherStem: string) {
  const day = STEM_META[dayStem];
  const other = STEM_META[otherStem];
  const samePolarity = day.yang === other.yang;
  if (day.element === other.element) return samePolarity ? "比肩" : "劫财";
  if (GENERATES[day.element] === other.element) return samePolarity ? "食神" : "伤官";
  if (GENERATES[other.element] === day.element) return samePolarity ? "偏印" : "正印";
  if (CONTROLS[day.element] === other.element) return samePolarity ? "偏财" : "正财";
  return samePolarity ? "七杀" : "正官";
}

function tenGodProfile(pillars: Array<BaziPillar | null>, dayStem: string): BaziResult["tenGodProfile"] {
  const raw = Object.fromEntries(TEN_GODS.map((god) => [god, 0])) as BaziResult["tenGodProfile"]["scores"];
  pillars.forEach((item, index) => {
    if (!item) return;
    if (index !== 2) raw[tenGod(dayStem, item.stem) as keyof typeof raw] += index === 1 ? 1.2 : 1;
    const weights = item.hiddenStems.length === 1 ? [1] : item.hiddenStems.length === 2 ? [0.7, 0.3] : [0.6, 0.3, 0.1];
    item.hiddenStems.forEach((stem, hiddenIndex) => {
      raw[tenGod(dayStem, stem) as keyof typeof raw] += weights[hiddenIndex] * (index === 1 ? 1.5 : 1);
    });
  });
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0) || 1;
  const scores = Object.fromEntries(TEN_GODS.map((god) => [god, Number((raw[god] / total * 100).toFixed(1))])) as BaziResult["tenGodProfile"]["scores"];
  const highest = Math.max(...Object.values(scores));
  return {
    scores,
    dominant: TEN_GODS.filter((god) => scores[god] === highest && highest > 0),
    method: "以透干与藏干的可见度加权统计十神；月支藏干权重提高。它描述盘内结构分布，不以单一十神直接推断现实事件。",
  };
}

function seasonalProfile(pillars: Array<BaziPillar | null>): BaziResult["seasonalProfile"] {
  const day = pillars[2]!;
  const month = pillars[1]!;
  const dayElement = STEM_META[day.stem].element;
  const monthElement = STEM_META[BRANCH_MAIN_STEM[month.branch]].element;
  const relationToDayMaster = monthElement === dayElement ? "同类"
    : GENERATES[monthElement] === dayElement ? "生扶"
      : GENERATES[dayElement] === monthElement ? "泄耗"
        : CONTROLS[monthElement] === dayElement ? "受制" : "财耗";
  return {
    monthBranch: month.branch,
    monthElement,
    relationToDayMaster,
    method: "以月支主气的五行相对日主，标记月令的基础季节关系。调候、通关、格局取用需结合全局与流派规则，不在此自动裁定。",
  };
}

function branchRelationsTo(branch: string, natalBranches: string[]) {
  const relationKinds: Array<{ kind: "合" | "冲" | "害" | "刑"; pairs: string[] }> = [
    { kind: "合", pairs: ["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"] },
    { kind: "冲", pairs: ["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"] },
    { kind: "害", pairs: ["子未", "丑午", "寅巳", "卯辰", "申亥", "酉戌"] },
    { kind: "刑", pairs: ["子卯", "寅巳", "巳申", "寅申", "丑戌", "戌未", "丑未"] },
  ];
  return natalBranches.flatMap((natalBranch) => relationKinds
    .filter(({ pairs }) => pairs.some((pair) => pair.includes(natalBranch) && pair.includes(branch)))
    .map(({ kind }) => ({ natalBranch, kind })));
}

function luckProfile(eightChar: EightCharValue, input: BaziInput, dayStem: string, natalBranches: string[]): BaziResult["luck"] {
  if (!input.luckGender || input.hour === null) return null;
  const yun = (eightChar as unknown as { getYun(gender: number, sect: number): any }).getYun(input.luckGender === "male" ? 1 : 0, 2);
  const cycles = yun.getDaYun(9).slice(1).map((item: any) => {
    const ganZhi = item.getGanZhi();
    return { ganZhi, startYear: item.getStartYear(), endYear: item.getEndYear(), startAge: item.getStartAge(), endAge: item.getEndAge(), stemTenGod: tenGod(dayStem, [...ganZhi][0]), branchTenGod: tenGod(dayStem, BRANCH_MAIN_STEM[[...ganZhi][1]]) };
  });
  const currentYear = new Date().getUTCFullYear();
  const active = yun.getDaYun(12).find((item: any) => currentYear >= item.getStartYear() && currentYear <= item.getEndYear()) ?? yun.getDaYun(12)[0];
  const annualItems = active.getLiuNian().filter((item: any) => item.getYear() >= currentYear - 1 && item.getYear() <= currentYear + 8);
  const annual = annualItems.map((item: any) => {
    const ganZhi = item.getGanZhi();
    const branch = [...ganZhi][1];
    return { year: item.getYear(), ganZhi, age: item.getAge(), tenGod: tenGod(dayStem, [...ganZhi][0]), branchTenGod: tenGod(dayStem, BRANCH_MAIN_STEM[branch]), branchRelations: branchRelationsTo(branch, natalBranches) };
  });
  const currentAnnual = annualItems.find((item: any) => item.getYear() === currentYear);
  const monthly = currentAnnual ? currentAnnual.getLiuYue().map((item: any) => {
    const ganZhi = item.getGanZhi();
    const branch = [...ganZhi][1];
    return {
      month: `${item.getMonthInChinese()}月`, ganZhi,
      tenGod: tenGod(dayStem, [...ganZhi][0]),
      branchTenGod: tenGod(dayStem, BRANCH_MAIN_STEM[branch]),
      branchRelations: branchRelationsTo(branch, natalBranches),
    };
  }) : [];
  return {
    gender: input.luckGender,
    direction: yun.isForward() ? "顺排" : "逆排",
    startsAfter: `${yun.getStartYear()} 年 ${yun.getStartMonth()} 个月 ${yun.getStartDay()} 天${yun.getStartHour() ? ` ${yun.getStartHour()} 小时` : ""}`,
    cycles,
    annual,
    monthly,
    method: `按出生年干阴阳与${input.luckGender === "male" ? "男" : "女"}命顺逆规则排运；采用三天折一年（lunar-javascript sect 2）计算起运。年龄按虚岁序列展示；流月按当年节令月序列列出，只呈现干支与本命关系。`,
  };
}

export function calculateBazi(input: BaziInput): BaziResult {
  validateInput(input);
  const effective = normalizeEffectiveTime(input);
  if (effective.year < 1900 || effective.year > 2100) throw new RangeError("effective date is outside the supported range");
  const solar = Solar.fromYmdHms(effective.year, effective.month, effective.day, effective.hour, effective.minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(input.dayBoundary === "late-zi" ? 1 : 2);
  const previous = lunar.getPrevJie(false);
  const next = lunar.getNextJie(false);
  const timeKnown = input.hour !== null;
  const warnings = [
    "命盘是传统历法规则的确定性映射，不是科学预测。解释层不得改写这里的盘面事实。",
    ...(timeKnown ? [] : ["出生时间未知：时柱、时柱藏干与时柱十神均未生成。"]),
    ...(input.timeZone ? [`出生地时区采用 ${input.timeZone} 的历史民用时间规则；已按出生当日自动解析 UTC 偏移。`] : ["未提供 IANA 时区：按用户选择的固定 UTC 偏移排盘。"]),
    ...(input.useTrueSolarTime ? ["真太阳时采用经度修正与均时差近似；节气或时辰边界附近应由专业历书复核。"] : ["未启用真太阳时：按出生地当时的民用钟表时间排盘。"]),
  ];

  const pillars = [pillar(eightChar, 0), pillar(eightChar, 1), pillar(eightChar, 2), timeKnown ? pillar(eightChar, 3) : null];
  return {
    engine: { name: "LifeMirror Deterministic BaZi Core", version: ENGINE_VERSION, calendarRange: "1900-2100" },
    input,
    effectiveLocalTime: `${effective.year}-${String(effective.month).padStart(2, "0")}-${String(effective.day).padStart(2, "0")} ${String(effective.hour).padStart(2, "0")}:${String(effective.minute).padStart(2, "0")}`,
    trueSolarAdjustmentMinutes: input.useTrueSolarTime ? effective.adjustment : null,
    pillars,
    solarTerms: { previous: previous.getName(), previousAt: previous.getSolar().toYmdHms(), next: next.getName(), nextAt: next.getSolar().toYmdHms() },
    fiveElementProfile: elementProfile(pillars),
    tenGodProfile: tenGodProfile(pillars, pillars[2]!.stem),
    seasonalProfile: seasonalProfile(pillars),
    interactions: branchInteractions(pillars),
    luck: luckProfile(eightChar, input, pillars[2]!.stem, pillars.filter((item): item is BaziPillar => Boolean(item)).map((item) => item.branch)),
    rules: [
      "年柱以立春为界；月柱以十二节（节气）为界。",
      input.dayBoundary === "late-zi" ? "日柱采用子初换日：23:00 后计入次日干支。" : "日柱采用民用午夜换日：00:00 起计入次日干支。",
      timeKnown ? "时柱按两小时一个时辰计算，23:00-00:59 为子时。" : "因时间未知，本次只输出年、月、日三柱。",
      input.luckGender && timeKnown ? "大运顺逆使用用户选择的排运性别；这是传统算法参数，不用于身份判断。" : input.luckGender ? "出生时间未知：不生成可能受时刻影响的起运、大运与流年序列。" : "未选择排运性别：不生成起运、大运与流年序列。",
    ],
    warnings,
  };
}

/** Compare a calculated day pillar with an already calculated natal chart.
 * It deliberately reports traditional structure only, not a lucky/unlucky verdict. */
export function relateBaziDay(natal: BaziResult, day: BaziResult): BaziDailyRelation {
  const dayPillar = day.pillars[2];
  const natalDay = natal.pillars[2];
  if (!dayPillar || !natalDay) throw new Error("A day pillar is required for daily relation");
  const natalBranches = natal.pillars.filter((item): item is BaziPillar => Boolean(item)).map((item) => item.branch);
  const branchRelations = branchRelationsTo(dayPillar.branch, natalBranches);
  return {
    dayPillar: dayPillar.ganZhi,
    dayTenGod: tenGod(natalDay.stem, dayPillar.stem),
    branchRelations,
    method: "以当日干支的天干相对于本命日主计算十神，并只标记当日地支与本命四柱地支之间的合、冲、害、刑；不将单日关系直接断为吉凶。",
  };
}
