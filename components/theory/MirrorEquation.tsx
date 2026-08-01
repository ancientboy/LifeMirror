const selves = ["Innate", "Experience", "Behavioral", "Cognitive", "Relational", "Future"];

export function MirrorEquation() {
  return (
    <figure className="theory-visual equation-visual" aria-label="Human Mirror 理论表达式">
      <figcaption><span>MIRROR EQUATION</span><strong>人的镜像，在时间中形成</strong></figcaption>
      <div className="equation-expression">
        <div className="equation-name">Human<br />Mirror</div>
        <b>=</b>
        <div className="equation-selves">
          {selves.map((self, index) => <span key={self}>{self} Self{index < selves.length - 1 && <i>+</i>}</span>)}
        </div>
        <b>×</b>
        <div className="equation-time">TIME<small>时间</small></div>
      </div>
      <p className="visual-note">这不是数学计算，而是一种关于“人如何成为自己”的理论表达。</p>
    </figure>
  );
}
