const engineLayers = [
  {
    key: "reality",
    number: "01",
    title: "Reality Engine",
    subtitle: "现实感知",
    description: "感知对话、事件与现实变化",
  },
  {
    key: "memory",
    number: "02",
    title: "Memory Engine",
    subtitle: "记忆形成",
    description: "保存事件、情绪与重要意义",
  },
  {
    key: "insight",
    number: "03",
    title: "Insight Engine",
    subtitle: "模式洞察",
    description: "连接 Mirror DNA 与人生图谱",
  },
  {
    key: "reflection",
    number: "04",
    title: "Reflection Engine",
    subtitle: "镜像生成",
    description: "呈现今日、阶段与年度镜像",
  },
  {
    key: "growth",
    number: "05",
    title: "Growth Engine",
    subtitle: "成长支持",
    description: "支持复盘、方向与长期演化",
  },
];

export function MirrorEngine() {
  return (
    <figure className="theory-visual engine-visual" aria-label="人生镜像五层引擎">
      <figcaption>
        <span>MIRROR ENGINE</span>
        <strong>理解、映照并支持人的持续成长</strong>
      </figcaption>

      <div className="engine-loop">
        <div className="engine-core" aria-hidden="true">
          <span>LIFE</span>
          <strong>MIRROR</strong>
          <small>UNDERSTAND · REFLECT · GROW</small>
        </div>

        <ol className="engine-layers">
          {engineLayers.map((layer) => (
            <li className={`engine-layer ${layer.key}`} key={layer.key}>
              <span>{layer.number}</span>
              <div>
                <strong>{layer.title}</strong>
                <small>{layer.subtitle}</small>
              </div>
              <p>{layer.description}</p>
            </li>
          ))}
        </ol>

        <div className="engine-return" aria-hidden="true">
          <i />
          <span>NEW REALITY</span>
        </div>
      </div>

      <p className="visual-note">
        每一次成长都会成为新的现实，并再次进入感知；Mirror Engine 因此形成持续演化的生命闭环。
      </p>
    </figure>
  );
}
