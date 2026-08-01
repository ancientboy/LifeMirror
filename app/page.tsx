"use client";

import {
  Aperture,
  CalendarBlank,
  CaretDoubleLeft,
  GlobeHemisphereWest,
  MagnifyingGlass,
  MoonStars,
  Sun,
} from "@phosphor-icons/react";
import { useState } from "react";

const papers = [
  { group: "", code: "MANIFESTO", en: "", zh: "人生镜像宣言", state: "active", href: "#manifesto" },
  { group: "PART I · WHY", code: "LM-001", en: "Why Humanity Needs Life Mirror", zh: "为什么人类需要人生镜像", state: "ready", href: "#chapter-1" },
  { group: "PART II · WHAT", code: "LM-002", en: "AI 最缺失的一块能力", zh: "下一章", state: "planned", href: "#what" },
  { group: "", code: "LM-003", en: "Mirror Principles", zh: "规划中", state: "planned", href: "#principles" },
  { group: "PART III · HOW", code: "LM-004", en: "Mirror DNA", zh: "规划中", state: "planned", href: "#dna" },
  { group: "", code: "LM-005", en: "Mirror Graph", zh: "规划中", state: "planned", href: "#graph" },
  { group: "", code: "LM-006", en: "Mirror Engine", zh: "规划中", state: "planned", href: "#engine" },
];

const gateways = [
  { number: "01", key: "WHY", title: "为什么", copy: "理解需求与时代背景", href: "#chapter-1", image: "card-why.webp" },
  { number: "02", key: "WHAT", title: "是什么", copy: "人生镜像的本质与结构", href: "#what", image: "card-what.webp" },
  { number: "03", key: "HOW", title: "如何实现", copy: "理论引擎与技术框架", href: "#principles", image: "card-how.webp" },
  { number: "04", key: "APPLICATION", title: "应用场景", copy: "在人生中的实践与价值", href: "#application", image: "card-application.webp" },
  { number: "05", key: "FUTURE", title: "未来展望", copy: "通向更高维度的人类理解", href: "#future", image: "card-future.webp" },
];

export default function HomePage() {
  const [active, setActive] = useState("#manifesto");
  const [light, setLight] = useState(false);

  return (
    <main className={`site-shell${light ? " reduced-glow" : ""}`}>
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Life Mirror Institute 首页">
          <span className="brand-mark"><Aperture weight="thin" /></span>
          <span className="brand-name">LIFE MIRROR<br />INSTITUTE</span>
          <small>RESEARCHING HUMAN UNDERSTANDING</small>
        </a>

        <nav aria-label="LM Research Paper 目录">
          {papers.map((paper, index) => (
            <div className="nav-unit" key={paper.code}>
              {paper.group && <p className="nav-group">{paper.group}</p>}
              <a
                href={paper.href}
                className={`${paper.state} ${active === paper.href ? "selected" : ""}`}
                onClick={() => setActive(paper.href)}
              >
                <span className="timeline-dot" />
                {index === 0 ? <Aperture className="manifest-icon" weight="thin" /> : null}
                <span className="paper-copy">
                  <b>{paper.code}</b>
                  {paper.en && <strong>{paper.en}</strong>}
                  <small>{paper.zh}</small>
                </span>
                <i />
              </a>
            </div>
          ))}
        </nav>

        <footer className="sidebar-footer">
          <button aria-label="调整光感" onClick={() => setLight((value) => !value)}>
            <Sun weight="thin" /><span><i /></span><MoonStars weight="fill" />
          </button>
          <span><GlobeHemisphereWest weight="thin" /> EN</span>
          <CaretDoubleLeft weight="thin" />
        </footer>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <span><CalendarBlank weight="thin" /> August 1, 2026</span>
          <i />
          <span>Version 0.1</span>
          <i />
          <span>Shiguang Research</span>
          <button aria-label="搜索研究论文"><MagnifyingGlass weight="thin" /></button>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <img className="hero-backdrop" src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/life-mirror-cosmos.webp`} alt="" />
          <div className="hero-copy">
            <p className="eyebrow">LIFE MIRROR MANIFESTO</p>
            <h1 id="hero-title">每个人<br />都值得拥有<br /><span>一面真正理解自己</span>的镜子。</h1>
            <div className="hero-rule"><span /></div>
            <p className="hero-intro">Life Mirror 不是为了预测未来，也不是替你定义人生。<br />它是一面会随着人生不断成长的镜子，<br />帮助你看见自己、理解自己、成为自己。</p>
          </div>

          <div className="gateway-grid" aria-label="五个研究入口">
            {gateways.map((item) => (
              <a className="gateway" href={item.href} key={item.key} onClick={() => setActive(item.href)}>
                <div className="gateway-heading"><b>{item.number}</b><small>{item.key}</small></div>
                <h2>{item.title}</h2>
                <p>{item.copy}</p>
                <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/${item.image}`} alt="" />
              </a>
            ))}
          </div>
          <a className="scroll-hint" href="#manifesto"><span><i /><i /></span>SCROLL</a>
        </section>

        <article className="paper manifesto" id="manifesto">
          <header><p>LIFE MIRROR MANIFESTO · LM-000</p><h2>人生镜像宣言</h2></header>
          <div className="paper-body manifesto-copy">
            <p>在人类历史的大部分时间里，我们一直努力理解这个世界。</p>
            <p>我们研究自然，建立科学；创造语言，传承文明；发明互联网，连接世界；训练 AI，让机器能够理解知识、图像与语言。</p>
            <blockquote>然而，直到今天，我们仍然没有真正学会持续理解一个人。</blockquote>
            <p>我们会忘记自己的初心，会忽略自己的成长，会重复相同的选择，也会在人生的重要时刻迷失真正的自己。</p>
            <div className="statement"><small>LIFE MIRROR 相信</small><strong>真正改变人生的，不是知道未来。</strong><strong>而是在每一次选择之前，更理解自己。</strong></div>
            <p>我们不希望 AI 成为命运的裁判。我们希望 AI 成为一面镜子，一面能够随着人生不断成长的镜子。</p>
            <p>它不会定义你，不会替你决定，不会制造焦虑。</p>
            <blockquote>因为人生的主角，永远不是 AI，而是你自己。</blockquote>
          </div>
        </article>

        <article className="paper chapter" id="chapter-1">
          <header><p>LM-001 · PART I · WHY</p><h2>为什么人类需要<br />人生镜像</h2></header>
          <div className="paper-body">
            <p className="lead">在人类文明的发展历程中，我们不断创造新的工具，以帮助自己更好地理解世界。然而，在所有这些进步之后，人类仍然面对着一个始终没有被真正解决的问题：如何持续地理解一个人。</p>
            <section><span>1.1</span><div><h3>理解世界，比理解自己更容易</h3><p>现代社会拥有前所未有的信息。我们能够获取近乎无限的知识，却依然会问自己：我真正想要什么？为什么我总会重复同样的选择？我到底是谁？</p><p>这些问题从来不是知识不足的问题，而是自我理解的问题。</p></div></section>
            <section><span>1.2</span><div><h3>人类一直在寻找认识自己的方法</h3><p>命理、哲学、宗教、心理学、人格理论、认知科学与心理咨询，都在尝试理解人。Life Mirror 不否定这些体系，而把它们看作观察人的不同窗口。</p><blockquote>每一种体系，都是观察人的一扇窗口。它们不是彼此竞争，而是彼此补充。</blockquote></div></section>
            <section><span>1.3</span><div><h3>AI 第一次拥有了持续理解一个人的能力</h3><p>AI 可以持续记录、长期记忆、跨时间观察与跨维度分析。它开始有能力发现表达方式、情绪模式、关系、决策、价值观与成长的长期变化。</p></div></section>
            <section><span>1.4</span><div><h3>理解不应该变成控制</h3><p>真正值得尊重的 AI，不是替人做决定，而是帮助人做决定。Life Mirror 永远相信，人生真正的主人始终是人自己。</p></div></section>
            <section><span>1.5</span><div><h3>我们需要的不是预测未来，而是理解现在</h3><p>真正改变人生的，从来不是知道未来，而是在做出下一次选择之前，更理解今天的自己。</p></div></section>
            <section><span>1.6</span><div><h3>Life Mirror 的诞生</h3><p>Life Mirror 试图回答一个更大的问题：如果 AI 能够陪伴一个人很多年，它应该怎样帮助这个人成长？</p></div></section>
            <section><span>1.7</span><div><h3>Why Now · 为什么是现在</h3><p>AI 开始具备长期记忆，人生数据开始数字化，现代人的身份与选择变得更复杂，同时 AI 的使命也正在从提升效率走向支持人的理解与成长。</p></div></section>
          </div>
        </article>

        <section className="planned-section" id="what"><span>LM-002 · WHAT</span><h2>AI 最缺失的一块能力</h2><p>下一章正在撰写。</p></section>
        <section className="planned-section" id="principles"><span>LM-003</span><h2>Mirror Principles</h2><p>规划中</p></section>
        <section className="planned-section" id="dna"><span>LM-004 · HOW</span><h2>Mirror DNA</h2><p>规划中</p></section>
        <section className="planned-section" id="graph"><span>LM-005 · HOW</span><h2>Mirror Graph</h2><p>规划中</p></section>
        <section className="planned-section" id="engine"><span>LM-006 · HOW</span><h2>Mirror Engine</h2><p>规划中</p></section>
        <section className="planned-section" id="application"><span>APPLICATION</span><h2>应用场景</h2><p>将在后续研究论文中展开。</p></section>
        <section className="planned-section" id="future"><span>FUTURE</span><h2>未来展望</h2><p>通向更高维度的人类理解。</p></section>
      </section>
    </main>
  );
}
