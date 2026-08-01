import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type TheoryStatus = "published" | "planned";

export type TheoryMeta = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  version: string;
  date: string;
  category: string;
  part: string;
  order: number;
  status: TheoryStatus;
  summary: string;
};

export type TheoryDocument = TheoryMeta & {
  content: string;
  filename: string;
};

const theoryDirectory = path.join(process.cwd(), "theory");

function readDocument(filename: string): TheoryDocument {
  const raw = fs.readFileSync(path.join(theoryDirectory, filename), "utf8");
  const { data, content } = matter(raw);
  const fallbackSlug = filename.replace(/\.mdx$/, "").toLowerCase();

  return {
    id: String(data.id ?? fallbackSlug).toUpperCase(),
    slug: String(data.slug ?? fallbackSlug).toLowerCase(),
    title: String(data.title ?? data.id ?? fallbackSlug),
    subtitle: String(data.subtitle ?? ""),
    version: String(data.version ?? "0.1"),
    date: String(data.date ?? "August 2026"),
    category: String(data.category ?? "Theory"),
    part: String(data.part ?? "THEORY"),
    order: Number(data.order ?? 999),
    status: data.status === "planned" ? "planned" : "published",
    summary: String(data.summary ?? ""),
    content,
    filename,
  };
}

export function getTheoryDocuments(): TheoryDocument[] {
  return fs
    .readdirSync(theoryDirectory)
    .filter((filename) => filename.endsWith(".mdx"))
    .map(readDocument)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function getTheoryPapers(): TheoryMeta[] {
  return getTheoryDocuments().map(({ content: _content, filename: _filename, ...meta }) => meta);
}

export function getTheoryDocument(slug: string): TheoryDocument | undefined {
  return getTheoryDocuments().find((document) => document.slug === slug.toLowerCase());
}
