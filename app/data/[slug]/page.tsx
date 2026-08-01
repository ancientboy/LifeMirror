import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { InstituteShell } from "@/components/site/InstituteShell";
import { getMdxComponents } from "@/components/mdx-components";
import { getDataDocument, getDataPapers } from "@/lib/data";
import { getTheoryPapers } from "@/lib/theory";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getDataPapers().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getDataDocument(slug);
  if (!document) return {};
  return { title: `${document.id} · ${document.title} — Life Mirror Institute`, description: document.summary };
}

export default async function DataPaperPage({ params }: PageProps) {
  const { slug } = await params;
  const theoryPapers = getTheoryPapers();
  const document = getDataDocument(slug);
  if (!document) notFound();

  return (
    <InstituteShell papers={theoryPapers} activeDataId={document.id} activeResearchLayer="data">
      <article className="theory-page data-paper-page">
        <header className="theory-page-header data-paper-header">
          <div className="paper-status"><span>DATA ARCHITECTURE</span><i /><span>{document.status === "planned" ? "IN EVOLUTION" : "PUBLISHED"}</span></div>
          <p>{document.id} · DATA PAPER</p>
          <h1>{document.title}</h1><h2>{document.subtitle}</h2>
          <div className="theory-meta"><span>VERSION {document.version}</span><span>{document.date}</span><span>{document.category}</span></div>
          <p className="theory-summary">{document.summary}</p>
        </header>
        <div className="theory-page-body mdx-content">
          <MDXRemote source={document.content} components={getMdxComponents(document.content)} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </div>
        <nav className="paper-pagination" aria-label="Data Architecture navigation">
          <Link href="/data/"><small>DATA ARCHITECTURE</small><span>OVERVIEW</span><strong>Personal Mirror Data</strong></Link><span />
        </nav>
      </article>
    </InstituteShell>
  );
}
