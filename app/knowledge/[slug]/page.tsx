import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { InstituteShell } from "@/components/site/InstituteShell";
import { getMdxComponents } from "@/components/mdx-components";
import { getKnowledgeDocument, getKnowledgePapers } from "@/lib/knowledge";
import { getTheoryPapers } from "@/lib/theory";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getKnowledgePapers().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getKnowledgeDocument(slug);
  if (!document) return {};
  return { title: `${document.id} · ${document.title} — Life Mirror Institute`, description: document.summary };
}

export default async function KnowledgePaperPage({ params }: PageProps) {
  const { slug } = await params;
  const theoryPapers = getTheoryPapers();
  const document = getKnowledgeDocument(slug);
  if (!document) notFound();

  return (
    <InstituteShell papers={theoryPapers} activeKnowledgeId={document.id} activeResearchLayer="knowledge">
      <article className="theory-page knowledge-paper-page">
        <header className="theory-page-header knowledge-paper-header">
          <div className="paper-status"><span>KNOWLEDGE LAYER</span><i /><span>{document.status === "planned" ? "IN EVOLUTION" : "PUBLISHED"}</span></div>
          <p>{document.id} · KNOWLEDGE PAPER</p>
          <h1>{document.title}</h1><h2>{document.subtitle}</h2>
          <div className="theory-meta"><span>VERSION {document.version}</span><span>{document.date}</span><span>{document.category}</span></div>
          <p className="theory-summary">{document.summary}</p>
        </header>
        <div className="theory-page-body mdx-content">
          <MDXRemote source={document.content} components={getMdxComponents(document.content)} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </div>
        <nav className="paper-pagination" aria-label="Knowledge Layer navigation">
          <Link href="/knowledge/"><small>KNOWLEDGE LAYER</small><span>OVERVIEW</span><strong>Human Understanding Knowledge</strong></Link><span />
        </nav>
      </article>
    </InstituteShell>
  );
}
