import Link from "next/link";
import type { SystemMeta } from "@/lib/system";

export function SystemPaperGrid({ papers }: { papers: SystemMeta[] }) {
  return (
    <div className="system-paper-grid">
      {papers.map((paper, index) => (
        <Link className={`system-paper-card ${paper.status}`} href={`/system/${paper.slug}/`} key={paper.id}>
          <div>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <em>{paper.status === "planned" ? "IN EVOLUTION" : `V${paper.version}`}</em>
          </div>
          <b>{paper.id}</b>
          <h2>{paper.navTitle}</h2>
          <h3>{paper.title}</h3>
          <p>{paper.summary}</p>
          <small>OPEN SYSTEM PAPER →</small>
        </Link>
      ))}
    </div>
  );
}
