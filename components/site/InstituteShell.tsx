"use client";

import {
  Aperture,
  CalendarBlank,
  CaretDoubleLeft,
  GlobeHemisphereWest,
  MoonStars,
  Sun,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import type { TheoryMeta } from "@/lib/theory";

type InstituteShellProps = {
  papers: TheoryMeta[];
  activeSlug?: string;
  children: ReactNode;
};

export function InstituteShell({ papers, activeSlug, children }: InstituteShellProps) {
  const [reducedGlow, setReducedGlow] = useState(false);
  let lastPart = "";

  return (
    <main className={`site-shell${reducedGlow ? " reduced-glow" : ""}`}>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Life Mirror Institute 首页">
          <span className="brand-mark"><Aperture weight="thin" /></span>
          <span className="brand-name">LIFE MIRROR<br />INSTITUTE</span>
          <small>RESEARCHING HUMAN UNDERSTANDING</small>
        </Link>

        <nav aria-label="LM Research Paper 目录">
          {papers.map((paper, index) => {
            const showPart = paper.part !== lastPart && paper.part !== "MANIFESTO";
            lastPart = paper.part;
            return (
              <div className="nav-unit" key={paper.slug}>
                {showPart && <p className="nav-group">{paper.part}</p>}
                <Link
                  href={`/theory/${paper.slug}/`}
                  className={`${paper.status} ${activeSlug === paper.slug ? "selected" : ""}`}
                  aria-current={activeSlug === paper.slug ? "page" : undefined}
                >
                  <span className="timeline-dot" />
                  {index === 0 ? <Aperture className="manifest-icon" weight="thin" /> : null}
                  <span className="paper-copy">
                    <b>{paper.id}</b>
                    <strong>{paper.title}</strong>
                    <small>{paper.subtitle}</small>
                  </span>
                  <i />
                </Link>
              </div>
            );
          })}
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
