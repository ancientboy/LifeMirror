import type { Metadata } from "next";
import Link from "next/link";
import { InstituteShell } from "@/components/site/InstituteShell";
import { getDataPapers } from "@/lib/data";
import { getTheoryPapers } from "@/lib/theory";

export const metadata: Metadata = {
  title: "Data Architecture — Life Mirror Institute",
  description: "Data Architecture explains how Life Mirror stores, processes, protects, and governs personal mirror data.",
};

const principles = [
  { number: "01", title: "Store", copy: "Organize personal signals, memories, patterns, and context into a durable mirror model." },
  { number: "02", title: "Process", copy: "Transform human experience into structured data while preserving provenance and meaning." },
  { number: "03", title: "Protect", copy: "Apply privacy, consent, access control, and security throughout the data lifecycle." },
  { number: "04", title: "Own", copy: "Keep personal mirror data governed by the person it represents." },
];

export default function DataOverviewPage() {
  const theoryPapers = getTheoryPapers();
  const dataPapers = getDataPapers();

  return (
    <InstituteShell papers={theoryPapers} activeResearchLayer="data">
      <main className="system-overview-page data-overview-page">
        <header className="system-overview-header data-overview-header">
          <Link href="/knowledge/">KNOWLEDGE ARCHITECTURE ↗</Link>
          <p>LIFE MIRROR INSTITUTE · DATA ARCHITECTURE</p>
          <h1>Personal Mirror<br /><span>Data Architecture</span></h1>
          <h2>个人镜像数据架构</h2>
          <p className="system-overview-intro">Knowledge defines what AI uses to understand humans.<br />Data defines how personal mirror data is stored and protected.</p>
          <div><span>01 DATA PAPER</span><i /><span>PERSONAL DATA GOVERNANCE</span><i /><span>PRIVACY BY DESIGN</span></div>
        </header>

        <section className="data-principles" aria-labelledby="data-principles-title">
          <header><span>DATA LIFECYCLE</span><h2 id="data-principles-title">Store, process, protect, own.</h2></header>
          <div className="data-principle-grid">
            {principles.map((principle) => (
              <article key={principle.number}><span>{principle.number}</span><h3>{principle.title}</h3><p>{principle.copy}</p></article>
            ))}
          </div>
        </section>

        <section className="system-paper-archive data-paper-archive" aria-labelledby="data-papers-title">
          <header><span>DATA RESEARCH ARCHIVE</span><h2 id="data-papers-title">Data Architecture Papers</h2></header>
          <div className="system-paper-grid">
            {dataPapers.map((paper) => (
              <Link className="system-paper-card data-paper-card" href={`/data/${paper.slug}/`} key={paper.id}>
                <div><span>{paper.category}</span><em>{paper.status.toUpperCase()}</em></div>
                <b>{paper.id}</b><h2>{paper.title}</h2><h3>{paper.subtitle}</h3><p>{paper.summary}</p><small>READ DATA PAPER →</small>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </InstituteShell>
  );
}
