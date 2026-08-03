export type KnowledgePackId = "astrology" | "bazi" | "personality" | "psychology";

export type KnowledgePack = {
  id: KnowledgePackId;
  eyebrow: string;
  name: string;
  symbol: string;
  summary: string;
  perspective: string;
  source: string;
  evidence: "cultural" | "research" | "mixed";
  boundary: string;
  prompts: readonly string[];
};

export const KNOWLEDGE_PACKS: readonly KnowledgePack[] = [
  {
    id: "astrology",
    eyebrow: "ASTROLOGY · SYMBOLIC",
    name: "占星镜像",
    symbol: "✦",
    summary: "从出生日期建立一个基础星座视角，用象征语言观察表达方式与当前关注点。",
    perspective: "象征体系",
    source: "西方占星的太阳星座框架",
    evidence: "cultural",
    boundary: "不预测事件，不把星座倾向当作人格事实。",
    prompts: ["最近最想理解的生活领域", "这段描述哪里像你、哪里不像你", "你希望验证哪种新行动"],
  },
  {
    id: "bazi",
    eyebrow: "BAZI · CHINESE SYMBOLIC",
    name: "命盘镜像",
    symbol: "命",
    summary: "先以出生年份建立生肖与五行的基础文化视角，再把象征带回现实经验。",
    perspective: "中国象征体系",
    source: "干支纪年与五行文化框架",
    evidence: "cultural",
    boundary: "当前为年柱基础镜像，不等同于完整四柱排盘或命运判断。",
    prompts: ["你如何使用自己的优势", "什么情境会让优势变成过度", "现实中哪条证据支持或反驳它"],
  },
  {
    id: "personality",
    eyebrow: "PERSONALITY · MULTI-PERSPECTIVE",
    name: "人格镜像",
    symbol: "人",
    summary: "用开放性、秩序感、社交能量与情绪敏感度四个维度生成可验证的自我观察。",
    perspective: "人格模型",
    source: "Big Five 启发式自评维度",
    evidence: "research",
    boundary: "这是当下自评，不是诊断、类型标签或固定人格结论。",
    prompts: ["哪个维度最符合最近的你", "不同场景下是否会变化", "你想保留或调整什么"],
  },
  {
    id: "psychology",
    eyebrow: "PSYCHOLOGY · REFLECTION",
    name: "心理镜像",
    symbol: "心",
    summary: "从压力、恢复、连接与行动感四个方向做一次温和状态扫描。",
    perspective: "心理学知识",
    source: "压力与心理资源的通用反思框架",
    evidence: "research",
    boundary: "不提供临床诊断或治疗建议；持续困扰请寻求合格专业支持。",
    prompts: ["压力主要来自哪里", "什么正在帮助你恢复", "下一步最小可行行动是什么"],
  },
] as const;

export function getKnowledgePack(id: string) {
  return KNOWLEDGE_PACKS.find((pack) => pack.id === id);
}

export function getSunSign(date: string): string {
  const [, monthText, dayText] = date.split("-");
  const month = Number(monthText);
  const day = Number(dayText);
  const cutoffs = [20, 19, 20, 20, 21, 21, 22, 22, 22, 23, 22, 21];
  const signs = ["摩羯座", "水瓶座", "双鱼座", "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座"];
  return signs[day <= cutoffs[month - 1] ? month - 1 : month];
}

export function getYearPillar(year: number) {
  const stems = ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己"];
  const elements = ["金", "金", "水", "水", "木", "木", "火", "火", "土", "土"];
  const branches = ["申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未"];
  const animals = ["猴", "鸡", "狗", "猪", "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊"];
  const stemIndex = ((year % 10) + 10) % 10;
  const branchIndex = ((year % 12) + 12) % 12;
  return { label: `${stems[stemIndex]}${branches[branchIndex]}`, element: elements[stemIndex], animal: animals[branchIndex] };
}
