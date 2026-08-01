import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { InstituteShell } from "@/components/site/InstituteShell";
import { getMdxComponents } from "@/components/mdx-components";
import { getTheoryDocument, getTheoryPapers } from "@/lib/theory";

const gateways = [
  { number: "01", key: "WHY", title: "为什么", copy: "理解需求与时代背景", href: "/theory/lm-001/", image: "card-why.webp" },
  { number: "02", key: "WHAT", title: "是什么", copy: "人生镜像的本质与结构", href: "/theory/lm-002/", image: "card-what.webp" },
  { number: "03", key: "HOW", title: "如何实现", copy: "理论原则与动态框架", href: "/theory/lm-003/", image: "card-how.webp" },
  { number: "04", key: "APPLICATION", title: "应用场景", copy: "在人生中的实践与价值", href: "/theory/lm-007/", image: "card-application.webp" },
  { number: "05", key: "FUTURE", title: "未来展望", copy: "通向更高维度的人类理解", href: "/theory/lm-010/", image: "card-future.webp" },
];

export default function HomePage() {
  const papers = getTheoryPapers();
  const manifesto = getTheoryDocument("manifesto");

  return (
    <InstituteShell papers={papers}>
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
        <div className="research-grid">
          {papers.filter((paper) => paper.slug !== "manifesto").map((paper) => (
            <Link className={`research-card ${paper.status}`} href={`/theory/${paper.slug}/`} key={paper.slug}>
              <div><span>{paper.part}</span><em>{paper.status === "planned" ? "IN EVOLUTION" : `V${paper.version}`}</em></div>
              <b>{paper.id}</b>
              <h3>{paper.title}</h3>
              <h4>{paper.subtitle}</h4>
              <p>{paper.summary}</p>
              <small>OPEN RESEARCH PAPER →</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="planned-section" id="application"><span>APPLICATION</span><h2>应用场景</h2><p>理论将通过交互式模型进入真实人生场景，而不止停留在文章中。</p></section>
      <section className="planned-section" id="future"><span>FUTURE</span><h2>未来展望</h2><p>Life Mirror Institute 将持续研究 AI 如何理解、映照并支持人的长期成长。</p></section>
    </InstituteShell>
  );
}
