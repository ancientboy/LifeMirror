import type { Metadata } from "next";
import Link from "next/link";
import { InstituteShell } from "@/components/site/InstituteShell";
import { getTheoryPapers } from "@/lib/theory";
import { theoryParts } from "@/lib/theory-parts";

export const metadata: Metadata = {
  title: "Life Mirror Theory Map — Life Mirror Institute",
  description: "Life Mirror Theory v1.0 的五部分研究地图：WHY、WHAT、HOW、APPLICATION 与 FUTURE。",
};

const componentSystem = [
  { name: "HumanMirrorFramework", paper: "LM-002", status: "LIVE" },
  { name: "PrincipleCards", paper: "LM-003", status: "LIVE" },
  { name: "MirrorDNA", paper: "LM-004", status: "LIVE" },
  { name: "MirrorGraph", paper: "LM-005", status: "LIVE" },
  { name: "MirrorEngine", paper: "LM-006", status: "LIVE" },
  { name: "MirrorExperienceFramework", paper: "LM-007", status: "LIVE" },
  { name: "MirrorEconomyModel", paper: "LM-009", status: "LIVE" },
  { name: "HumanUnderstandingFuture", paper: "LM-010", status: "LIVE" },
];

export default function TheoryMapPage() {
  const papers = getTheoryPapers();
  const researchPapers = papers.filter((paper) => paper.slug !== "manifesto");

  return (
    <InstituteShell papers={papers}>
      <main className="theory-map-page">
        <header className="theory-map-header">
          <p>LIFE MIRROR INSTITUTE · THEORY V1.0</p>
          <h1>Life Mirror<br /><span>Theory Map</span></h1>
          <h2>人生镜像理论地图</h2>
          <p className="theory-map-intro">从“为什么需要理解人”，到“人类理解的未来”。五个研究阶段共同构成一套持续演化的交互式理论系统。</p>
          <div><span>05 PARTS</span><i /><span>10 RESEARCH PAPERS</span><i /><span>INTERACTIVE THEORY SYSTEM</span></div>
        </header>

        <section className="theory-map" aria-label="Life Mirror Theory 五阶段地图">
          {theoryParts.map((part, index) => {
            const partPapers = researchPapers.filter((paper) => part.paperIds.includes(paper.id));
            return (
              <article className="theory-map-stage" key={part.slug}>
                <div className="theory-map-axis"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
                <div className="theory-map-stage-copy">
                  <p>PART {part.number}</p>
                  <h2>{part.label}</h2>
                  <h3>{part.subtitle}</h3>
                  <p>{part.description}</p>
                  <Link href={`/theory/${part.slug}/`}>EXPLORE {part.label} →</Link>
                </div>
                <ol>
                  {partPapers.map((paper) => (
                    <li key={paper.slug}>
                      <Link href={`/theory/${paper.slug}/`}>
                        <span>{paper.id}</span><strong>{paper.title}</strong><small>{paper.subtitle}</small>
                      </Link>
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </section>

        <section className="component-system" aria-labelledby="component-system-title">
          <header>
            <p>THEORY COMPONENT SYSTEM</p>
            <h2 id="component-system-title">理论不只是文章，<br />也是可以被看见的结构。</h2>
            <span>MDX 与 React Components 共同承载模型、图谱、时间关系与交互展示。</span>
          </header>
          <div className="component-system-grid">
            {componentSystem.map((component) => (
              <div key={component.name}>
                <span>{component.status}</span>
                <strong>{component.name}</strong>
                <small>{component.paper}</small>
              </div>
            ))}
          </div>
        </section>
      </main>
    </InstituteShell>
  );
}
