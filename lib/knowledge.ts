import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { knowledgePaperDefinitions, type KnowledgePaperDefinition } from "@/lib/knowledge-catalog";

export type KnowledgeStatus = "published" | "planned";

export type KnowledgeMeta = KnowledgePaperDefinition & {
  title: string;
  subtitle: string;
  version: string;
  date: string;
  category: string;
  status: KnowledgeStatus;
};

export type KnowledgeDocument = KnowledgeMeta & { content: string };

const knowledgeDirectory = path.join(process.cwd(), "knowledge");

function readKnowledgeDocument(definition: KnowledgePaperDefinition): KnowledgeDocument {
  const raw = fs.readFileSync(path.join(knowledgeDirectory, definition.filename), "utf8");
  const { data, content } = matter(raw);

  return {
    ...definition,
    title: String(data.title ?? definition.navTitle),
    subtitle: String(data.subtitle ?? ""),
    version: String(data.version ?? "1.0"),
    date: String(data.date ?? "August 2026"),
    category: String(data.category ?? "KNOWLEDGE"),
    status: data.status === "planned" ? "planned" : "published",
    summary: String(data.summary ?? definition.summary),
    content,
  };
}

export function getKnowledgeDocuments(): KnowledgeDocument[] {
  return knowledgePaperDefinitions.map(readKnowledgeDocument);
}

export function getKnowledgePapers(): KnowledgeMeta[] {
  return getKnowledgeDocuments().map(({ content: _content, ...meta }) => meta);
}

export function getKnowledgeDocument(slug: string): KnowledgeDocument | undefined {
  const definition = knowledgePaperDefinitions.find((paper) => paper.slug === slug.toLowerCase());
  return definition ? readKnowledgeDocument(definition) : undefined;
}
