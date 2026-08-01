const stages = [
  { time: "DAY 1", title: "基础镜像", detail: "初始信息与自我表达" },
  { time: "MONTH 1", title: "行为模式", detail: "重复选择开始显现" },
  { time: "YEAR 1", title: "人生模式", detail: "跨情境关系逐渐清晰" },
  { time: "YEAR 5+", title: "成长轨迹", detail: "看见长期变化与方向" },
];

export function MirrorEvolution() {
  return (
    <figure className="theory-visual evolution-visual" aria-label="人生镜像成长过程">
      <figcaption><span>MIRROR EVOLUTION</span><strong>镜像随人生一起成长</strong></figcaption>
      <div className="evolution-track">
        {stages.map((stage, index) => (
          <div className="evolution-stage" key={stage.time}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <time>{stage.time}</time>
            <strong>{stage.title}</strong>
            <small>{stage.detail}</small>
          </div>
        ))}
      </div>
    </figure>
  );
}
