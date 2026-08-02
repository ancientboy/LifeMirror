export type KnowledgePaperDefinition = {
  id: string;
  slug: string;
  navTitle: string;
  filename: string;
  summary: string;
};

export const knowledgePaperDefinitions: KnowledgePaperDefinition[] = [
  {
    id: "KNOWLEDGE-001",
    slug: "human-understanding-knowledge-pack",
    navTitle: "Human Understanding Knowledge Pack",
    filename: "KNOWLEDGE-001-human-understanding-knowledge-pack.mdx",
    summary: "定义 Life Mirror 如何组织、结构化和调用用于理解人类的知识体系。",
  },
  {
    id: "KNOWLEDGE-003",
    slug: "liuyao-knowledge-pack-specification",
    navTitle: "Liuyao Knowledge Pack",
    filename: "KNOWLEDGE-003-liuyao-knowledge-pack-specification.mdx",
    summary: "定义六爻经典文本、传统规则含义与确定性工具输出之间的知识边界。",
  },
  {
    id: "KNOWLEDGE-004",
    slug: "liuyao-reflection-mapping",
    navTitle: "Liuyao Reflection Mapping",
    filename: "KNOWLEDGE-004-liuyao-reflection-mapping.mdx",
    summary: "把有证据支持的传统概念映射为人类处境与反思问题，不参与起卦或断卦计算。",
  },
];
