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

type MinorMeaning = readonly [upright: string, reversed: string];

const minorMeanings: Record<TarotSuit, readonly MinorMeaning[]> = {
  wands: [
    ["新行动的火种，先确认热情愿意落在哪一步", "想开始却分散，或把冲动误当成准备完成"],
    ["站在选择点规划扩张，视野已经超过眼前", "计划停在想象，害怕离开熟悉范围"],
    ["等待早期投入得到回声，同时继续看远处", "进展延迟，目标过大或合作反馈不足"],
    ["阶段成果、归属与值得被确认的庆祝", "表面和谐但基础未稳，或私人空间被打扰"],
    ["多方意志碰撞，通过磨合看清真实能力", "逃避冲突、内耗，或争执失去共同目标"],
    ["成果被看见、获得支持，但也承担期待", "外部认可不足，或过度依赖掌声确认自己"],
    ["守住已经取得的位置，为边界与立场发声", "长期防御带来疲惫，或压力下开始退让"],
    ["消息与行动快速推进，时机要求及时回应", "节奏混乱、沟通延误，行动快过判断"],
    ["经历消耗后仍保持警觉，接近最后一道关口", "过度戒备、旧伤主导判断，或已无力硬撑"],
    ["承担很多责任，成果与负荷同时到来", "责任失衡、无法委托，或终于准备放下重担"],
    ["带着好奇试探新方向，讯息值得进一步验证", "三分钟热度、消息不成熟，或害怕迈出第一步"],
    ["目标明确、快速推进，热情具有感染力", "躁进、易怒，或只追逐刺激而忽略后果"],
    ["以自信和创造力凝聚他人，也照顾自己的火", "嫉妒、耗竭，或把强势当成影响力"],
    ["把愿景变成可执行方向，并愿意承担结果", "控制、傲慢，或愿景宏大却缺少持续行动"],
  ],
  cups: [
    ["情感重新流动，允许真实感受被接住", "情绪被压住、付出枯竭，或需要先照顾自己"],
    ["彼此回应、价值互认与平等靠近", "吸引仍在但交流失衡，或关系出现误解与距离"],
    ["友谊、支持网络与共同分享的喜悦", "圈层摩擦、过度迎合，或用热闹回避真实感受"],
    ["对现有选项失去感觉，需要分辨疲惫与不想要", "重新看见机会，或从停滞中开始恢复回应"],
    ["失落值得被承认，但仍有资源尚未离开", "逐步接受、愿意修复，或仍反复停在遗憾里"],
    ["旧记忆、熟悉感与单纯愿望重新出现", "过度怀旧、被过去牵制，或准备以新眼光告别"],
    ["选项与想象很多，需要把欲望放回现实筛选", "迷雾变薄、开始取舍，或仍被诱惑和投射牵引"],
    ["主动离开已不再滋养自己的情感结构", "害怕离开、反复返回，或尚未完成必要的告别"],
    ["愿望实现与情感满足，同时检视是否真正充实", "短暂满足、贪多，或外在拥有仍填不满内在"],
    ["共享的安全感、关系归属与长期情感愿景", "家庭或关系期待不一致，表面圆满下仍有裂缝"],
    ["对感受保持开放，带来温柔但尚稚嫩的讯息", "情绪敏感、逃进幻想，或不敢直接表达在意"],
    ["以浪漫和感受靠近目标，愿意表达心意", "理想化、情绪反复，或承诺比行动走得更快"],
    ["成熟容纳情绪，以共情回应而不失边界", "过度承担他人情绪、依赖，或忽略自己的需要"],
    ["稳定承接复杂感受，情绪不再替判断掌舵", "压抑、冷处理、情绪操控，或表面平静内里失衡"],
  ],
  swords: [
    ["事实切开混乱，适合定义问题与作出清楚判断", "信息不足、思路打结，或真相被刻意回避"],
    ["暂缓决定以保护平衡，但期限需要被说清", "僵局松动、信息涌入，或继续拖延已带来代价"],
    ["承认刺痛与分离，让事实而非想象完成疗愈", "伤口开始愈合，或压住痛苦导致反复触发"],
    ["主动休息、整合信息，为下一步恢复判断力", "无法停下、耗竭，或休息过久变成逃避"],
    ["赢得争论不等于赢得关系，需评估冲突代价", "愿意和解、结束消耗，或怨气仍未真正处理"],
    ["离开混乱、逐步过渡，改变虽慢但方向清楚", "旧问题被带上新船，或抗拒必要的转场"],
    ["策略、保留与非正面路径，需要核对诚信边界", "隐瞒暴露、愿意坦白，或仍在自我欺骗"],
    ["限制部分来自认知与恐惧，先寻找可移动的一步", "看见出口、重获主动，或仍害怕承担选择"],
    ["焦虑把可能性放大，区分事实、解释与最坏想象", "压力缓解、愿意求助，或焦虑已深到需要支持"],
    ["一个思维或冲突周期走到极限，无法再照旧继续", "最坏阶段过去、开始恢复，或拒绝承认必须结束"],
    ["保持警觉、收集信息，以提问代替过早结论", "流言、监视、言语冒进，或只搜证据支持成见"],
    ["直接行动和快速表达能破局，也可能伤及细节", "冲动受阻、言辞攻击，或缺少计划导致反复"],
    ["独立判断、清楚边界，以事实面对复杂处境", "过度批判、冷硬，或用理性切断真实感受"],
    ["战略、规则与长期判断，先建立可验证标准", "滥用权威、强辩，或逻辑服务于控制而非真相"],
  ],
  pentacles: [
    ["现实机会与可积累资源出现，适合从小处落地", "机会成本被忽略、资源不稳，或迟迟不肯开始"],
    ["在多项责任间动态平衡，节奏比完美更重要", "事情过载、优先级失控，或财务与时间安排失衡"],
    ["专业协作、技能被看见，成果来自明确分工", "合作标准不一、沟通不足，或只做表面功夫"],
    ["保护资源与安全感，同时防止占有变成停滞", "愿意松手、财务不安，或控制资源造成关系紧张"],
    ["匮乏与被排除感很真实，但支持可能比想象更近", "开始恢复、愿意求助，或物质压力仍需实际方案"],
    ["给予与接受需要平衡，资源流动也包含权力关系", "有条件的帮助、债务失衡，或付出没有尊重边界"],
    ["长期投入进入评估期，耐心与调整要同时存在", "回报延迟、无效坚持，或因焦躁过早放弃积累"],
    ["重复练习、打磨技能，让可靠性胜过一时灵感", "机械劳动、完美主义，或缺少学习导致成果停滞"],
    ["独立成果、稳定生活与享受自己建立的价值", "外表富足但内在孤立，或安全感依赖物质证明"],
    ["长期传承、共同资源与稳定结构带来的支持", "家庭资源冲突、短视，或旧规则限制新的生活"],
    ["从可执行的小事开始学习，认真对待现实反馈", "拖延、缺乏计划，或只想结果不愿练基本功"],
    ["稳定、耐心、按流程推进，慢但可持续", "停滞、固执、工作失衡，或可靠变成缺少弹性"],
    ["务实照料人与资源，让丰盛具有可持续边界", "过度操心、忽略自己，或用物质照料代替情感回应"],
    ["管理资源、承担长期责任，以稳定创造安全感", "唯利、僵化，或把拥有资源当成控制他人的理由"],
  ],
};

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
    ranks.map(([id, rank], index) => ({
      id: `${suit}-${id}`,
      name: `${meta.name}${rank}`,
      roman: String(index + 1),
      arcana: "minor" as const,
      suit,
      element: meta.element,
      upright: `${minorMeanings[suit][index][0]}；核心领域：${meta.focus}`,
      reversed: `${minorMeanings[suit][index][1]}；阴影领域：${meta.shadow}`,
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
  const courtCount = cards.filter((card) => card.arcana === "minor" && /侍从|骑士|王后|国王/.test(card.name)).length;
  const uniqueElements = [...new Set(elements.filter((element) => element !== "精神"))];
  const interaction = uniqueElements.includes("火") && uniqueElements.includes("风")
    ? "火与风互相放大：想法需要行动承接，行动也要避免快过判断。"
    : uniqueElements.includes("水") && uniqueElements.includes("土")
      ? "水与土彼此承托：感受要落到边界、时间或资源安排上。"
      : uniqueElements.includes("火") && uniqueElements.includes("水")
        ? "火与水形成张力：推进欲望与情绪安全需要被分别表达。"
        : uniqueElements.includes("风") && uniqueElements.includes("土")
          ? "风与土形成张力：理想方案需要通过成本、节奏和执行验证。"
          : "牌组没有形成单一元素组合，需按每个牌位分别核对。";
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
    courtCount,
    interaction,
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
  method: string;
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
    relationship: `${relations.repeatedElement ? `${relations.repeatedElement}元素重复，让多张牌指向同一类课题；它是本次牌阵的主轴。` : `${relations.headline}。`}${relations.interaction}${relations.courtCount ? `宫廷牌出现 ${relations.courtCount} 张，提示角色姿态、沟通方式或成熟度也是问题的一部分。` : ""}${relations.counterSignal}`,
    shiguang: `如果由拾光陪你读，我会先看${strongest.name}：${cardMeaning(strongest)}。${pressure ? `同时，${pressure.name}逆位说明这里可能有尚未表达、尚未准备好，或节奏被卡住的部分。` : "牌面没有明显要求你停下，但仍需要现实证据来确认方向。"}`,
    action: "写下一个支持当前方向的事实、一个反对它的事实，再选一个 24 小时内可完成且可撤回的小行动。",
    reflectionQuestion: "如果不要求牌替你保证结果，你现在最愿意为哪一步承担责任？",
    method: "采用 Rider–Waite–Smith 图像传统的现代反思式读法；综合牌位、正逆位、元素、数字／宫廷结构与牌间反向证据。它提供观察假设，不提供确定性预测。",
  };
}
