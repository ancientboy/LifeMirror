import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { InstituteShell } from "@/components/site/InstituteShell";
import { getMdxComponents } from "@/components/mdx-components";
import { getTheoryDocument, getTheoryPapers } from "@/lib/theory";
import { getTheoryPart } from "@/lib/theory-parts";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getTheoryPapers().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getTheoryDocument(slug);
  if (!document) return {};
  return {
    title: `${document.id} · ${document.title} — Life Mirror Institute`,
    description: document.summary,
  };
}

export default async function TheoryPage({ params }: PageProps) {
  const { slug } = await params;
  const papers = getTheoryPapers();
  const document = getTheoryDocument(slug);
  if (!document) notFound();

  const currentIndex = papers.findIndex((paper) => paper.slug === document.slug);
  const previous = currentIndex > 0 ? papers[currentIndex - 1] : undefined;
  const next = currentIndex < papers.length - 1 ? papers[currentIndex + 1] : undefined;

  return (
    <InstituteShell papers={papers} activeSlug={document.slug} activePart={getTheoryPart(document.category)?.slug}>
      <article className="theory-page">
        <header className="theory-page-header">
          <div className="paper-status"><span>{document.part}</span><i /> <span>{document.status === "planned" ? "IN EVOLUTION" : "PUBLISHED"}</span></div>
          <p>{document.id} · RESEARCH PAPER</p>
          <h1>{document.title}</h1>
          <h2>{document.subtitle}</h2>
          <div className="theory-meta">
            <span>VERSION {document.version}</span><span>{document.date}</span><span>{document.category}</span>
          </div>
          <p className="theory-summary">{document.summary}</p>
        </header>

        <div className="theory-page-body mdx-content">
          <MDXRemote
            source={document.content}
            components={getMdxComponents(document.content)}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </div>

        <nav className="paper-pagination" aria-label="上一篇与下一篇研究论文">
          {previous ? <Link href={`/theory/${previous.slug}/`}><small>PREVIOUS</small><span>{previous.id}</span><strong>{previous.title}</strong></Link> : <span />}
          {next ? <Link href={`/theory/${next.slug}/`}><small>NEXT</small><span>{next.id}</span><strong>{next.title}</strong></Link> : <span />}
        </nav>
      </article>
    </InstituteShell>
  );
}
