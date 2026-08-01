export type SystemPaperDefinition = {
  id: string;
  slug: string;
  navTitle: string;
  filename: string;
  summary: string;
};

export const systemPaperDefinitions: SystemPaperDefinition[] = [
  {
    id: "SYSTEM-001",
    slug: "system-001",
    navTitle: "Architecture",
    filename: "SYSTEM-001-life-mirror-architecture.mdx",
    summary: "定义 Life Mirror 从人生信号到理解、映照与成长的总体系统架构。",
  },
  {
    id: "SYSTEM-002",
    slug: "system-002",
    navTitle: "Acquisition Pipeline",
    filename: "SYSTEM-002-mirror-acquisition-intelligence-pipeline.mdx",
    summary: "定义多源人生信号如何被采集、理解、结构化并进入长期镜像。",
  },
  {
    id: "SYSTEM-003",
    slug: "system-003",
    navTitle: "Data Model",
    filename: "SYSTEM-003-mirror-data-model-v2.mdx",
    summary: "定义 Memory、Mirror Graph 与 Mirror DNA 的统一数据结构和演化关系。",
  },
  {
    id: "SYSTEM-004",
    slug: "system-004",
    navTitle: "Runtime",
    filename: "SYSTEM-004-mirror-runtime-architecture-v2.mdx",
    summary: "定义个人 AI 如何通过上下文、记忆、工具、推理与学习持续运行。",
  },
  {
    id: "SYSTEM-005",
    slug: "system-005",
    navTitle: "Knowledge",
    filename: "SYSTEM-005-mirror-knowledge-architecture.mdx",
    summary: "定义通用知识、领域知识与个人语境如何被组织、检索、验证与更新。",
  },
  {
    id: "SYSTEM-006",
    slug: "system-006",
    navTitle: "Evaluation & Trust",
    filename: "SYSTEM-006-mirror-evaluation-trust.mdx",
    summary: "定义理解质量、证据、置信度、安全边界与长期可信度的评估体系。",
  },
  {
    id: "SYSTEM-007",
    slug: "system-007",
    navTitle: "Privacy",
    filename: "SYSTEM-007-mirror-privacy-ownership.mdx",
    summary: "定义个人镜像的所有权、授权、隔离、可撤回与可迁移原则。",
  },
];
