"use client";

import { Aperture, ArrowRight, CardsThree, ChartPolar, ChatCircleDots, Compass, Hexagon, House, Sparkle, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./ShiguangHome.module.css";
import navStyles from "./ShiguangBottomNav.module.css";

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
const tools = [
  { href: "/app/liuyao/", icon: Hexagon, eyebrow: "即时问题", title: "六爻", copy: "针对一件具体的事，起卦后看助力、阻力与变化条件。", theme: "east" },
  { href: "/app/chart/", icon: ChartPolar, eyebrow: "长期结构", title: "命盘", copy: "从出生时间建立四柱、五行、大运与流年结构。", theme: "east" },
  { href: "/app/tarot/", icon: CardsThree, eyebrow: "当下觉察", title: "塔罗", copy: "用牌位、单牌与牌间关系，整理此刻的问题与选择。", theme: "west" },
  { href: "/app/astrology/", icon: Sparkle, eyebrow: "人格地图", title: "占星", copy: "生成本命盘，阅读行星、宫位、相位与核心三要素。", theme: "west" },
] as const;

export function ShiguangHome() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.localStorage.getItem("life-mirror:guest-session:v1") === "active") {
      setReady(true);
      return;
    }
    fetch("/api/v1/auth/session", { credentials: "include" })
      .then((response) => { if (!response.ok) throw new Error("signed_out"); setReady(true); })
      .catch(() => router.replace("/app/"));
  }, [router]);
  if (!ready) return <main className={styles.gate}><Aperture weight="thin" /><h1>先从欢迎页进入 LifeMirror。</h1><p>这样拾光才能知道你正在使用游客模式，并把记录留在当前设备。</p><Link href="/">返回欢迎页 <ArrowRight /></Link></main>;

  return <main className={styles.shell}>
    <header className={styles.topbar}><Link href="/" className={styles.brand}><Aperture weight="thin" /><span><b>LifeMirror</b><small>拾光 · HOME</small></span></Link><nav><Link href="/mirror/"><UserCircle /> 我的镜像</Link><Link href="/theory/">镜像志</Link></nav></header>
    <section className={styles.welcome}>
      <div className={styles.copy}><small>GOOD TO SEE YOU · 游客模式</small><h1>今天想先聊聊，<br />还是借一面镜子看看？</h1><p>拾光是主入口。你可以直接说近况，也可以选择一种工具；体验结束后，结果会带回同一段对话继续追问。</p><div className={styles.flow}><span>1 · 和拾光说说</span><i /><span>2 · 选择镜子</span><i /><span>3 · 带结果继续聊</span></div></div>
      <div className={styles.character}><div /><img src={assetPath("/characters/shiguang/shiguang-east-chibi.png")} alt="Q版拾光" /><blockquote>“不用先想清楚该用哪个工具。告诉我你正在经历什么，我们一起选择。”</blockquote></div>
    </section>
    <section className={styles.chatSection}><ShiguangChat mode="home" theme="east" context="这是 LifeMirror 的常规聊天首页。用户尚未选择具体工具。先自然回应近况；只有在确实有帮助时，才建议六爻、命盘、塔罗或占星中的一个，并说明为什么。不要强迫用户做测试。" opening="我在。你可以直接告诉我今天发生了什么，或者哪件事一直在心里转。我们先聊，不急着选工具。" /></section>
    <section id="mirrors" className={styles.toolSection}><header><div><small>CHOOSE A MIRROR · 可选</small><h2>如果语言还不够，就借一种结构来看。</h2></div><p>工具不是四个互不相干的小游戏，而是拾光在不同问题里使用的四种观察方式。</p></header><div className={styles.toolGrid}>{tools.map((tool) => { const Icon = tool.icon; return <Link href={tool.href} className={styles[tool.theme]} key={tool.title}><Icon weight="thin" /><div><small>{tool.eyebrow}</small><h3>{tool.title}</h3><p>{tool.copy}</p></div><ArrowRight /></Link>; })}</div></section>
    <nav className={navStyles.bottomNav} aria-label="LifeMirror 主导航"><Link className={navStyles.current} href="/app/home/"><House weight="fill" /><span>拾光</span></Link><a href="#mirrors"><Compass /><span>探索</span></a><Link href="/mirror/"><ChatCircleDots /><span>镜像</span></Link><button type="button"><UserCircle /><span>我的</span></button></nav>
  </main>;
}
