const dimensions = ["Personality", "Values", "Behavior", "Emotion", "Cognition", "Relationship", "Growth"];

export function MirrorDNA() {
  return (
    <figure className="theory-visual dna-visual" aria-label="Mirror DNA 七个核心维度">
      <figcaption><span>MIRROR DNA</span><strong>人的七个核心维度</strong></figcaption>
      <div className="dna-orbit">
        <div className="dna-core"><strong>LIFE</strong><small>MIRROR</small></div>
        {dimensions.map((dimension, index) => (
          <div className="dna-dimension" style={{ "--index": index } as React.CSSProperties} key={dimension}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>{dimension}</strong>
          </div>
        ))}
      </div>
    </figure>
  );
}
