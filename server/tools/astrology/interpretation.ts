import type { NatalAspect, PlanetPosition } from "./types.js";

export type PlanetInsight = {
  key: string;
  title: string;
  evidence: string;
  principle: string;
  signReading: string;
  houseReading: string;
  synthesis: string;
  retrogradeNote: string | null;
};

export type AspectInsight = { key: string; title: string; evidence: string; interpretation: string; practice: string };

type PlanetRule = { domain: string; principle: string; strength: string; excess: string };
type SignRule = { style: string; resource: string; blindSpot: string };
type HouseRule = { field: string; question: string; risk: string };

// This is the professional-rule layer.  It is deliberately static and reviewable:
// no LLM writes, expands, or selects any of these statements at render time.
const PLANET_RULES: Record<string, PlanetRule> = {
  sun: { domain: "自我认同、意志与生命力", principle: "太阳描述一个人希望主动活出来的中心感、尊严感与创造方向。", strength: "当它被有意识地使用时，通常表现为稳定的意志、承担感与自我表达。", excess: "失衡时，容易把被认可或掌控局面误当作自我价值的唯一来源。" },
  moon: { domain: "情绪反应、安全感与习惯", principle: "月亮描述自动的情绪反应、熟悉感与需要被照顾的方式。", strength: "当情绪需要被承认时，它能形成直觉、记忆力与照顾自己或他人的能力。", excess: "失衡时，容易先用旧有防卫反应处理新情况。" },
  mercury: { domain: "思考、学习与沟通", principle: "水星描述接收信息、形成判断、命名经验与表达观点的路径。", strength: "运作顺畅时，它让人能把观察转化为清楚的问题、语言和方法。", excess: "失衡时，容易停在反复推演、过快下结论或只用语言取代真正沟通。" },
  venus: { domain: "价值、关系与审美", principle: "金星描述喜欢与不喜欢、交换价值、亲近方式以及感到愉悦的条件。", strength: "成熟的金星能建立互惠、品味、协商与被善待的能力。", excess: "失衡时，容易为了和谐、吸引力或安全感而模糊真实偏好。" },
  mars: { domain: "行动、欲望与边界", principle: "火星描述启动行动、争取、说不、竞争与处理冲突的方式。", strength: "被良好使用时，它提供决断、勇气、执行力与清晰边界。", excess: "失衡时，可能急于证明、压抑怒气后突然爆发，或把冲突当成唯一推进方式。" },
  jupiter: { domain: "信念、扩张与成长", principle: "木星描述寻找意义、扩大视野、建立信念和分享资源的方式。", strength: "它能带来学习欲、宽阔感与把经验连成更大图景的能力。", excess: "失衡时，容易过度承诺、把乐观当作证据，或忽略现实尺度。" },
  saturn: { domain: "责任、边界与时间", principle: "土星描述需要经由时间、纪律与现实检验来成熟的课题。", strength: "长期投入后，它能形成耐力、专业性、结构感与可靠性。", excess: "失衡时，容易把谨慎变成自我否定，或以控制取代安全感。" },
  uranus: { domain: "独立、变化与更新", principle: "天王星描述不愿盲从的部分、突发的觉醒，以及更新旧规则的动力。", strength: "它支持独立思考、创新与从僵化模式中松动出来。", excess: "失衡时，可能为了自由而过快切断，或把反对本身当作身份。" },
  neptune: { domain: "想象、共情与理想", principle: "海王星描述感受边界变薄的领域：想象、艺术、信念、共情与投射。", strength: "被现实承接时，它能转化为同理心、灵感与对复杂经验的容纳。", excess: "失衡时，容易理想化、逃避细节，或把愿望当成事实。" },
  pluto: { domain: "权力、失去与深层转化", principle: "冥王星描述难以轻易放手、需要经历重组与恢复力量感的深层主题。", strength: "经由诚实面对后，它能带来韧性、洞察与彻底更新的能力。", excess: "失衡时，容易走向控制、极端化，或把脆弱感藏得过深。" },
};

const SIGN_RULES: Record<string, SignRule> = {
  白羊座: { style: "以直接、先行和迅速试错的方式表达", resource: "敢于率先启动并把犹豫化为行动", blindSpot: "容易把速度当成确定性，忽略他人的节奏" },
  金牛座: { style: "以稳定、感官、积累和可持续的方式表达", resource: "能长期投入，并把价值落到具体资源与身体感受", blindSpot: "容易因为不想失去既有安全感而延迟调整" },
  双子座: { style: "以观察、比较、交流和连接信息的方式表达", resource: "学习快，能在不同观点之间建立联系", blindSpot: "容易停在分散的信息流里，回避更深的取舍" },
  巨蟹座: { style: "以保护、记忆、照顾和归属感的方式表达", resource: "能感知情绪气候，并建立可被安放的关系空间", blindSpot: "容易把熟悉感当成安全，把防卫当成亲近" },
  狮子座: { style: "以创造、真诚、热情和被看见的方式表达", resource: "能赋予经验热度、风格与个人承担", blindSpot: "容易把不被回应误读为自我价值被否定" },
  处女座: { style: "以辨析、服务、修正和具体方法的方式表达", resource: "擅长发现可改善之处，并把复杂问题拆成步骤", blindSpot: "容易过度挑错或把有用等同于值得被爱" },
  天秤座: { style: "以协商、比较、审美与关系平衡的方式表达", resource: "能看见多方立场，建立公平的互动规则", blindSpot: "容易为了维持和气而延后真实选择" },
  天蝎座: { style: "以深度、专注、信任与真实交换的方式表达", resource: "能承受复杂情绪，并在危机中看见核心问题", blindSpot: "容易用试探、控制或沉默保护脆弱感" },
  射手座: { style: "以意义、远景、探索和信念的方式表达", resource: "能把局部经验放回更大的图景，并保持探索动力", blindSpot: "容易跳过细节或把自己的信念当作唯一答案" },
  摩羯座: { style: "以责任、目标、成果与长期结构的方式表达", resource: "能延迟满足、承担后果，并把目标持续落地", blindSpot: "容易把效率和成就感放在情绪需要之前" },
  水瓶座: { style: "以独立判断、原则、社群与新可能的方式表达", resource: "能跳出旧框架，思考更公平或更前瞻的方案", blindSpot: "容易为了保持理性距离而忽略当下情感" },
  双鱼座: { style: "以直觉、想象、共感和包容的方式表达", resource: "能接住细微感受，并以艺术或同理心连接经验", blindSpot: "容易边界松散，把同情、期待与现实混在一起" },
};

const HOUSE_RULES: Record<number, HouseRule> = {
  1: { field: "自我呈现、身体感与起步方式", question: "你如何主动进入一个场域，并让别人先感受到你？", risk: "不要只凭第一反应定义自己" },
  2: { field: "金钱、资源、自我价值与拥有感", question: "你靠什么建立稳定感，并如何衡量自己的价值？", risk: "不要把资源多寡直接等同于自我价值" },
  3: { field: "学习、表达、手足、邻里与日常交流", question: "你怎样处理信息、日常互动和近距离沟通？", risk: "不要让碎片沟通替代真正说明" },
  4: { field: "家庭、根基、私人空间与情绪来源", question: "你需要怎样的私密空间与归属，才能恢复自己？", risk: "不要把原生的应对方式当作唯一选择" },
  5: { field: "创造、恋爱、玩乐、子女与被看见", question: "你愿意为哪种热爱冒险，并怎样允许自己发光？", risk: "不要把回应度当成创作或爱的唯一标准" },
  6: { field: "日常工作、技能、服务、健康与秩序", question: "你如何把能力变成可持续的日常系统？", risk: "不要以过度修正和忙碌消耗自己" },
  7: { field: "伴侣、合作、契约与一对一关系", question: "你会在亲密或合作中寻找、投射或练习什么？", risk: "不要把自己的需求全部交给对方来定义" },
  8: { field: "共享资源、信任、失去、危机与深层连结", question: "当控制感被触动时，你如何协商依赖、权力与信任？", risk: "不要把防卫或占有误认成深度" },
  9: { field: "信念、远行、高等学习、法律与世界观", question: "什么经验会扩张你的眼界，并让你重写人生信念？", risk: "不要让抽象信念脱离具体事实" },
  10: { field: "事业方向、公众角色、名望与长期目标", question: "你希望在外部世界承担什么角色，并被怎样信任？", risk: "不要用外界评价完全接管人生方向" },
  11: { field: "朋友、社群、理想、网络与未来计划", question: "你会和怎样的人共创未来，又为群体带来什么？", risk: "不要为了归属感放弃个人判断" },
  12: { field: "潜意识、休息、隐退、慈悲与难以言说之处", question: "哪些经验需要安静消化，而不是立刻用行动解决？", risk: "不要用逃避、牺牲或模糊边界替代休息" },
};

const ASPECT_RULES: Record<string, { dynamic: string; practice: string }> = {
  合相: { dynamic: "两种功能在同一处高度聚焦，既能相互增强，也容易彼此遮蔽。", practice: "先辨认哪一个功能正在主导；把另一方也留在决策桌上。" },
  六分相: { dynamic: "两种功能存在可调用的协作通道，但需要主动练习才会成为资源。", practice: "在小场景中刻意把两种能力一起使用，而不是等待机会自己出现。" },
  三分相: { dynamic: "两种功能较容易自然配合，往往形成熟悉、顺手的心理路径。", practice: "把顺手之处转为可见能力，同时留意舒适感是否让你避开必要挑战。" },
  四分相: { dynamic: "两种需要持续摩擦，压力下容易轮流抢占主导权。", practice: "不要急着消灭其中一端；给两种需要各自安排现实出口。" },
  对分相: { dynamic: "两端都重要，常在关系、选择或外部事件中被投射出来。", practice: "当你只站在一端时，主动寻找另一端正在要求你学习什么。" },
};

function formatDegree(value: number) {
  const degree = Math.floor(value);
  const minute = Math.round((value - degree) * 60);
  return `${degree}°${String(minute === 60 ? 0 : minute).padStart(2, "0")}′`;
}

/** Produces one deterministic professional reading from one calculated planet. */
export function explainPlanet(planet: PlanetPosition): PlanetInsight {
  const planetRule = PLANET_RULES[planet.key] ?? { domain: "个人经验中的重要主题", principle: "这颗星代表一项需要结合全盘判断的心理功能。", strength: "它可以成为一项可练习的资源。", excess: "它也可能在压力下失去平衡。" };
  const signRule = SIGN_RULES[planet.sign.name] ?? { style: "呈现出这组星座的表达方式", resource: "形成可被使用的资源", blindSpot: "在压力下失衡" };
  const houseRule = planet.house ? HOUSE_RULES[planet.house] : null;
  const location = `${planet.sign.name} ${formatDegree(planet.degreeInSign)}${planet.house ? ` · 第 ${planet.house} 宫` : ""}${planet.retrograde ? " · 逆行" : ""}`;
  return {
    key: planet.key,
    title: `${planet.name}：${planetRule.domain}`,
    evidence: `${planet.name} ${location}`,
    principle: planetRule.principle,
    signReading: `落在${planet.sign.name}，${planetRule.domain}会${signRule.style}。它的可用资源是${signRule.resource}；在压力下则要留意${signRule.blindSpot}。`,
    houseReading: houseRule ? `位于第 ${planet.house} 宫，这个议题更常通过「${houseRule.field}」发生。重点问题是：${houseRule.question}${houseRule.risk}。` : "出生时间未知，因此不把这颗星延伸为宫位判断；它仍可从星座与相位阅读。",
    synthesis: `把${planet.name}、${planet.sign.name}${planet.house ? `与第 ${planet.house} 宫` : ""}放在一起看：${planetRule.strength} ${planetRule.excess}`,
    retrogradeNote: planet.retrograde ? `${planet.name}逆行不是凶象，也不等于“作用变弱”。传统现代占星通常将它读作：这项功能更需要先在内在反复检视、形成自己的标准，再选择对外表达。` : null,
  };
}

export function buildPlanetInsights(planets: PlanetPosition[]) { return planets.map(explainPlanet); }

export function explainAspect(aspect: NatalAspect): AspectInsight {
  const dynamic = ASPECT_RULES[aspect.name] ?? { dynamic: "两种功能形成需要结合全盘观察的联系。", practice: "用真实经历验证这条联系怎样出现。" };
  return {
    key: aspect.key,
    title: `${aspect.first}${aspect.name}${aspect.second}：${dynamic.dynamic}`,
    evidence: `${aspect.first} ${aspect.name} ${aspect.second} · 容许度 ${aspect.orb}°`,
    interpretation: `这是${aspect.first}与${aspect.second}所代表主题之间的结构关系。容许度是它与精确相位的距离；在同一相位类型中，数值越小通常越值得优先结合实际经历核对。`,
    practice: dynamic.practice,
  };
}

export function buildAspectInsights(aspects: NatalAspect[]) { return aspects.map(explainAspect); }
