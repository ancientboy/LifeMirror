import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { dataPaperDefinitions, type DataPaperDefinition } from "@/lib/data-catalog";

export type DataStatus = "published" | "planned";

export type DataMeta = DataPaperDefinition & {
  title: string;
  subtitle: string;
  version: string;
  date: string;
  category: string;
  status: DataStatus;
};

export type DataDocument = DataMeta & { content: string };

const dataDirectory = path.join(process.cwd(), "data");

function readDataDocument(definition: DataPaperDefinition): DataDocument {
  const raw = fs.readFileSync(path.join(dataDirectory, definition.filename), "utf8");
  const { data, content } = matter(raw);

  return {
    ...definition,
    title: String(data.title ?? definition.navTitle),
    subtitle: String(data.subtitle ?? ""),
    version: String(data.version ?? "1.0"),
    date: String(data.date ?? "August 2026"),
    category: String(data.category ?? "DATA ARCHITECTURE"),
    status: data.status === "planned" ? "planned" : "published",
    summary: String(data.summary ?? definition.summary),
    content,
  };
}

export function getDataDocuments(): DataDocument[] {
  return dataPaperDefinitions.map(readDataDocument);
}

export function getDataPapers(): DataMeta[] {
  return getDataDocuments().map(({ content: _content, ...meta }) => meta);
}

export function getDataDocument(slug: string): DataDocument | undefined {
  const definition = dataPaperDefinitions.find((paper) => paper.slug === slug.toLowerCase());
  return definition ? readDataDocument(definition) : undefined;
}
