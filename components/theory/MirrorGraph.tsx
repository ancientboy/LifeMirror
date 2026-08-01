const nodes = [
  ["Event", "事件"],
  ["Emotion", "情绪"],
  ["Memory", "记忆"],
  ["Decision", "选择"],
  ["Growth Pattern", "成长模式"],
];

export function MirrorGraph() {
  return (
    <figure className="theory-visual graph-visual" aria-label="人生图谱关系">
      <figcaption><span>MIRROR GRAPH</span><strong>事件如何沉淀为人生模式</strong></figcaption>
      <div className="graph-flow">
        {nodes.map(([en, zh], index) => (
          <div className="graph-node" key={en}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>{en}</strong><small>{zh}</small>
          </div>
        ))}
      </div>
    </figure>
  );
}
