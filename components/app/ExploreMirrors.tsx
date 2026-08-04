import { ArrowRight, CardsThree, ChartPolar, Hexagon, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AppBottomNav } from "./AppBottomNav";
import styles from "./ExploreMirrors.module.css";

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

const realms = [
  {
    key: "east", eyebrow: "EASTERN MIRROR · 东方时间镜", title: "在变化与时间里，看见结构。", copy: "从具体问题到长期节律，东方镜更关心事情如何变化、条件何时成熟。", image: "/characters/shiguang/shiguang-east.webp", character: "东方拾光",
    tools: [
      { href: "/app/liuyao/", icon: Hexagon, name: "六爻", hint: "一件具体、近期有变化的问题" },
      { href: "/app/chart/", icon: ChartPolar, name: "命盘", hint: "长期结构、五行与时间节律" },
    ],
  },
  {
    key: "west", eyebrow: "WESTERN MIRROR · 西方象征镜", title: "在象征与关系里，理解自己。", copy: "从当下觉察到人格地图，西方镜更关心内在动力、关系模式与选择。", image: "/characters/shiguang/shiguang-west.webp", character: "西方拾光",
    tools: [
      { href: "/app/tarot/", icon: CardsThree, name: "塔罗", hint: "当下感受、关系与选择" },
      { href: "/app/astrology/", icon: Sparkle, name: "占星", hint: "人格动力、宫位与相位" },
    ],
  },
] as const;

export function ExploreMirrors() {
  return <main className={styles.shell}>
    <header className={styles.intro}><small>EXPLORE · 双生镜像</small><h1>同一个你，<br />可以从两种语言被照见。</h1><p>不必先懂工具。先看你此刻想问的是“事情如何变化”，还是“我为何这样感受”。</p></header>
    <section className={styles.realms}>
      {realms.map((realm) => <article className={styles[realm.key]} key={realm.key}>
        <div className={styles.art}><span>{realm.eyebrow}</span><img src={assetPath(realm.image)} alt={realm.character} /></div>
        <div className={styles.realmCopy}><small>{realm.eyebrow}</small><h2>{realm.title}</h2><p>{realm.copy}</p><div className={styles.tools}>{realm.tools.map((tool) => { const Icon = tool.icon; return <Link href={tool.href} key={tool.name}><Icon weight="thin" /><span><b>{tool.name}</b><small>{tool.hint}</small></span><ArrowRight /></Link>; })}</div></div>
      </article>)}
    </section>
    <footer><Link href="/app/home/">还不确定？先回去和拾光聊聊 <ArrowRight /></Link></footer>
    <AppBottomNav active="explore" />
  </main>;
}
