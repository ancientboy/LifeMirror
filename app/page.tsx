import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { InstituteShell } from "@/components/site/InstituteShell";
import { TheoryPaperGrid } from "@/components/site/TheoryPaperGrid";
import { getMdxComponents } from "@/components/mdx-components";
import { getTheoryDocument, getTheoryPapers } from "@/lib/theory";

const gateways = [
  { number: "01", key: "WHY", title: "为什么", copy: "理解需求与时代背景", href: "/theory/why/", image: "card-why.webp" },
  { number: "02", key: "WHAT", title: "是什么", copy: "人生镜像的本质与结构", href: "/theory/what/", image: "card-what.webp" },
  { number: "03", key: "HOW", title: "如何实现", copy: "理论原则与动态框架", href: "/theory/how/", image: "card-how.webp" },
  { number: "04", key: "APPLICATION", title: "应用场景", copy: "在人生中的实践与价值", href: "/theory/application/", image: "card-application.webp" },
  { number: "05", key: "FUTURE", title: "未来展望", copy: "通向更高维度的人类理解", href: "/theory/future/", image: "card-future.webp" },
];

export default function HomePage() {
  const papers = getTheoryPapers();
  const manifesto = getTheoryDocument("manifesto");

  return (
    <InstituteShell papers={papers}>
      <section className="hero" aria-labelledby="hero-title">
        <img className="hero-backdrop" src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/life-mirror-cosmos.webp`} alt="" />
        <img className="hero-shiguang" src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/characters/shiguang/shiguang-hero.webp`} alt="拾光，Life Mirror 的 AI 陪伴者" />
        <div className="hero-copy">
          <p className="eyebrow">LIFE MIRROR · SHIGUANG</p>
          <h1 id="hero-title">借一卦，<br /><span>看见自己。</span></h1>
          <div className="hero-rule"><span /></div>
          <p className="hero-intro">拾光会陪你，把模糊的心事慢慢照亮。<br />她先读懂传统卦意，再陪你看见此刻真正关心的问题。</p>
          <Link className="hero-persona-cta" href="/app/">和拾光开始今日镜像 →</Link>
        </div>

        <div className="gateway-grid" aria-label="五个研究入口">
          {gateways.map((item) => (
            <Link className="gateway" href={item.href} key={item.key}>
              <div className="gateway-heading"><b>{item.number}</b><small>{item.key}</small></div>
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
              <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/${item.image}`} alt="" />
            </Link>
          ))}
        </div>
        <a className="scroll-hint" href="#manifesto"><span><i /><i /></span>SCROLL</a>
      </section>

      {manifesto && (
        <article className="paper manifesto theory-home" id="manifesto">
          <header>
            <p>{manifesto.id} · VERSION {manifesto.version}</p>
            <h2>{manifesto.subtitle}</h2>
            <Link href="/theory/manifesto/">阅读独立论文页面 →</Link>
          </header>
          <div className="paper-body mdx-content manifesto-copy">
            <MDXRemote
              source={manifesto.content}
              components={getMdxComponents(manifesto.content)}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </div>
        </article>
      )}

      <section className="research-index" id="research">
        <header><span>LM RESEARCH PAPER SYSTEM</span><h2>持续演化的理论档案</h2><p>目录、路由与页面由 MDX metadata 自动生成。</p></header>
        <TheoryPaperGrid papers={papers.filter((paper) => paper.slug !== "manifesto")} />
      </section>
    </InstituteShell>
  );
}
