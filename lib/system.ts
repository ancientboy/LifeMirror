import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { systemPaperDefinitions, type SystemPaperDefinition } from "@/lib/system-catalog";

export { systemPaperDefinitions } from "@/lib/system-catalog";

export type SystemStatus = "published" | "planned";

export type SystemMeta = SystemPaperDefinition & {
  title: string;
  subtitle: string;
  version: string;
  date: string;
  category: string;
  status: SystemStatus;
};

export type SystemDocument = SystemMeta & {
  content: string;
};

const systemDirectory = path.join(process.cwd(), "system");

function readSystemDocument(definition: SystemPaperDefinition): SystemDocument {
  const raw = fs.readFileSync(path.join(systemDirectory, definition.filename), "utf8");
  const { data, content } = matter(raw);

  return {
    ...definition,
    title: String(data.title ?? definition.navTitle),
    subtitle: String(data.subtitle ?? ""),
    version: String(data.version ?? "1.0"),
    date: String(data.date ?? "August 2026"),
    category: String(data.category ?? "SYSTEM ARCHITECTURE"),
    status: data.status === "planned" ? "planned" : "published",
    summary: String(data.summary ?? definition.summary),
    content,
  };
}

export function getSystemDocuments(): SystemDocument[] {
  return systemPaperDefinitions.map(readSystemDocument);
}

export function getSystemPapers(): SystemMeta[] {
  return getSystemDocuments().map(({ content: _content, ...meta }) => meta);
}

export function getSystemDocument(slug: string): SystemDocument | undefined {
  const definition = systemPaperDefinitions.find((paper) => paper.slug === slug.toLowerCase());
  return definition ? readSystemDocument(definition) : undefined;
}
