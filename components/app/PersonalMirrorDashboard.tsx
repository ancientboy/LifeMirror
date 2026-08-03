"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarBlank, Eye, Funnel, LockKey, Sparkle } from "@phosphor-icons/react";
import styles from "./PersonalMirrorDashboard.module.css";

type MirrorEvent = {
  id: string;
  question: string;
  savedAt: string;
  hexagram?: { originalHexagram?: { name?: string }; changedHexagram?: { name?: string } };
  reflection?: { shareableReflection?: string; practicalGuidance?: string; shiguangInterpretation?: string };
};

const HISTORY_KEY = "life-mirror:guest-history:v1";
const demoEvents: MirrorEvent[] = [
  { id: "demo-1", savedAt: "2026-07-29T10:00:00.000Z", question: "我该如何看待现在的职业选择？", hexagram: { originalHexagram: { name: "渐" }, changedHexagram: { name: "家人" } }, reflection: { shareableReflection: "不必急着证明方向正确，先让下一步变得可验证。" } },
  { id: "demo-2", savedAt: "2026-07-18T10:00:00.000Z", question: "我为什么迟迟无法开始？", hexagram: { originalHexagram: { name: "屯" }, changedHexagram: { name: "解" } }, reflection: { shareableReflection: "阻力不一定是否定，也可能在提醒你缩小第一次行动。" } },
  { id: "demo-3", savedAt: "2026-06-30T10:00:00.000Z", question: "这段关系正在提醒我什么？", hexagram: { originalHexagram: { name: "咸" }, changedHexagram: { name: "恒" } }, reflection: { shareableReflection: "真正值得观察的，是彼此能否在日常里持续回应。" } },
];

const themes = [
  { label: "在不确定中寻找可验证的一步", value: 82, evidence: 3, tone: "teal" },
  { label: "把外界期待放回自己的节奏", value: 68, evidence: 2, tone: "violet" },
  { label: "关系中的边界与持续回应", value: 57, evidence: 2, tone: "gold" },
];

export function PersonalMirrorDashboard() {
  const [events, setEvents] = useState<MirrorEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "career" | "relationship">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]") as MirrorEvent[];
      setEvents(saved.length ? saved : demoEvents);
    } catch {
      setEvents(demoEvents);
    }
  }, []);

  const visibleEvents = useMemo(() => events.filter((event) => {
    if (filter === "all") return true;
    const text = event.question;
    return filter === "career" ? /职业|工作|选择|开始/.test(text) : /关系|彼此|感情/.test(text);
  }), [events, filter]);

  const latest = events[0] ?? demoEvents[0];

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}><span>◌</span><b>LIFE MIRROR</b><small>PERSONAL MIRROR</small></Link>
        <nav aria-label="产品导航"><Link href="/app/">今日镜像</Link><Link className={styles.active} href="/mirror/">我的镜像</Link><Link href="/theory/">研究院</Link></nav>
        <span className={styles.private}><LockKey /> 私人空间</span>
      </header>

      <section className={styles.hero}>
        <div><Link href="/app/" className={styles.back}><ArrowLeft /> 返回今日镜像</Link><p>PHASE 004 · PERSONAL MIRROR</p><h1>你正在成为的自己，<br /><em>已经留下了光。</em></h1><span>这里不定义你。它只把反复出现的选择、感受与成长线索，温柔地放回你面前。</span></div>
        <div className={styles.orbit} aria-label="Mirror DNA 概览"><i /><i /><i /><strong>{events.length || 3}<small>镜像时刻</small></strong></div>
      </section>

      <section className={styles.grid}>
        <article className={`${styles.card} ${styles.current}`}>
          <header><span><Sparkle /> 当前反思</span><small>{new Date(latest.savedAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</small></header>
          <h2>{latest.question}</h2><blockquote>“{latest.reflection?.shareableReflection ?? "每一次诚实的观察，都在让镜像更清晰。"}”</blockquote>
          <div><span>{latest.hexagram?.originalHexagram?.name ?? "未济"}</span><ArrowRight /><span>{latest.hexagram?.changedHexagram?.name ?? "渐"}</span></div>
          <Link href="/app/">开启新的今日镜像 <ArrowRight /></Link>
        </article>

        <article className={`${styles.card} ${styles.dna}`}>
          <header><span><Eye /> Mirror DNA</span><small>持续演化 · 非固定标签</small></header>
          <div className={styles.dnaMap}><span style={{ "--size": "78%" } as React.CSSProperties}>行动节奏</span><span style={{ "--size": "64%" } as React.CSSProperties}>内在标准</span><span style={{ "--size": "52%" } as React.CSSProperties}>关系边界</span></div>
          <p>你的镜像更常在“想清楚”之后行动；最近的变化是，你开始允许自己用小规模尝试代替一次性确定。</p>
        </article>

        <article className={`${styles.card} ${styles.patterns}`}>
          <header><span>近期模式</span><small>至少 2 条独立证据后形成</small></header>
          {themes.map((theme) => <button key={theme.label} onClick={() => setExpanded(expanded === theme.label ? null : theme.label)} className={styles.pattern}>
            <span className={styles[theme.tone]}><i style={{ width: `${theme.value}%` }} /></span><b>{theme.label}</b><small>{theme.evidence} 条镜像证据 · {expanded === theme.label ? "收起" : "查看"}</small>
            {expanded === theme.label && <p>这个观察来自不同时间的独立反思。它是可修正的线索，不是对你的判断。</p>}
          </button>)}
        </article>
      </section>

      <section className={styles.timeline}>
        <header><div><p>MEMORY TIMELINE</p><h2>镜像时间线</h2></div><div className={styles.filters}><Funnel />{(["all", "career", "relationship"] as const).map((value) => <button className={filter === value ? styles.selected : ""} onClick={() => setFilter(value)} key={value}>{value === "all" ? "全部" : value === "career" ? "事业与行动" : "关系"}</button>)}</div></header>
        <div className={styles.timelineList}>{visibleEvents.map((event, index) => <article key={event.id}>
          <div className={styles.node}><i /><span /></div><time><CalendarBlank />{new Date(event.savedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</time>
          <div><small>MIRROR MOMENT {String(events.length - index).padStart(2, "0")}</small><h3>{event.question}</h3><p>{event.reflection?.shareableReflection ?? event.reflection?.shiguangInterpretation ?? "一次值得被记住的观察。"}</p><span>{event.hexagram?.originalHexagram?.name ?? "镜像"} → {event.hexagram?.changedHexagram?.name ?? "成长"}</span></div>
        </article>)}</div>
      </section>
    </main>
  );
}
