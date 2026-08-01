type Stage = {
  title: string;
  subtitle: string;
  description?: string;
};

function FlowFramework({ label, title, stages, note }: { label: string; title: string; stages: Stage[]; note: string }) {
  return (
    <figure className="theory-visual application-visual" aria-label={title}>
      <figcaption><span>{label}</span><strong>{title}</strong></figcaption>
      <ol className="application-flow">
        {stages.map((stage, index) => (
          <li key={stage.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stage.title}</strong>
            <small>{stage.subtitle}</small>
            {stage.description && <p>{stage.description}</p>}
          </li>
        ))}
      </ol>
      <p className="visual-note">{note}</p>
    </figure>
  );
}

export function MirrorExperienceFramework() {
  return <FlowFramework label="MIRROR EXPERIENCE" title="从第一次映照到长期成长陪伴" stages={[
    { title: "First Reflection", subtitle: "初始映照", description: "建立此刻的人生镜像" },
    { title: "Daily Reflection", subtitle: "日常觉察", description: "观察状态与变化" },
    { title: "Life Review", subtitle: "人生回望", description: "连接经历与意义" },
    { title: "Growth Loop", subtitle: "成长循环", description: "把理解带回现实行动" },
  ]} note="体验不是功能的堆叠，而是一段逐渐加深的理解关系。" />;
}

export function MirrorMoment() {
  return <FlowFramework label="MIRROR MOMENT" title="一次关键镜像时刻" stages={[
    { title: "Event", subtitle: "事件" },
    { title: "Reflection", subtitle: "映照" },
    { title: "Meaning", subtitle: "意义" },
    { title: "Choice", subtitle: "选择" },
  ]} note="关键时刻的价值，不是给出答案，而是让人看见选择背后的自己。" />;
}

export function MirrorExperienceLoop() {
  return <FlowFramework label="EXPERIENCE LOOP" title="持续演化的体验闭环" stages={[
    { title: "Observe", subtitle: "观察" },
    { title: "Understand", subtitle: "理解" },
    { title: "Reflect", subtitle: "映照" },
    { title: "Grow", subtitle: "成长" },
  ]} note="新的成长会形成新的现实，并再次进入观察与理解。" />;
}

export function RelationshipMirror() {
  return <FlowFramework label="RELATIONSHIP MIRROR" title="关系如何共同塑造一个人" stages={[
    { title: "Family", subtitle: "家庭镜像", description: "安全感与早期模式" },
    { title: "Partner", subtitle: "伴侣镜像", description: "亲密、沟通与共同成长" },
    { title: "Social", subtitle: "社会镜像", description: "认知边界与价值网络" },
    { title: "Team", subtitle: "团队镜像", description: "协作、领导与组织行为" },
  ]} note="关系镜像描述连接和影响，不判断关系，也不替任何人定义他人。" />;
}

export function MirrorEconomyModel() {
  return <FlowFramework label="MIRROR ECONOMY" title="从数据价值走向理解价值" stages={[
    { title: "Life Data", subtitle: "人生信息" },
    { title: "Understanding", subtitle: "长期理解" },
    { title: "Reflection", subtitle: "可用映照" },
    { title: "Growth Value", subtitle: "成长价值" },
  ]} note="理解资产服务于个人成长与关系连接，不被定义为金融资产。" />;
}

export function HumanUnderstandingFuture() {
  return <FlowFramework label="HUMAN UNDERSTANDING" title="理解智能的长期演化" stages={[
    { title: "Personal Mirror", subtitle: "个人镜像" },
    { title: "Relationship Mirror", subtitle: "关系镜像" },
    { title: "Collective Insight", subtitle: "群体洞察" },
    { title: "Understanding Society", subtitle: "理解型社会" },
  ]} note="AI 不替代人的主体性，而是帮助人更清醒地理解自己正在成为谁。" />;
}
