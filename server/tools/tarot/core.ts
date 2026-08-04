export type Arcana = "major" | "minor";
export type Orientation = "upright" | "reversed";
export type TarotSuit = "wands" | "cups" | "swords" | "pentacles";

export type TarotCard = {
  id: string;
  name: string;
  roman: string;
  arcana: Arcana;
  suit?: TarotSuit;
  element: string;
  upright: string;
  reversed: string;
};

export type DrawnCard = TarotCard & {
  orientation: Orientation;
  position: string;
};

export type TarotSpread = {
  id: "single" | "timeline" | "relationship" | "decision";
  name: string;
  description: string;
  positions: readonly { id: string; label: string; prompt: string }[];
};

const majors = [
  ["0", "愚者", "自由、启程、信任未知", "冒进、逃避准备、方向未明"],
  ["I", "魔术师", "意志、资源、主动创造", "分心、操控、能力未落地"],
  ["II", "女祭司", "直觉、静观、隐而未显", "忽略直觉、封闭、信息遮蔽"],
  ["III", "皇后", "滋养、丰盛、创造生长", "过度付出、停滞、忽视自己"],
  ["IV", "皇帝", "结构、边界、稳定掌控", "僵化、控制过度、秩序失衡"],
  ["V", "教皇", "传统、学习、共同信念", "质疑规范、独立路径、教条"],
  ["VI", "恋人", "选择、联结、价值一致", "失衡、回避选择、价值冲突"],
  ["VII", "战车", "聚焦、行动、驾驭冲突", "失控、急进、方向分裂"],
  ["VIII", "力量", "温柔勇气、耐心、自我整合", "自我怀疑、压抑、本能失衡"],
  ["IX", "隐者", "内省、独处、寻找真知", "孤立、回避、过度退缩"],
  ["X", "命运之轮", "周期、转机、顺势而变", "抗拒变化、重复模式、失去节奏"],
  ["XI", "正义", "事实、责任、公平衡量", "偏见、逃避责任、信息失衡"],
  ["XII", "倒吊人", "暂停、换位、主动放下", "拖延、无效牺牲、拒绝松手"],
  ["XIII", "死神", "结束、转化、清理旧章", "抗拒结束、滞留、转化未竟"],
  ["XIV", "节制", "调和、修复、合适比例", "过量、失衡、整合受阻"],
  ["XV", "恶魔", "欲望、依附、看见束缚", "松绑、觉察、仍受旧习牵引"],
  ["XVI", "高塔", "真相冲击、结构瓦解、释放", "延迟改变、内在震荡、惧怕崩塌"],
  ["XVII", "星星", "希望、疗愈、重新连接未来", "失望、信心微弱、疗愈受阻"],
  ["XVIII", "月亮", "潜意识、暧昧、穿越不确定", "迷雾渐散、焦虑、误读信号"],
  ["XIX", "太阳", "清晰、生命力、坦诚喜悦", "快乐受阻、过度乐观、暂未明朗"],
  ["XX", "审判", "觉醒、复盘、回应召唤", "自我苛责、迟疑、拒绝总结"],
  ["XXI", "世界", "完成、整合、阶段圆满", "尚差一步、收尾延迟、边界未闭合"],
] as const;

const suitMeta: Record<
  TarotSuit,
  { name: string; element: string; focus: string; shadow: string }
> = {
  wands: {
    name: "权杖",
    element: "火",
    focus: "行动、热情与创造",
    shadow: "躁进、耗竭或行动受阻",
  },
  cups: {
    name: "圣杯",
    element: "水",
    focus: "情感、关系与直觉",
    shadow: "情绪淤积、失望或界限模糊",
  },
  swords: {
    name: "宝剑",
    element: "风",
    focus: "思考、沟通与决定",
    shadow: "焦虑、冲突或认知偏差",
  },
  pentacles: {
    name: "星币",
    element: "土",
    focus: "现实、资源与长期建设",
    shadow: "匮乏感、停滞或现实失衡",
  },
};

const ranks = [
  ["ace", "王牌", "新的种子与纯粹潜力"],
  ["two", "二", "选择、平衡与两极"],
  ["three", "三", "展开、协作与初步成果"],
  ["four", "四", "稳定、边界与暂时停驻"],
  ["five", "五", "摩擦、变化与重新校准"],
  ["six", "六", "流动、修复与阶段进展"],
  ["seven", "七", "评估、挑战与坚持立场"],
  ["eight", "八", "推进、练习与结构化行动"],
  ["nine", "九", "成熟、临界点与独立承担"],
  ["ten", "十", "完成、累积与周期转换"],
  ["page", "侍从", "讯息、好奇与学习姿态"],
  ["knight", "骑士", "追求、行动与风格表达"],
  ["queen", "王后", "内在掌握、照料与成熟回应"],
  ["king", "国王", "外在掌握、责任与稳定领导"],
] as const;

export const TAROT_DECK: readonly TarotCard[] = [
  ...majors.map(([roman, name, upright, reversed], index) => ({
    id: `major-${index}`,
    name,
    roman,
    arcana: "major" as const,
    element: "精神",
    upright,
    reversed,
  })),
  ...(
    Object.entries(suitMeta) as [TarotSuit, (typeof suitMeta)[TarotSuit]][]
  ).flatMap(([suit, meta]) =>
    ranks.map(([id, rank, pattern], index) => ({
      id: `${suit}-${id}`,
      name: `${meta.name}${rank}`,
      roman: String(index + 1),
      arcana: "minor" as const,
      suit,
      element: meta.element,
      upright: `${pattern}；聚焦${meta.focus}`,
      reversed: `${pattern}的阴影面；可能表现为${meta.shadow}`,
    })),
  ),
];

export const THREE_CARD_POSITIONS = {
  past: { label: "形成背景", prompt: "哪些经历或惯性正在影响这个问题" },
  present: { label: "此刻核心", prompt: "当前最值得诚实面对的矛盾或资源" },
  future: { label: "发展方向", prompt: "若延续当前选择，什么趋势可能浮现" },
} as const;

export const TAROT_SPREADS: readonly TarotSpread[] = [
  {
    id: "single",
    name: "单牌聚焦",
    description: "用一张牌照见当下最值得留意的主题",
    positions: [
      { id: "focus", label: "此刻焦点", prompt: "此刻最值得看见的资源、盲点或提醒" },
    ],
  },
  {
    id: "timeline",
    name: "三牌时间线",
    description: "梳理形成背景、此刻核心与发展方向",
    positions: Object.entries(THREE_CARD_POSITIONS).map(([id, value]) => ({ id, ...value })),
  },
  {
    id: "relationship",
    name: "关系镜像",
    description: "分别看见自己、对方与关系中的共同课题",
    positions: [
      { id: "self", label: "我的位置", prompt: "我带入这段关系的需要、资源与盲点" },
      { id: "other", label: "对方位置", prompt: "对方可能呈现的立场；需要现实沟通验证" },
      { id: "dynamic", label: "关系动力", prompt: "双方互动正在共同形成的模式或课题" },
    ],
  },
  {
    id: "decision",
    name: "决策澄清",
    description: "比较动机、路径、代价、替代方案与验证行动",
    positions: [
      { id: "motive", label: "真实动机", prompt: "这个选择背后真正想满足的需要" },
      { id: "path", label: "当前路径", prompt: "沿当前方案前进时可利用的条件" },
      { id: "cost", label: "代价与盲点", prompt: "容易忽略的成本、风险或反向证据" },
      { id: "alternative", label: "替代路径", prompt: "值得同时保留的另一种可能" },
      { id: "experiment", label: "最小验证", prompt: "在承诺之前可以先做的小规模现实测试" },
    ],
  },
] as const;

export function getSpread(id: TarotSpread["id"]) {
  return TAROT_SPREADS.find((spread) => spread.id === id) ?? TAROT_SPREADS[1];
}

export function drawSpread(
  spread: TarotSpread,
  randomValues: readonly number[],
): DrawnCard[] {
  if (randomValues.length < spread.positions.length * 2) {
    throw new Error(`${spread.positions.length * 2} random values are required`);
  }
  const available = [...TAROT_DECK];
  return spread.positions.map((position, index) => {
    const card = available.splice(randomValues[index] % available.length, 1)[0];
    return {
      ...card,
      position: position.id,
      orientation:
        randomValues[index + spread.positions.length] % 2
          ? "reversed"
          : "upright",
    };
  });
}

export function drawThree(randomValues: readonly number[]): DrawnCard[] {
  return drawSpread(getSpread("timeline"), randomValues);
}

export function analyzeRelations(cards: readonly DrawnCard[]) {
  const majorCount = cards.filter((card) => card.arcana === "major").length;
  const elements = cards.map((card) => card.element);
  const repeatedElement = elements.find(
    (element, index) => elements.indexOf(element) !== index,
  );
  const reversedCount = cards.filter(
    (card) => card.orientation === "reversed",
  ).length;
  const headline =
    majorCount >= 2
      ? "这组牌更强调阶段性的价值选择"
      : repeatedElement
        ? `${repeatedElement}元素重复，主题正在同一层面累积`
        : "三个层面的线索需要一起阅读";
  const counterSignal =
    reversedCount >= 2
      ? "多张逆位提醒：阻力可能主要来自内在节奏或尚未表达的部分。"
      : "逆位不是坏结果；它只是提示能量较内化、延迟或需要校准。";
  return {
    majorCount,
    repeatedElement: repeatedElement ?? null,
    reversedCount,
    headline,
    counterSignal,
  };
}

export function cardMeaning(card: DrawnCard) {
  return card.orientation === "upright" ? card.upright : card.reversed;
}

export type TarotReading = {
  overview: string;
  cardInsights: Array<{ position: string; title: string; evidence: string; interpretation: string }>;
  relationship: string;
  shiguang: string;
  action: string;
  reflectionQuestion: string;
};

export function synthesizeTarotReading(question: string, spread: TarotSpread, cards: readonly DrawnCard[]): TarotReading {
  if (cards.length !== spread.positions.length) throw new Error("cards must match the selected spread");
  const relations = analyzeRelations(cards);
  const cardInsights = cards.map((card, index) => {
    const position = spread.positions[index];
    return {
      position: position.label,
      title: `${card.name}${card.orientation === "reversed" ? "逆位" : "正位"}`,
      evidence: `${card.arcana === "major" ? "大阿尔卡那" : `${card.element}元素`} · ${position.prompt}`,
      interpretation: `${position.label}并不是结果预告，而是在“${position.prompt}”这个位置上提醒你关注：${cardMeaning(card)}。`,
    };
  });
  const strongest = cards.find((card) => card.arcana === "major") ?? cards[0];
  const pressure = cards.find((card) => card.orientation === "reversed");
  return {
    overview: relations.majorCount >= 2
      ? `这组牌的大牌密度较高，问题“${question}”更像处在价值选择或阶段转换点；重点不是马上定结果，而是确认你愿意为哪种方向负责。`
      : `这组牌主要落在可观察的现实层面。围绕“${question}”，先把情绪、判断和行动拆开，会比追问唯一答案更有帮助。`,
    cardInsights,
    relationship: relations.repeatedElement
      ? `${relations.repeatedElement}元素重复，让多张牌指向同一类课题；它是本次牌阵的主轴。${relations.counterSignal}`
      : `${relations.headline}。${relations.counterSignal}`,
    shiguang: `如果由拾光陪你读，我会先看${strongest.name}：${cardMeaning(strongest)}。${pressure ? `同时，${pressure.name}逆位说明这里可能有尚未表达、尚未准备好，或节奏被卡住的部分。` : "牌面没有明显要求你停下，但仍需要现实证据来确认方向。"}`,
    action: "写下一个支持当前方向的事实、一个反对它的事实，再选一个 24 小时内可完成且可撤回的小行动。",
    reflectionQuestion: "如果不要求牌替你保证结果，你现在最愿意为哪一步承担责任？",
  };
}
