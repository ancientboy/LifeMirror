import type { PlanetPosition } from "./types.js";

export type PlanetInsight = { key: string; title: string; evidence: string; interpretation: string };

const PLANET_MEANINGS: Record<string, string> = {
  sun: "自我意志、生命力与希望活成的样子", moon: "情绪反应、安全感与本能需求", mercury: "思考方式、学习习惯与表达路径", venus: "关系中的价值感、审美与亲近方式", mars: "行动冲动、欲望、界限与冲突处理", jupiter: "扩张、信念、机会感与成长方向", saturn: "责任、边界、时间感与需要长期练习的课题", uranus: "独立性、改变冲动与不愿被规训的部分", neptune: "想象、共情、理想化与容易模糊的边界", pluto: "控制感、深层转化与不愿轻易交出的力量",
};
const SIGN_TONES: Record<string, string> = {
  白羊座: "更直接、先行动后确认", 金牛座: "更重稳定、身体感受与可持续性", 双子座: "更靠交流、比较与快速连接信息", 巨蟹座: "更受情感记忆、照顾与归属感牵动", 狮子座: "更需要创造性表达、认可与真诚呈现", 处女座: "更通过分析、细节与实际改善来运作", 天秤座: "更重关系平衡、协商与彼此回应", 天蝎座: "更重深度、信任与真实的情感交换", 射手座: "更靠意义、远景与探索来扩大自己", 摩羯座: "更重责任、结果与可被兑现的承诺", 水瓶座: "更重独立判断、群体位置与新的可能", 双鱼座: "更靠直觉、想象与共情来感知世界",
};
const HOUSE_TOPICS: Record<number, string> = { 1: "自我呈现、身体感与起步方式", 2: "资源、金钱与自我价值", 3: "学习、表达、手足与日常交流", 4: "家庭、根基、私密空间与情绪来源", 5: "创造、恋爱、玩乐与被看见", 6: "日常工作、技能、健康与秩序", 7: "亲密关系、合作与一对一互动", 8: "共享资源、信任、危机与深层连结", 9: "信念、远行、高等学习与世界观", 10: "事业方向、公共角色与长期目标", 11: "朋友、社群、理想与未来计划", 12: "潜意识、休息、隐退与难以言说的部分" };

function formatDegree(value: number) { const degree = Math.floor(value); const minute = Math.round((value - degree) * 60); return `${degree}°${String(minute === 60 ? 0 : minute).padStart(2, "0")}′`; }

/** One rendered card is produced from exactly one calculated planet object. */
export function explainPlanet(planet: PlanetPosition): PlanetInsight {
  const location = `${planet.sign.name} ${formatDegree(planet.degreeInSign)}${planet.house ? ` · 第 ${planet.house} 宫` : ""}${planet.retrograde ? " · 逆行" : ""}`;
  const house = planet.house ? `这会把主题特别带到${HOUSE_TOPICS[planet.house]}。` : "出生时间未知，因此不把它延伸为宫位主题。";
  const retrograde = planet.retrograde ? "逆行不表示不好；它更像让这颗星的议题先在内在反复校准，再形成自己的表达方式。" : "";
  return { key: planet.key, title: `${planet.name}：${PLANET_MEANINGS[planet.key] ?? "个人经验中的一条重要主题"}`, evidence: `${planet.name} ${location}`, interpretation: `落在${planet.sign.name}时，这部分通常${SIGN_TONES[planet.sign.name] ?? "呈现出这组星座的表达方式"}。${house}${retrograde}` };
}

export function buildPlanetInsights(planets: PlanetPosition[]) { return planets.map(explainPlanet); }
