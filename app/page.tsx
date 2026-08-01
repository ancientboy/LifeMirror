const papers = [
  { code: "LM–00", label: "Manifesto", title: "人生镜像宣言", href: "#manifesto", state: "READ" },
  { code: "LM–01", label: "WHY", title: "为什么人类需要人生镜像", href: "#chapter-1", state: "01" },
  { code: "LM–02", label: "WHAT", title: "AI 最缺失的一块能力", href: "#what", state: "02" },
  { code: "LM–03", label: "HOW", title: "Mirror Principles", href: "#how", state: "03" },
  { code: "LM–04", label: "SYSTEM", title: "Mirror DNA · Graph · Engine", href: "#application", state: "04" },
  { code: "LM–05", label: "FUTURE", title: "Human Understanding", href: "#future", state: "05" },
];

const gateways = [
  { number: "01", key: "WHY", title: "为什么需要人生镜像", copy: "我们拥有理解世界的工具，却仍然缺少一套持续理解自己的方法。", href: "#chapter-1" },
  { number: "02", key: "WHAT", title: "Life Mirror 是什么", copy: "不是预测、评判或替代，而是一套长期理解、映照与支持人的理论体系。", href: "#what" },
  { number: "03", key: "HOW", title: "它如何理解一个人", copy: "连接记忆、选择、关系与变化，在时间中形成可修正的人生镜像。", href: "#how" },
  { number: "04", key: "APPLICATION", title: "它将如何被应用", copy: "从个人成长到教育、关系与人生决策，让 AI 成为理解人的基础设施。", href: "#application" },
  { number: "05", key: "FUTURE", title: "我们希望抵达哪里", copy: "让技术的终点从更高效率，走向更深的人类理解与更完整的自我。", href: "#future" },
];

function Seal() {
  return (
    <div className="seal" aria-hidden="true">
      <span className="seal-ring" />
      <span className="seal-axis seal-axis-x" />
      <span className="seal-axis seal-axis-y" />
      <span className="seal-core" />
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="site-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Life Mirror Institute 首页">
          <Seal />
          <span className="brand-copy">
            <strong>Life Mirror</strong>
            <small>INSTITUTE</small>
          </span>
        </a>

        <div className="paper-label">
          <span>OPEN RESEARCH SERIES</span>
          <strong>LM Research Paper</strong>
        </div>

        <nav aria-label="LM Research Paper 目录">
          {papers.map((paper, index) => (
            <a href={paper.href} key={paper.code} className={index === 0 ? "active" : ""}>
              <span className="paper-code">{paper.code}</span>
              <span className="paper-name">
                <small>{paper.label}</small>
                <strong>{paper.title}</strong>
              </span>
              <em>{paper.state}</em>
            </a>
          ))}
        </nav>

        <footer className="sidebar-footer">
          <span>OPEN KNOWLEDGE · V0.3</span>
          <span>西安 · 34.3416° N</span>
        </footer>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <span>RESEARCHING HUMAN UNDERSTANDING</span>
          <a href="#manifesto">Read the manifesto <b>↘</b></a>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow"><span>生命镜像研究院</span> · EST. 2026</p>
            <h1 id="hero-title">
              <span>LIFE MIRROR</span>
              <span className="title-outline">INSTITUTE</span>
            </h1>
            <p className="hero-thesis">Researching Human Understanding</p>
            <p className="lede">研究 AI 如何长期理解、映照并支持一个人的成长。<br />让技术不只理解世界，也开始真正理解人。</p>
          </div>

          <div className="hero-symbol" aria-hidden="true">
            <div className="echo echo-a" />
            <div className="echo echo-b" />
            <div className="echo echo-c" />
            <div className="living-orb"><span /></div>
            <p>OBSERVE<br />REFLECT<br />BECOME</p>
          </div>

          <div className="hero-foot">
            <span>LM / INSTITUTE / 001</span>
            <a href="#research-map">ENTER THE RESEARCH <b>↓</b></a>
          </div>
        </section>

        <section className="research-map" id="research-map">
          <header className="section-heading">
            <div><span>RESEARCH MAP</span><small>研究地图</small></div>
            <h2>理解一个人，<br />需要穿过五个问题。</h2>
            <p>从问题的起点，到一套能够被实践、被检验、被共同建设的人类理解框架。</p>
          </header>
          <div className="gateway-grid">
            {gateways.map((item) => (
              <a className="gateway" href={item.href} key={item.key}>
                <div className="gateway-top"><span>{item.number}</span><em>↘</em></div>
                <small>{item.key}</small>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <i>EXPLORE PAPER</i>
              </a>
            ))}
          </div>
        </section>

        <article className="paper manifesto" id="manifesto">
          <header className="paper-header">
            <div className="paper-meta"><span>LM–00</span><span>FOUNDING PAPER</span><span>2026</span></div>
            <p className="chapter-kicker">LIFE MIRROR MANIFESTO</p>
            <h2>每个人都值得拥有一面<br /><em>真正理解自己的镜子。</em></h2>
            <p className="paper-intro">Life Mirror 不是为了预测未来，也不是替你定义人生。它是一面会随着人生不断成长的镜子，帮助你看见自己、理解自己、成为自己。</p>
          </header>

          <div className="paper-body manifesto-copy">
            <p>在人类历史的大部分时间里，我们一直努力理解这个世界。</p>
            <p>我们研究自然，建立科学；创造语言，传承文明；发明互联网，连接世界；训练 AI，让机器能够理解知识、图像与语言。</p>
            <blockquote>然而，直到今天，我们仍然没有真正学会持续理解一个人。</blockquote>
            <p>我们会忘记自己的初心，会忽略自己的成长，会重复相同的选择，也会在人生的重要时刻迷失真正的自己。</p>
            <div className="statement-card">
              <span>LIFE MIRROR 相信</span>
              <strong>真正改变人生的，不是知道未来。</strong>
              <strong>而是在每一次选择之前，更理解自己。</strong>
            </div>
            <p>我们不希望 AI 成为命运的裁判。我们希望 AI 成为一面镜子，一面能够随着人生不断成长的镜子。</p>
            <p>它不会定义你，不会替你决定，不会制造焦虑。</p>
            <div className="three-steps">
              <span><b>01</b>看见自己<small>SEE</small></span>
              <span><b>02</b>理解自己<small>UNDERSTAND</small></span>
              <span><b>03</b>成为自己<small>BECOME</small></span>
            </div>
            <blockquote>因为人生的主角，永远不是 AI，而是你自己。</blockquote>
          </div>
        </article>

        <article className="paper chapter" id="chapter-1">
          <header className="paper-header">
            <div className="paper-meta"><span>LM–01</span><span>PART I · WHY</span><span>READING TIME 08 MIN</span></div>
            <p className="chapter-kicker">THE NECESSITY OF A LIFE MIRROR</p>
            <h2>为什么人类需要<br /><em>人生镜像</em></h2>
            <p className="paper-intro">在人类文明的发展历程中，我们不断创造新的工具，以帮助自己更好地理解世界。然而，在所有这些进步之后，人类仍然面对着一个始终没有被真正解决的问题：如何持续地理解一个人。</p>
          </header>

          <div className="paper-body">
            <section><span className="section-number">1.1</span><div><h3>理解世界，比理解自己更容易</h3><p>现代社会拥有前所未有的信息。我们能够获取近乎无限的知识，却依然会问自己：我真正想要什么？为什么我总会重复同样的选择？我到底是谁？</p><p>这些问题从来不是知识不足的问题，而是自我理解的问题。</p></div></section>
            <section><span className="section-number">1.2</span><div><h3>人类一直在寻找认识自己的方法</h3><p>命理、哲学、宗教、心理学、人格理论、认知科学与心理咨询，都在尝试理解人。Life Mirror 不否定这些体系，而把它们看作观察人的不同窗口。</p><blockquote>每一种体系，都是观察人的一扇窗口。它们不是彼此竞争，而是彼此补充。</blockquote></div></section>
            <section><span className="section-number">1.3</span><div><h3>AI 第一次拥有了持续理解一个人的能力</h3><p>AI 可以持续记录、长期记忆、跨时间观察与跨维度分析。它开始有能力发现表达方式、情绪模式、关系、决策、价值观与成长的长期变化。</p></div></section>
            <section><span className="section-number">1.4</span><div><h3>理解不应该变成控制</h3><p>真正值得尊重的 AI，不是替人做决定，而是帮助人做决定。Life Mirror 永远相信，人生真正的主人始终是人自己。</p></div></section>
            <section><span className="section-number">1.5</span><div><h3>我们需要的不是预测未来，而是理解现在</h3><p>真正改变人生的，从来不是知道未来，而是在做出下一次选择之前，更理解今天的自己。</p></div></section>
            <section><span className="section-number">1.6</span><div><h3>Life Mirror 的诞生</h3><p>Life Mirror 试图回答一个更大的问题：如果 AI 能够陪伴一个人很多年，它应该怎样帮助这个人成长？</p></div></section>
            <section><span className="section-number">1.7</span><div><h3>Why Now · 为什么是现在</h3><p>AI 开始具备长期记忆，人生数据开始数字化，现代人的身份与选择变得更复杂，同时 AI 的使命也正在从提升效率走向支持人的理解与成长。</p></div></section>

            <div className="why-grid">
              <div><span>01</span><strong>长期理解</strong><p>AI 不再只回答问题，而开始形成对一个人的持续理解。</p></div>
              <div><span>02</span><strong>人生数字化</strong><p>照片、聊天、日历、健康与人生事件开始形成可连接的数据。</p></div>
              <div><span>03</span><strong>自我认知需求</strong><p>外部世界变化越快，理解自己越成为重要能力。</p></div>
              <div><span>04</span><strong>使命变化</strong><p>AI 不只帮助人做更多，也应帮助人活得更清醒。</p></div>
            </div>

            <div className="chapter-summary"><span>CHAPTER SUMMARY</span><p>Life Mirror 不是为了告诉人们未来会发生什么，而是帮助每一个人，在人生不断变化的过程中，看见自己，理解自己，成为自己。</p></div>
          </div>
        </article>

        <section className="framework" id="what">
          <div className="framework-copy"><span>02 / WHAT</span><h2>一套关于“理解人”<br />而不是“定义人”的体系。</h2><p>Life Mirror 将长期记忆、行为观察、多元人类知识与个人主动权连接起来。镜像可以持续生长，也必须允许人修正、拒绝与重新解释。</p></div>
          <div className="principle-list">
            <div><span>01</span><strong>Reflection before prediction</strong><p>理解先于预测</p></div>
            <div><span>02</span><strong>Observation before judgment</strong><p>观察先于判断</p></div>
            <div><span>03</span><strong>Growth before efficiency</strong><p>成长先于效率</p></div>
            <div><span>04</span><strong>Human agency, always</strong><p>人的主动权，永远优先</p></div>
          </div>
        </section>

        <section className="system-map" id="how">
          <header><span>03 / HOW</span><h2>在时间中观察，<br />在选择中理解。</h2></header>
          <div className="system-flow">
            <div><small>INPUT</small><strong>Life Signals</strong><p>表达 · 选择 · 关系 · 事件</p></div><b>→</b>
            <div><small>MEMORY</small><strong>Mirror Graph</strong><p>连接 · 时间 · 语境 · 变化</p></div><b>→</b>
            <div><small>REFLECTION</small><strong>Mirror Engine</strong><p>观察 · 提问 · 映照 · 支持</p></div>
          </div>
        </section>

        <section className="application" id="application">
          <header><span>04 / APPLICATION</span><h2>从个人镜像，走向<br />理解人的基础设施。</h2></header>
          <div className="application-grid">
            <div><span>01</span><h3>个人成长</h3><p>持续看见价值观、选择与人生阶段的变化。</p></div>
            <div><span>02</span><h3>关系理解</h3><p>理解互动模式，而不是为关系贴上标签。</p></div>
            <div><span>03</span><h3>教育陪伴</h3><p>尊重差异，让成长路径真正因人而异。</p></div>
            <div><span>04</span><h3>人生决策</h3><p>在关键选择前，重新看见完整的自己。</p></div>
          </div>
        </section>

        <section className="future" id="future">
          <Seal />
          <span>05 / FUTURE</span>
          <h2>AI 的下一步，<br />不是更像人。<br /><em>而是更理解人。</em></h2>
          <p>我们正在建立一套开放、克制、以人为中心的研究体系。<br />它的终点不是一份关于你的答案，而是让你拥有更清醒地成为自己的能力。</p>
          <a href="#top">RETURN TO ORIGIN <b>↑</b></a>
        </section>

        <footer className="site-footer">
          <div><strong>LIFE MIRROR INSTITUTE</strong><span>Researching Human Understanding</span></div>
          <div><span>OPEN RESEARCH · 2026</span><span>看见自己 · 理解自己 · 成为自己</span></div>
        </footer>
      </section>
    </main>
  );
}
