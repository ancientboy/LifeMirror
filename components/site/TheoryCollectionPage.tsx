import Link from "next/link";
import { InstituteShell } from "@/components/site/InstituteShell";
import { TheoryPaperGrid } from "@/components/site/TheoryPaperGrid";
import { getTheoryPapers } from "@/lib/theory";
import type { TheoryPartDefinition } from "@/lib/theory-parts";

export function TheoryCollectionPage({ part }: { part: TheoryPartDefinition }) {
  const papers = getTheoryPapers();
  const partPapers = papers.filter((paper) => part.paperIds.includes(paper.id));

  return (
    <InstituteShell papers={papers} activePart={part.slug}>
      <main className="theory-collection">
        <header className="theory-collection-header">
          <Link href="/theory/">LIFE MIRROR THEORY MAP</Link>
          <p>PART {part.number} · {part.label}</p>
          <h1>{part.title}</h1>
          <h2>{part.subtitle}</h2>
          <p className="theory-collection-intro">{part.description}</p>
          <div><span>{String(partPapers.length).padStart(2, "0")} RESEARCH PAPERS</span><i /><span>LIFE MIRROR THEORY V1.0</span></div>
        </header>

        <section className="theory-collection-papers" aria-labelledby={`${part.slug}-papers`}>
          <header>
            <span>RESEARCH ARCHIVE</span>
            <h2 id={`${part.slug}-papers`}>{part.label} Papers</h2>
          </header>
          <TheoryPaperGrid papers={partPapers} />
        </section>
      </main>
    </InstituteShell>
  );
}
