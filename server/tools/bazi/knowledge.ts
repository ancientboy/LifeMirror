/**
 * Fixed, reviewable reference layer for the Four Pillars report.
 * These entries never come from the LLM.  They describe terminology and
 * reading order only; contested pattern / useful-god conclusions stay out.
 */
export const BAZI_REFERENCE = {
  edition: "bazi-reference/1.0",
  sources: [
    "《三命通会》：四柱、月令与十神的传统框架（作为术语来源）",
    "《渊海子平》：十神与干支关系的传统框架（作为术语来源）",
    "《子平真诠》：月令为阅读起点；格局、用神须全局辨析（作为边界依据）",
  ],
} as const;

export const PILLAR_SCOPE: Record<string, string> = {
  year: "早年环境、家族脉络与进入社会时的外部背景",
  month: "成长环境、季节气势与更常被使用的社会角色",
  day: "日主自身，以及亲密关系中最贴身的立场",
  time: "后期发展、内在愿望、作品或后辈议题",
};

export const TEN_GOD_MEANING: Record<string, string> = {
  比肩: "同类、并行与自主", 劫财: "竞争、分配与行动同伴", 食神: "表达、创造与稳定输出", 伤官: "突破、批判与不愿受限的表达",
  偏财: "机会、流动资源与外部连接", 正财: "现实责任、稳定资源与可执行经营", 七杀: "压力、决断与必须面对的挑战", 正官: "规则、责任、秩序与可被信任的角色",
  偏印: "非主流学习、直觉与独处吸收", 正印: "支持、学习、保护与系统资源",
};

export const ELEMENT_MEANING: Record<string, string> = {
  木: "生长、规划与向外展开", 火: "表达、热度与行动显化", 土: "承载、边界与现实稳定", 金: "判断、规则与收束取舍", 水: "流动、学习与资源连接",
};
