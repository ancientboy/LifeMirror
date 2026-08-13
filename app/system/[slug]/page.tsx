import type { Metadata } from "next";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { InstituteShell } from "@/components/site/InstituteShell";
import { getMdxComponents } from "@/components/mdx-components";
import { getSystemDocument, getSystemPapers } from "@/lib/system";
import { getTheoryPapers } from "@/lib/theory";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getSystemPapers().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getSystemDocument(slug);
  if (!document) return {};
  return {
    title: `${document.id} · ${document.title} — Life Mirror Institute`,
    description: document.summary,
  };
}

export default async function SystemPaperPage({ params }: PageProps) {
  const { slug } = await params;
  const theoryPapers = getTheoryPapers();
  const systemPapers = getSystemPapers();
  const document = getSystemDocument(slug);
  if (!document) notFound();

  const currentIndex = systemPapers.findIndex((paper) => paper.slug === document.slug);
  const previous = currentIndex > 0 ? systemPapers[currentIndex - 1] : undefined;
  const next = currentIndex < systemPapers.length - 1 ? systemPapers[currentIndex + 1] : undefined;

  return (
    <InstituteShell papers={theoryPapers} activeSystemId={document.id} activeResearchLayer="system">
      <article className="theory-page system-paper-page">
        <header className="theory-page-header system-paper-header">
          <Link className="paper-back" href="/system/"><ArrowLeft />返回系统目录</Link>
          <div className="paper-status"><span>SYSTEM ARCHITECTURE</span><i /><span>{document.status === "planned" ? "IN EVOLUTION" : "PUBLISHED"}</span></div>
          <p>{document.id} · SYSTEM PAPER</p>
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

        <nav className="paper-pagination" aria-label="上一篇与下一篇系统架构论文">
          {previous ? <Link href={`/system/${previous.slug}/`}><small>PREVIOUS SYSTEM</small><span>{previous.id}</span><strong>{previous.title}</strong></Link> : <span />}
          {next ? <Link href={`/system/${next.slug}/`}><small>NEXT SYSTEM</small><span>{next.id}</span><strong>{next.title}</strong></Link> : <span />}
        </nav>
      </article>
    </InstituteShell>
  );
}
