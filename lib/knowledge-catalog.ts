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
];
