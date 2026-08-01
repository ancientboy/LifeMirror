const principles = [
  ["01", "Growth First", "成长第一", "帮助成长，而不是制造依赖。"],
  ["02", "Reflection Before Prediction", "理解先于预测", "看见现在，才能创造未来。"],
  ["03", "Observation Before Judgment", "观察先于评价", "理解形成行为的背景。"],
  ["04", "Human Agency", "人的主动权", "人生的选择权永远属于人。"],
  ["05", "Truth With Compassion", "真实而温暖", "面对真实，也相信改变。"],
  ["06", "Evolution Over Identity", "成长高于身份", "任何标签都不是最终版本。"],
];

export function PrincipleCards() {
  return (
    <figure className="theory-visual principles-visual" aria-label="Life Mirror 六大原则">
      <figcaption><span>THE SIX MIRROR PRINCIPLES</span><strong>理解人的边界，也是理解人的方式</strong></figcaption>
      <div className="principle-grid">
        {principles.map(([number, en, zh, copy]) => (
          <div className="principle-card" key={number}>
            <span>{number}</span><strong>{en}</strong><h4>{zh}</h4><p>{copy}</p>
          </div>
        ))}
      </div>
    </figure>
  );
}
