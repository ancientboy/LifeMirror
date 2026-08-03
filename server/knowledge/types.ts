export const KNOWLEDGE_EVIDENCE_LEVELS = ["empirical", "clinical", "cultural", "experiential", "mixed"] as const;

export type KnowledgeEvidenceLevel = (typeof KNOWLEDGE_EVIDENCE_LEVELS)[number];
export type KnowledgePackStatus = "active" | "disabled";

export type KnowledgeSource = {
  id: string;
  title: string;
  kind: "paper" | "book" | "standard" | "tradition" | "dataset" | "internal";
  citation: string;
  url?: string;
  retrievedAt?: string;
};

export type KnowledgeScope = {
  domains: string[];
  intents: string[];
  locales: string[];
  excludes: string[];
};

export type KnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  domains: string[];
  intents: string[];
  evidence: KnowledgeEvidenceLevel;
  confidence: number;
  sourceIds: string[];
  safetyBoundary: string;
  claims?: Array<{ key: string; value: string }>;
};

export type KnowledgePack = {
  id: string;
  version: string;
  name: string;
  description: string;
  status: KnowledgePackStatus;
  scope: KnowledgeScope;
  sources: KnowledgeSource[];
  entries: KnowledgeEntry[];
};

export type KnowledgeQuery = {
  text: string;
  domains?: string[];
  intent?: string;
  locale?: string;
  packIds?: string[];
  minimumConfidence?: number;
  limit?: number;
};

export type KnowledgeTrace = {
  packId: string;
  packVersion: string;
  entryId: string;
  sourceIds: string[];
};

export type KnowledgeMatch = {
  entry: KnowledgeEntry;
  pack: Pick<KnowledgePack, "id" | "version" | "name">;
  applicability: number;
  matchedBy: string[];
  sources: KnowledgeSource[];
  trace: KnowledgeTrace;
};

export type KnowledgeConflict = {
  key: string;
  values: Array<{ value: string; trace: KnowledgeTrace }>;
};

export type KnowledgeRetrievalResult = {
  matches: KnowledgeMatch[];
  conflicts: KnowledgeConflict[];
};
