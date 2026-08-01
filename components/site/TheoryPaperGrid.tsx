import Link from "next/link";
import type { TheoryMeta } from "@/lib/theory";

export function TheoryPaperGrid({ papers }: { papers: TheoryMeta[] }) {
  return (
    <div className="research-grid">
      {papers.map((paper) => (
        <Link className={`research-card ${paper.status}`} href={`/theory/${paper.slug}/`} key={paper.slug}>
          <div><span>{paper.part}</span><em>{paper.status === "planned" ? "IN EVOLUTION" : `V${paper.version}`}</em></div>
          <b>{paper.id}</b>
          <h3>{paper.title}</h3>
          <h4>{paper.subtitle}</h4>
          <p>{paper.summary}</p>
          <small>OPEN RESEARCH PAPER →</small>
        </Link>
      ))}
    </div>
  );
}
