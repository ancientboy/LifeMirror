export type TheoryPartSlug = "why" | "what" | "how" | "application" | "future";

export type TheoryPartDefinition = {
  slug: TheoryPartSlug;
  number: string;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  paperIds: string[];
};

export const theoryParts: TheoryPartDefinition[] = [
  {
    slug: "why",
    number: "I",
    label: "WHY",
    title: "Why",
    subtitle: "为什么需要人生镜像",
    description: "从时代变化与人的处境出发，说明 Life Mirror 必须存在的原因。",
    paperIds: ["LM-001"],
  },
  {
    slug: "what",
    number: "II",
    label: "WHAT",
    title: "What",
    subtitle: "什么是人生镜像",
    description: "定义人生镜像的基本对象、层次与理论表达。",
    paperIds: ["LM-002"],
  },
  {
    slug: "how",
    number: "III",
    label: "HOW",
    title: "How",
    subtitle: "人生镜像如何形成与运作",
    description: "由原则、DNA、人生图谱与镜像引擎共同构成理论的运行层。",
    paperIds: ["LM-003", "LM-004", "LM-005", "LM-006"],
  },
  {
    slug: "application",
    number: "IV",
    label: "APPLICATION",
    title: "Application",
    subtitle: "人生镜像如何进入真实世界",
    description: "研究镜像体验、关系理解与镜像经济的现实应用。",
    paperIds: ["LM-007", "LM-008", "LM-009"],
  },
  {
    slug: "future",
    number: "V",
    label: "FUTURE",
    title: "Future",
    subtitle: "人类理解的未来",
    description: "讨论 AI 时代的长期理解，以及人与智能系统可能形成的新关系。",
    paperIds: ["LM-010"],
  },
];

export function getTheoryPart(slug: string) {
  return theoryParts.find((part) => part.slug === slug.toLowerCase());
}
