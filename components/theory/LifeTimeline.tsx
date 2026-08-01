export type LifeTimelineItem = { time: string; title: string; description?: string };

export function LifeTimeline({ items }: { items: LifeTimelineItem[] }) {
  return (
    <figure className="theory-visual life-timeline" aria-label="人生时间轴">
      <figcaption><span>LIFE TIMELINE</span><strong>时间中的事件与变化</strong></figcaption>
      <ol>
        {items.map((item, index) => (
          <li key={`${item.time}-${item.title}`}>
            <span>{String(index + 1).padStart(2, "0")}</span><time>{item.time}</time><strong>{item.title}</strong>
            {item.description && <p>{item.description}</p>}
          </li>
        ))}
      </ol>
    </figure>
  );
}
