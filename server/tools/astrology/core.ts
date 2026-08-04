import { AstroTime, Body, Ecliptic, GeoVector, MakeTime, SiderealTime, e_tilt } from "astronomy-engine";
import type { AstrologyInput, AstrologyResult, ChartAngle, NatalAspect, PlanetPosition, ZodiacSign } from "./types.js";

export const ZODIAC: ZodiacSign[] = [
  ["白羊座", "♈", "火", "基本"], ["金牛座", "♉", "土", "固定"], ["双子座", "♊", "风", "变动"],
  ["巨蟹座", "♋", "水", "基本"], ["狮子座", "♌", "火", "固定"], ["处女座", "♍", "土", "变动"],
  ["天秤座", "♎", "风", "基本"], ["天蝎座", "♏", "水", "固定"], ["射手座", "♐", "火", "变动"],
  ["摩羯座", "♑", "土", "基本"], ["水瓶座", "♒", "风", "固定"], ["双鱼座", "♓", "水", "变动"],
].map(([name, glyph, element, modality], index) => ({ index, name, glyph, element, modality } as ZodiacSign));

const PLANETS = [
  { key: "sun", name: "太阳", glyph: "☉", body: Body.Sun }, { key: "moon", name: "月亮", glyph: "☽", body: Body.Moon },
  { key: "mercury", name: "水星", glyph: "☿", body: Body.Mercury }, { key: "venus", name: "金星", glyph: "♀", body: Body.Venus },
  { key: "mars", name: "火星", glyph: "♂", body: Body.Mars }, { key: "jupiter", name: "木星", glyph: "♃", body: Body.Jupiter },
  { key: "saturn", name: "土星", glyph: "♄", body: Body.Saturn }, { key: "uranus", name: "天王星", glyph: "♅", body: Body.Uranus },
  { key: "neptune", name: "海王星", glyph: "♆", body: Body.Neptune }, { key: "pluto", name: "冥王星", glyph: "♇", body: Body.Pluto },
] as const;

const ASPECTS = [
  { name: "合相", glyph: "☌", angle: 0, orb: 8 }, { name: "六分相", glyph: "⚹", angle: 60, orb: 5 },
  { name: "四分相", glyph: "□", angle: 90, orb: 7 }, { name: "三分相", glyph: "△", angle: 120, orb: 7 },
  { name: "对分相", glyph: "☍", angle: 180, orb: 8 },
] as const;

const SIGN_THEMES: Record<string, string> = {
  白羊座: "主动开创", 金牛座: "稳定与价值", 双子座: "交流与理解", 巨蟹座: "照顾与归属", 狮子座: "表达与创造", 处女座: "辨析与改进",
  天秤座: "关系与平衡", 天蝎座: "深度与转化", 射手座: "探索与信念", 摩羯座: "责任与建构", 水瓶座: "独立与革新", 双鱼座: "感受与联结",
};

const normalize = (value: number) => ((value % 360) + 360) % 360;
const signedDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;
const degrees = (value: number) => value * Math.PI / 180;
const radians = (value: number) => value * 180 / Math.PI;
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function position(body: Body, time: Date) {
  return normalize(Ecliptic(GeoVector(body, time, true)).elon);
}

function zodiacAt(longitude: number) {
  return ZODIAC[Math.floor(normalize(longitude) / 30)];
}

function angleAt(key: "asc" | "mc", name: string, glyph: string, longitude: number): ChartAngle {
  const normalized = normalize(longitude);
  return { key, name, glyph, longitude: round(normalized, 4), degreeInSign: round(normalized % 30), sign: zodiacAt(normalized) };
}

function calculateAngles(time: AstroTime, latitude: number, longitude: number) {
  const theta = degrees(normalize(SiderealTime(time) * 15 + longitude));
  const epsilon = degrees(e_tilt(time).tobl);
  const phi = degrees(latitude);
  const asc = radians(Math.atan2(-Math.cos(theta), Math.sin(epsilon) * Math.tan(phi) + Math.cos(epsilon) * Math.sin(theta)));
  const mc = radians(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(epsilon)));
  return [angleAt("asc", "上升点", "ASC", asc), angleAt("mc", "天顶", "MC", mc)] as ChartAngle[];
}

function detectAspects(planets: PlanetPosition[]): NatalAspect[] {
  const results: NatalAspect[] = [];
  for (let i = 0; i < planets.length; i += 1) for (let j = i + 1; j < planets.length; j += 1) {
    const separation = Math.abs(signedDelta(planets[i].longitude, planets[j].longitude));
    const match = ASPECTS.map((aspect) => ({ ...aspect, distance: Math.abs(separation - aspect.angle) })).filter((aspect) => aspect.distance <= aspect.orb).sort((a, b) => a.distance - b.distance)[0];
    if (match) results.push({ key: `${planets[i].key}-${planets[j].key}-${match.angle}`, name: match.name, glyph: match.glyph, angle: match.angle, orb: round(match.distance), first: planets[i].name, second: planets[j].name });
  }
  return results.sort((a, b) => a.orb - b.orb);
}

function validate(input: AstrologyInput) {
  if (!Number.isInteger(input.year) || input.year < 1900 || input.year > 2100) throw new Error("占星计算目前支持 1900–2100 年");
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12 || !Number.isInteger(input.day) || input.day < 1 || input.day > 31) throw new Error("请输入有效的公历出生日期");
  const check = new Date(Date.UTC(input.year, input.month - 1, input.day));
  if (check.getUTCFullYear() !== input.year || check.getUTCMonth() !== input.month - 1 || check.getUTCDate() !== input.day) throw new Error("请输入有效的公历出生日期");
  if (input.hour !== null && (!Number.isInteger(input.hour) || input.hour < 0 || input.hour > 23)) throw new Error("请输入有效的出生小时");
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90 || !Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) throw new Error("请输入有效的出生地经纬度");
}

export function calculateAstrology(input: AstrologyInput): AstrologyResult {
  validate(input);
  const timeKnown = input.hour !== null;
  const localHour = input.hour ?? 12;
  const utcMillis = Date.UTC(input.year, input.month - 1, input.day, localHour, input.minute) - input.utcOffsetMinutes * 60_000;
  const date = new Date(utcMillis);
  const astroTime = MakeTime(date);
  const angles = timeKnown ? calculateAngles(astroTime, input.latitude, input.longitude) : [];
  const ascSignIndex = angles[0]?.sign.index ?? null;
  const planets: PlanetPosition[] = PLANETS.map((planet) => {
    const longitude = position(planet.body, date);
    const previous = position(planet.body, new Date(utcMillis - 12 * 60 * 60_000));
    const next = position(planet.body, new Date(utcMillis + 12 * 60 * 60_000));
    const sign = zodiacAt(longitude);
    return {
      key: planet.key, name: planet.name, glyph: planet.glyph, longitude: round(longitude, 4), degreeInSign: round(longitude % 30), sign,
      house: ascSignIndex === null ? null : ((sign.index - ascSignIndex + 12) % 12) + 1,
      retrograde: !["sun", "moon"].includes(planet.key) && signedDelta(previous, next) < 0,
    };
  });
  const houseCusps = ascSignIndex === null ? null : Array.from({ length: 12 }, (_, index) => normalize(ascSignIndex * 30 + index * 30));
  const aspects = detectAspects(planets);
  const elementBalance: AstrologyResult["elementBalance"] = { 火: 0, 土: 0, 风: 0, 水: 0 };
  const modalityBalance: AstrologyResult["modalityBalance"] = { 基本: 0, 固定: 0, 变动: 0 };
  planets.forEach((planet) => { elementBalance[planet.sign.element] += 1; modalityBalance[planet.sign.modality] += 1; });
  const sun = planets[0], moon = planets[1], asc = angles[0];
  const leadingElement = (Object.entries(elementBalance) as Array<[keyof typeof elementBalance, number]>).sort((a, b) => b[1] - a[1])[0][0];
  const tightAspect = aspects[0];
  const headline = asc
    ? `太阳${sun.sign.name}追求${SIGN_THEMES[sun.sign.name]}，月亮${moon.sign.name}照见内在需要，上升${asc.sign.name}是你进入世界的方式。`
    : `太阳${sun.sign.name}追求${SIGN_THEMES[sun.sign.name]}，月亮${moon.sign.name}提示内在需要；补充准确时间后，才能确认上升与宫位。`;
  const themes = [
    `核心三要素：太阳 ${sun.sign.name} ${sun.degreeInSign}°、月亮 ${moon.sign.name} ${moon.degreeInSign}°${asc ? `、上升 ${asc.sign.name} ${asc.degreeInSign}°` : "（上升未知）"}。`,
    `${leadingElement}元素数量相对突出（${elementBalance[leadingElement]}/10），可观察这种倾向如何被现实环境支持或修正。`,
    tightAspect ? `最紧密主要相位为${tightAspect.first}${tightAspect.name}${tightAspect.second}，容许度 ${tightAspect.orb}°。` : "当前容许度内未形成主要相位，不据此扩张结论。",
  ];
  const rules = [
    "采用热带黄道、地心视角与真黄道经度；行星位置由 Astronomy Engine 2.1.19 计算。",
    "星历模型基于 VSOP87 与 NOVAS；本产品展示至 0.01°，不暗示高于底层模型的精度。",
    "宫位采用整宫制：上升星座为第一宫，每个星座依次对应一宫；天顶单独显示，不强制作为第十宫宫头。",
    "主要相位容许度：合相/对分相 8°，四分相/三分相 7°，六分相 5°。",
  ];
  const warnings = [
    "占星属于象征性自我探索，不是科学预测，也不替代医疗、法律、财务或心理专业意见。",
    "当前 UTC 偏移由用户按出生当日民用时间选择；尚未自动解析 IANA 历史时区与夏令时。",
  ];
  if (!timeKnown) warnings.push("出生时间未知：以当地中午估算行星位置，不生成上升点、天顶、宫位；月亮当天可能跨星座。", "未知时间模式下不要使用月亮精确度数作边界性判断。");
  return {
    engine: { name: "LifeMirror Natal Core", version: "0.1.0", model: "Astronomy Engine 2.1.19 · VSOP87/NOVAS", zodiac: "热带黄道", houseSystem: "整宫制 Whole Sign" },
    utcTime: date.toISOString(), timeKnown, planets, angles, houseCusps, aspects, elementBalance, modalityBalance, headline, themes, rules, warnings,
  };
}
