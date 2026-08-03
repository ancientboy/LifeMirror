import { z } from "zod";
import { KNOWLEDGE_EVIDENCE_LEVELS } from "./types.js";

const identifier = z.string().trim().min(1).max(100).regex(/^[a-z0-9][a-z0-9._-]*$/i);
const nonEmptyText = z.string().trim().min(1);

export const knowledgeSourceSchema = z.object({
  id: identifier,
  title: nonEmptyText,
  kind: z.enum(["paper", "book", "standard", "tradition", "dataset", "internal"]),
  citation: nonEmptyText,
  url: z.string().url().optional(),
  retrievedAt: z.string().datetime({ offset: true }).optional(),
});

export const knowledgeEntrySchema = z.object({
  id: identifier,
  title: nonEmptyText,
  content: nonEmptyText,
  keywords: z.array(nonEmptyText).default([]),
  domains: z.array(identifier).min(1),
  intents: z.array(identifier).default([]),
  evidence: z.enum(KNOWLEDGE_EVIDENCE_LEVELS),
  confidence: z.number().min(0).max(1),
  sourceIds: z.array(identifier).min(1),
  safetyBoundary: nonEmptyText,
  claims: z.array(z.object({ key: identifier, value: nonEmptyText })).optional(),
});

export const knowledgePackSchema = z.object({
  id: identifier,
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  name: nonEmptyText,
  description: nonEmptyText,
  status: z.enum(["active", "disabled"]),
  scope: z.object({
    domains: z.array(identifier).min(1),
    intents: z.array(identifier).default([]),
    locales: z.array(nonEmptyText).min(1),
    excludes: z.array(nonEmptyText).default([]),
  }),
  sources: z.array(knowledgeSourceSchema).min(1),
  entries: z.array(knowledgeEntrySchema).min(1),
}).superRefine((pack, context) => {
  const sourceIds = new Set(pack.sources.map((source) => source.id));
  const entryIds = new Set<string>();
  for (const entry of pack.entries) {
    if (entryIds.has(entry.id)) context.addIssue({ code: "custom", path: ["entries"], message: `Duplicate entry id: ${entry.id}` });
    entryIds.add(entry.id);
    for (const sourceId of entry.sourceIds) {
      if (!sourceIds.has(sourceId)) context.addIssue({ code: "custom", path: ["entries", entry.id, "sourceIds"], message: `Unknown source id: ${sourceId}` });
    }
    for (const domain of entry.domains) {
      if (!pack.scope.domains.includes(domain)) context.addIssue({ code: "custom", path: ["entries", entry.id, "domains"], message: `Domain outside pack scope: ${domain}` });
    }
  }
});
