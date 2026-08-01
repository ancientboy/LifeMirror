import Link from "next/link";

type BridgeVariant = "mirror-dna" | "mirror-graph" | "mirror-engine" | "mirror-experience";

type BridgeDefinition = {
  theory: string;
  statement: string;
  targets: { id: string; title: string; slug: string }[];
  flow: { title: string; detail?: string }[];
  note: string;
};

const bridges: Record<BridgeVariant, BridgeDefinition> = {
  "mirror-dna": {
    theory: "Mirror DNA",
    statement: "Mirror DNA describes the evolving structure of human patterns.",
    targets: [{ id: "SYSTEM-003", title: "Mirror Data Model", slug: "system-003" }],
    flow: [
      { title: "Signals" },
      { title: "Structured Memory" },
      { title: "Pattern Memory" },
      { title: "Mirror DNA Evolution", detail: "DNA Schema · Confidence · Evolution Pipeline" },
    ],
    note: "The data model turns accumulating evidence into a dynamic personal model without fixing the person into a permanent label.",
  },
  "mirror-graph": {
    theory: "Mirror Graph",
    statement: "Mirror Graph describes how events gain meaning through their relationships.",
    targets: [{ id: "SYSTEM-003", title: "Mirror Data Model", slug: "system-003" }],
    flow: [
      { title: "Event" },
      { title: "Decision" },
      { title: "Context" },
      { title: "Emotion" },
      { title: "Relationship" },
    ],
    note: "The data model preserves these entities as a connected life graph so memory can retain meaning, not only isolated facts.",
  },
  "mirror-engine": {
    theory: "Mirror Engine",
    statement: "Mirror Engine defines how AI understands human life.",
    targets: [{ id: "SYSTEM-004", title: "Mirror Runtime", slug: "system-004" }],
    flow: [
      { title: "Reality Engine", detail: "Acquisition Pipeline" },
      { title: "Memory Engine", detail: "Memory Manager" },
      { title: "Insight Engine", detail: "Reasoning Engine" },
      { title: "Reflection Engine", detail: "Reflection Runtime" },
      { title: "Growth Engine", detail: "Learning Runtime" },
    ],
    note: "The runtime makes the five theoretical engines operational as one continuous cycle of acquisition, memory, reasoning, reflection, and learning.",
  },
  "mirror-experience": {
    theory: "Mirror Experience",
    statement: "Mirror Experience becomes real user interaction through distinct depths of reflection.",
    targets: [
      { id: "SYSTEM-002", title: "Acquisition Pipeline", slug: "system-002" },
      { id: "SYSTEM-004", title: "Runtime", slug: "system-004" },
    ],
    flow: [
      { title: "Casual Mode" },
      { title: "Reflection Mode" },
      { title: "Deep Analysis Mode" },
      { title: "Review Mode" },
      { title: "Exploration Mode" },
    ],
    note: "Each interaction mode coordinates the appropriate acquisition depth with the runtime needed to understand and reflect the moment.",
  },
};

export function TheorySystemBridge({ model }: { model: BridgeVariant }) {
  const bridge = bridges[model];

  return (
    <aside className="theory-system-bridge" aria-label={`${bridge.theory} theory to system mapping`}>
      <header>
        <small>THEORY → SYSTEM BRIDGE</small>
        <h3>{bridge.theory}</h3>
        <p>{bridge.statement}</p>
      </header>
      <ol className={`bridge-flow bridge-flow-${bridge.flow.length}`}>
        {bridge.flow.map((step, index) => (
          <li key={step.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.title}</strong>
            {step.detail && <small>{step.detail}</small>}
          </li>
        ))}
      </ol>
      <p className="bridge-note">{bridge.note}</p>
      <footer>
        <span>IMPLEMENTED BY</span>
        <div>
          {bridge.targets.map((target) => (
            <Link href={`/system/${target.slug}/`} key={target.id}>
              <b>{target.id}</b><strong>{target.title}</strong><i>↗</i>
            </Link>
          ))}
        </div>
      </footer>
    </aside>
  );
}
