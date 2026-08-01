const layers = [
  { key: "future", en: "Future Self", zh: "未来自我", note: "方向与可能性" },
  { key: "values", en: "Values & Mission", zh: "价值与使命", note: "想成为谁" },
  { key: "mind", en: "Cognition · Emotion · Relationship", zh: "认知 · 情绪 · 关系", note: "如何理解世界" },
  { key: "behavior", en: "Behavior", zh: "行为自我", note: "如何做出选择" },
  { key: "experience", en: "Experience Self", zh: "经历自我", note: "如何成为现在" },
  { key: "innate", en: "Innate Self", zh: "先天自我", note: "生命的初始倾向" },
];

export function HumanMirrorFramework() {
  return (
    <figure className="theory-visual framework-visual" aria-label="人生镜像六层模型">
      <figcaption><span>HUMAN MIRROR FRAMEWORK</span><strong>人生镜像六层模型</strong></figcaption>
      <div className="framework-stack">
        {layers.map((layer, index) => (
          <div className={`framework-layer ${layer.key}`} key={layer.key}>
            <span>{String(layers.length - index).padStart(2, "0")}</span>
            <div><strong>{layer.en}</strong><small>{layer.zh}</small></div>
            <em>{layer.note}</em>
          </div>
        ))}
      </div>
      <p className="visual-note">时间从下向上穿过每一层；镜像并非静态剖面，而是持续演化的生命结构。</p>
    </figure>
  );
}
