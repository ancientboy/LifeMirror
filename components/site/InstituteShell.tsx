"use client";

import { Aperture, CalendarBlank, CaretDoubleLeft, GlobeHemisphereWest, MoonStars, Sun } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import type { TheoryMeta } from "@/lib/theory";
import { theoryParts, type TheoryPartSlug } from "@/lib/theory-parts";

type InstituteShellProps = {
  papers: TheoryMeta[];
  activeSlug?: string;
  activePart?: TheoryPartSlug;
  children: ReactNode;
};

export function InstituteShell({ papers, activeSlug, activePart, children }: InstituteShellProps) {
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

        <nav aria-label="Life Mirror Theory 目录">
          <Link className="theory-nav-title" href="/theory/">
            <Aperture weight="thin" />
            <span><b>LIFE MIRROR THEORY</b><small>THEORY MAP · V1.0</small></span>
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
          <span>Interactive Theory System</span>
          <i />
          <span>Life Mirror Institute</span>
        </header>
        {children}
      </section>
    </main>
  );
}
