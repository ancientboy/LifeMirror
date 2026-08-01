"use client";

import { Aperture, CalendarBlank, CaretDoubleLeft, GlobeHemisphereWest, MoonStars, Sun } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import type { TheoryMeta } from "@/lib/theory";
import { theoryParts, type TheoryPartSlug } from "@/lib/theory-parts";
import { systemPaperDefinitions } from "@/lib/system-catalog";
import { knowledgePaperDefinitions } from "@/lib/knowledge-catalog";
import { dataPaperDefinitions } from "@/lib/data-catalog";

type InstituteShellProps = {
  papers: TheoryMeta[];
  activeSlug?: string;
  activePart?: TheoryPartSlug;
  activeSystemId?: string;
  activeKnowledgeId?: string;
  activeDataId?: string;
  activeResearchLayer?: "theory" | "system" | "knowledge" | "data";
  children: ReactNode;
};

export function InstituteShell({ papers, activeSlug, activePart, activeSystemId, activeKnowledgeId, activeDataId, activeResearchLayer = "theory", children }: InstituteShellProps) {
  const [reducedGlow, setReducedGlow] = useState(false);
  const researchPapers = papers.filter((paper) => paper.slug !== "manifesto");

  return (
    <main className={`site-shell${reducedGlow ? " reduced-glow" : ""}`}>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Life Mirror Institute 首页">
          <span className="brand-mark"><Aperture weight="thin" /></span>
          <span className="brand-name">LIFE MIRROR<br />INSTITUTE</span>
          <small>RESEARCHING HUMAN UNDERSTANDING</small>
        </Link>

        <nav aria-label="Life Mirror 研究目录">
          <p className="research-nav-heading">RESEARCH</p>
          <section className="research-nav-layer" aria-label="Theory Papers">
          <Link className={`theory-nav-title${activeResearchLayer === "theory" ? " selected" : ""}`} href="/theory/">
            <Aperture weight="thin" />
              <span><b>LIFE MIRROR THEORY</b><small>LM-001—LM-010</small></span>
          </Link>
          {theoryParts.map((part) => (
            <div className="nav-part" key={part.slug}>
              <Link className={`nav-group${activePart === part.slug ? " selected" : ""}`} href={`/theory/${part.slug}/`}>
                PART {part.number} · {part.label}
              </Link>
              {researchPapers.filter((paper) => part.paperIds.includes(paper.id)).map((paper) => (
                <div className="nav-unit" key={paper.slug}>
                  <Link
                    href={`/theory/${paper.slug}/`}
                    className={`${paper.status} ${activeSlug === paper.slug ? "selected" : ""}`}
                    aria-current={activeSlug === paper.slug ? "page" : undefined}
                  >
                    <span className="timeline-dot" />
                    <span className="paper-copy">
                      <b>{paper.id}</b>
                      <strong>{paper.title}</strong>
                      <small>{paper.subtitle}</small>
                    </span>
                    <i />
                  </Link>
                </div>
              ))}
            </div>
          ))}
          </section>

          <section className="research-nav-layer system-nav-layer" aria-label="System Architecture Papers">
            <Link className={`theory-nav-title system-nav-title${activeResearchLayer === "system" ? " selected" : ""}`} href="/system/">
              <Aperture weight="thin" />
              <span><b>SYSTEM ARCHITECTURE</b><small>SYSTEM-001—SYSTEM-007</small></span>
            </Link>
            <div className="system-nav-papers">
              {systemPaperDefinitions.map((paper) => (
                <Link
                  href={`/system/${paper.slug}/`}
                  className={activeSystemId === paper.id ? "selected" : ""}
                  aria-current={activeSystemId === paper.id ? "page" : undefined}
                  key={paper.id}
                >
                  <span className="timeline-dot" />
                  <span><b>{paper.id}</b><strong>{paper.navTitle}</strong></span>
                  <i />
                </Link>
              ))}
            </div>
          </section>

          <section className="research-nav-layer knowledge-nav-layer" aria-label="Knowledge Papers">
            <Link className={`theory-nav-title knowledge-nav-title${activeResearchLayer === "knowledge" ? " selected" : ""}`} href="/knowledge/">
              <Aperture weight="thin" />
              <span><b>KNOWLEDGE</b><small>HUMAN UNDERSTANDING LAYER</small></span>
            </Link>
            <div className="system-nav-papers knowledge-nav-papers">
              {knowledgePaperDefinitions.map((paper) => (
                <Link
                  href={`/knowledge/${paper.slug}/`}
                  className={activeKnowledgeId === paper.id ? "selected" : ""}
                  aria-current={activeKnowledgeId === paper.id ? "page" : undefined}
                  key={paper.id}
                >
                  <span className="timeline-dot" />
                  <span><b>{paper.id}</b><strong>{paper.navTitle}</strong></span>
                  <i />
                </Link>
              ))}
            </div>
          </section>

          <section className="research-nav-layer data-nav-layer" aria-label="Data Architecture Papers">
            <Link className={`theory-nav-title data-nav-title${activeResearchLayer === "data" ? " selected" : ""}`} href="/data/">
              <Aperture weight="thin" />
              <span><b>DATA ARCHITECTURE</b><small>PERSONAL MIRROR DATA LAYER</small></span>
            </Link>
            <div className="system-nav-papers data-nav-papers">
              {dataPaperDefinitions.map((paper) => (
                <Link
                  href={`/data/${paper.slug}/`}
                  className={activeDataId === paper.id ? "selected" : ""}
                  aria-current={activeDataId === paper.id ? "page" : undefined}
                  key={paper.id}
                >
                  <span className="timeline-dot" />
                  <span><b>{paper.id}</b><strong>{paper.navTitle}</strong></span>
                  <i />
                </Link>
              ))}
            </div>
          </section>
        </nav>

        <footer className="sidebar-footer">
          <button aria-label="调整光感" onClick={() => setReducedGlow((value) => !value)}>
            <Sun weight="thin" /><span><i /></span><MoonStars weight="fill" />
          </button>
          <span><GlobeHemisphereWest weight="thin" /> EN</span>
          <CaretDoubleLeft weight="thin" />
        </footer>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <span><CalendarBlank weight="thin" /> August 2026</span>
          <i />
          <span>Institute Research Platform</span>
          <i />
          <span>Life Mirror Institute</span>
        </header>
        {children}
      </section>
    </main>
  );
}
