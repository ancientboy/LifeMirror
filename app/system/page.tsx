import type { Metadata } from "next";
import Link from "next/link";
import { InstituteShell } from "@/components/site/InstituteShell";
import { SystemPaperGrid } from "@/components/site/SystemPaperGrid";
import { getSystemPapers } from "@/lib/system";
import { getTheoryPapers } from "@/lib/theory";

export const metadata: Metadata = {
  title: "Life Mirror System Architecture — Life Mirror Institute",
  description: "Life Mirror SYSTEM-001～SYSTEM-007：从总体架构、采集、数据模型与运行时，到知识、评估信任和隐私所有权。",
};

export default function SystemOverviewPage() {
  const theoryPapers = getTheoryPapers();
  const systemPapers = getSystemPapers();

  return (
    <InstituteShell papers={theoryPapers} activeResearchLayer="system">
      <main className="system-overview-page">
        <header className="system-overview-header">
          <Link href="/theory/">LIFE MIRROR THEORY ↗</Link>
          <p>LIFE MIRROR INSTITUTE · SYSTEM ARCHITECTURE</p>
          <h1>Life Mirror<br /><span>System Architecture</span></h1>
          <h2>人生镜像系统架构论文</h2>
          <p className="system-overview-intro">Theory explains why Life Mirror exists.<br />System explains how Life Mirror works.</p>
          <div><span>07 SYSTEM PAPERS</span><i /><span>ONE HUMAN UNDERSTANDING SYSTEM</span><i /><span>V1.0</span></div>
        </header>

        <section className="system-architecture-map" aria-labelledby="system-map-title">
          <header>
            <p>ARCHITECTURE SEQUENCE</p>
            <h2 id="system-map-title">From signals<br />to a trusted mirror.</h2>
            <span>七层系统从总体边界出发，依次定义采集、建模、运行、知识、信任与所有权。</span>
          </header>
          <div className="system-flow" aria-label="System Architecture 七层流程">
            {systemPapers.map((paper, index) => (
              <Link href={`/system/${paper.slug}/`} key={paper.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{paper.id}</b>
                <strong>{paper.navTitle}</strong>
                <small>{paper.subtitle}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="system-paper-archive" aria-labelledby="system-papers-title">
          <header>
            <span>SYSTEM RESEARCH ARCHIVE</span>
            <h2 id="system-papers-title">System Architecture Papers</h2>
          </header>
          <SystemPaperGrid papers={systemPapers} />
        </section>
      </main>
    </InstituteShell>
  );
}
