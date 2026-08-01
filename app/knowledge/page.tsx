import type { Metadata } from "next";
import Link from "next/link";
import { InstituteShell } from "@/components/site/InstituteShell";
import { getKnowledgePapers } from "@/lib/knowledge";
import { getTheoryPapers } from "@/lib/theory";

export const metadata: Metadata = {
  title: "Knowledge Layer — Life Mirror Institute",
  description: "Knowledge defines what Life Mirror uses to understand humans: human science, personality, symbolic, life-domain, and Life Mirror native knowledge.",
};

const categories = [
  { number: "01", title: "Human Science Knowledge", copy: "Psychology, behavioral science, relationship science, and motivation theory." },
  { number: "02", title: "Personality Models", copy: "Multiple personality frameworks used as perspectives, never as fixed identities." },
  { number: "03", title: "Symbolic Knowledge", copy: "Cultural and symbolic systems used for reflection, not deterministic prediction." },
  { number: "04", title: "Life Domain Knowledge", copy: "Career, entrepreneurship, learning, leadership, relationships, and lifestyle." },
  { number: "05", title: "Life Mirror Native Knowledge", copy: "Mirror DNA, Mirror Graph, Mirror Engine, and Mirror Experience." },
];

export default function KnowledgeOverviewPage() {
  const theoryPapers = getTheoryPapers();
  const knowledgePapers = getKnowledgePapers();

  return (
    <InstituteShell papers={theoryPapers} activeResearchLayer="knowledge">
      <main className="system-overview-page knowledge-overview-page">
        <header className="system-overview-header knowledge-overview-header">
          <Link href="/system/">SYSTEM ARCHITECTURE ↗</Link>
          <p>LIFE MIRROR INSTITUTE · KNOWLEDGE LAYER</p>
          <h1>Human Understanding<br /><span>Knowledge</span></h1>
          <h2>人类理解知识层</h2>
          <p className="system-overview-intro">System defines how Life Mirror works. Knowledge defines what knowledge Life Mirror uses to understand humans.</p>
          <div><span>01 KNOWLEDGE PACK</span><i /><span>FIVE KNOWLEDGE DOMAINS</span><i /><span>SEPARATE FROM PERSONAL DATA</span></div>
        </header>

        <section className="knowledge-boundary" aria-labelledby="knowledge-boundary-title">
          <header>
            <p>KNOWLEDGE BOUNDARY</p>
            <h2 id="knowledge-boundary-title">Knowledge is not<br />Personal Mirror Data.</h2>
          </header>
          <div>
            <p>Knowledge Layer contains reusable frameworks and verified concepts used to interpret human experience.</p>
            <p>Personal Mirror Data contains a specific person&apos;s signals, memories, patterns, and consent-governed context. It does not belong in this archive.</p>
          </div>
        </section>

        <section className="knowledge-categories" aria-labelledby="knowledge-categories-title">
          <header><span>HUMAN UNDERSTANDING DOMAINS</span><h2 id="knowledge-categories-title">Five knowledge families</h2></header>
          <div className="knowledge-category-grid">
            {categories.map((category) => (
              <article key={category.number}>
                <span>{category.number}</span><h3>{category.title}</h3><p>{category.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="system-paper-archive knowledge-paper-archive" aria-labelledby="knowledge-papers-title">
          <header><span>KNOWLEDGE RESEARCH ARCHIVE</span><h2 id="knowledge-papers-title">Knowledge Packs</h2></header>
          <div className="system-paper-grid">
            {knowledgePapers.map((paper) => (
              <Link className="system-paper-card knowledge-paper-card" href={`/knowledge/${paper.slug}/`} key={paper.id}>
                <div><span>{paper.category}</span><em>{paper.status.toUpperCase()}</em></div>
                <b>{paper.id}</b><h2>{paper.title}</h2><h3>{paper.subtitle}</h3><p>{paper.summary}</p><small>READ KNOWLEDGE PAPER →</small>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </InstituteShell>
  );
}
