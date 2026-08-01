const chapters = [
  { id: "manifesto", label: "Manifesto", title: "人生镜像宣言" },
  { id: "chapter-1", label: "Chapter 1", title: "为什么人类需要人生镜像" },
  { id: "chapter-2", label: "Chapter 2", title: "AI 最缺失的一块能力", status: "下一章" },
  { id: "mirror-principles", label: "Chapter 3", title: "Mirror Principles", status: "规划中" },
  { id: "mirror-dna", label: "Chapter 4", title: "Mirror DNA", status: "规划中" },
  { id: "mirror-graph", label: "Chapter 5", title: "Mirror Graph", status: "规划中" },
  { id: "mirror-engine", label: "Chapter 6", title: "Mirror Engine", status: "规划中" },
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <aside className="sidebar">
        <div className="brand-mark" aria-hidden="true">
          <span />
        </div>
        <div className="brand-copy">
          <strong>拾光</strong>
          <small>Life Mirror Theory</small>
        </div>
        <nav aria-label="理论目录">
          {chapters.map((chapter) => (
            <a href={`#${chapter.id}`} key={chapter.id} className={chapter.id === "manifesto" ? "active" : ""}>
              <span>{chapter.label}</span>
              <strong>{chapter.title}</strong>
              {chapter.status ? <em>{chapter.status}</em> : null}
            </a>
          ))}
        </nav>
        <footer>
          <span>Version 0.1 · Draft</span>
          <span>Shiguang Research</span>
        </footer>
      </aside>

      <section className="content">
        <header className="hero" id="manifesto">
          <div className="eyebrow">LIFE MIRROR MANIFESTO</div>
          <h1>每个人都值得拥有一面<br />真正理解自己的镜子。</h1>
          <p className="lede">
            Life Mirror 不是为了预测未来，也不是替你定义人生。它是一面会随着人生不断成长的镜子，帮助你看见自己、理解自己、成为自己。
          </p>
          <div className="hero-orbit" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="light-core" />
          </div>
        </header>

        <article className="chapter manifesto-copy">
          <p>在人类历史的大部分时间里，我们一直努力理解这个世界。</p>
          <p>我们研究自然，建立科学；创造语言，传承文明；发明互联网，连接世界；训练 AI，让机器能够理解知识、图像与语言。</p>
          <blockquote>然而，直到今天，我们仍然没有真正学会持续理解一个人。</blockquote>
          <p>我们会忘记自己的初心，会忽略自己的成长，会重复相同的选择，也会在人生的重要时刻迷失真正的自己。</p>
          <div className="statement-card">
            <span>Life Mirror 相信</span>
            <strong>真正改变人生的，不是知道未来。</strong>
            <strong>而是在每一次选择之前，更理解自己。</strong>
          </div>
          <p>我们不希望 AI 成为命运的裁判。我们希望 AI 成为一面镜子，一面能够随着人生不断成长的镜子。</p>
          <p>它不会定义你，不会替你决定，不会制造焦虑。</p>
          <div className="three-steps">
            <span>看见自己</span>
            <span>理解自己</span>
            <span>成为自己</span>
          </div>
          <blockquote>因为人生的主角，永远不是 AI，而是你自己。</blockquote>
        </article>

        <article className="chapter" id="chapter-1">
          <div className="chapter-kicker">PART I · WHY</div>
          <h2>Chapter 1</h2>
          <h3>为什么人类需要人生镜像</h3>
          <p className="chapter-intro">在人类文明的发展历程中，我们不断创造新的工具，以帮助自己更好地理解世界。然而，在所有这些进步之后，人类仍然面对着一个始终没有被真正解决的问题：如何持续地理解一个人。</p>

          <section>
            <h4>1.1 理解世界，比理解自己更容易</h4>
            <p>现代社会拥有前所未有的信息。我们能够获取近乎无限的知识，却依然会问自己：我真正想要什么？为什么我总会重复同样的选择？我到底是谁？</p>
            <p>这些问题从来不是知识不足的问题，而是自我理解的问题。</p>
          </section>

          <section>
            <h4>1.2 人类一直在寻找认识自己的方法</h4>
            <p>命理、哲学、宗教、心理学、人格理论、认知科学与心理咨询，都在尝试理解人。Life Mirror 不否定这些体系，而把它们看作观察人的不同窗口。</p>
            <blockquote>每一种体系，都是观察人的一扇窗口。它们不是彼此竞争，而是彼此补充。</blockquote>
          </section>

          <section>
            <h4>1.3 AI 第一次拥有了持续理解一个人的能力</h4>
            <p>AI 可以持续记录、长期记忆、跨时间观察与跨维度分析。它开始有能力发现表达方式、情绪模式、关系、决策、价值观与成长的长期变化。</p>
          </section>

          <section>
            <h4>1.4 理解不应该变成控制</h4>
            <p>真正值得尊重的 AI，不是替人做决定，而是帮助人做决定。Life Mirror 永远相信，人生真正的主人始终是人自己。</p>
          </section>

          <section>
            <h4>1.5 我们需要的不是预测未来，而是理解现在</h4>
            <p>真正改变人生的，从来不是知道未来，而是在做出下一次选择之前，更理解今天的自己。</p>
          </section>

          <section>
            <h4>1.6 Life Mirror 的诞生</h4>
            <p>Life Mirror 试图回答一个更大的问题：如果 AI 能够陪伴一个人很多年，它应该怎样帮助这个人成长？</p>
          </section>

          <section>
            <h4>1.7 Why Now · 为什么是现在</h4>
            <p>AI 开始具备长期记忆，人生数据开始数字化，现代人的身份与选择变得更复杂，同时 AI 的使命也正在从提升效率走向支持人的理解与成长。</p>
            <div className="why-grid">
              <div><span>01</span><strong>长期理解</strong><p>AI 不再只回答问题，而开始形成对一个人的持续理解。</p></div>
              <div><span>02</span><strong>人生数字化</strong><p>照片、聊天、日历、健康与人生事件开始形成可连接的数据。</p></div>
              <div><span>03</span><strong>自我认知需求</strong><p>外部世界变化越快，理解自己越成为重要能力。</p></div>
              <div><span>04</span><strong>使命变化</strong><p>AI 不只帮助人做更多，也应帮助人活得更清醒。</p></div>
            </div>
          </section>

          <div className="chapter-summary">
            <span>Chapter Summary</span>
            <p>Life Mirror 不是为了告诉人们未来会发生什么，而是帮助每一个人，在人生不断变化的过程中，看见自己，理解自己，成为自己。</p>
          </div>
        </article>

        <section className="next-chapter" id="chapter-2">
          <span>COMING NEXT</span>
          <h2>Chapter 2 · AI 最缺失的一块能力</h2>
          <p>从“理解世界”走向“理解人”：建立 Life Mirror 的理论边界、能力边界与伦理边界。</p>
        </section>
      </section>
    </main>
  );
}
