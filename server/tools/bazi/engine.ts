import { Solar, type EightCharValue } from "lunar-javascript";
import type { BaziInput, BaziPillar, BaziResult } from "./types.js";

const ENGINE_VERSION = "bazi-core/0.1.0+lunar-javascript-1.7.7";
const PILLAR_KEYS = ["year", "month", "day", "time"] as const;
const PILLAR_LABELS = ["年柱", "月柱", "日柱", "时柱"] as const;

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
  let adjustment = 0;
  if (input.useTrueSolarTime && input.longitude !== null && input.longitude !== undefined) {
    const zoneMeridian = (input.utcOffsetMinutes / 60) * 15;
    adjustment = 4 * (input.longitude - zoneMeridian) + equationOfTimeMinutes(input.year, input.month, input.day, hour);
  }
  const utc = Date.UTC(input.year, input.month - 1, input.day, hour, input.minute + Math.round(adjustment));
  const date = new Date(utc);
  return {
    year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(),
    hour: date.getUTCHours(), minute: date.getUTCMinutes(), adjustment: Math.round(adjustment),
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
    ...(input.useTrueSolarTime ? ["真太阳时采用经度修正与均时差近似；节气或时辰边界附近应由专业历书复核。"] : ["未启用真太阳时：按出生地当时的民用钟表时间排盘。"]),
  ];

  return {
    engine: { name: "LifeMirror Deterministic BaZi Core", version: ENGINE_VERSION, calendarRange: "1900-2100" },
    input,
    effectiveLocalTime: `${effective.year}-${String(effective.month).padStart(2, "0")}-${String(effective.day).padStart(2, "0")} ${String(effective.hour).padStart(2, "0")}:${String(effective.minute).padStart(2, "0")}`,
    trueSolarAdjustmentMinutes: input.useTrueSolarTime ? effective.adjustment : null,
    pillars: [pillar(eightChar, 0), pillar(eightChar, 1), pillar(eightChar, 2), timeKnown ? pillar(eightChar, 3) : null],
    solarTerms: { previous: previous.getName(), previousAt: previous.getSolar().toYmdHms(), next: next.getName(), nextAt: next.getSolar().toYmdHms() },
    rules: [
      "年柱以立春为界；月柱以十二节（节气）为界。",
      input.dayBoundary === "late-zi" ? "日柱采用子初换日：23:00 后计入次日干支。" : "日柱采用民用午夜换日：00:00 起计入次日干支。",
      timeKnown ? "时柱按两小时一个时辰计算，23:00-00:59 为子时。" : "因时间未知，本次只输出年、月、日三柱。",
    ],
    warnings,
  };
}
