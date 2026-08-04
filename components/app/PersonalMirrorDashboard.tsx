"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarBlank, CircleNotch, Eye, Funnel, LockKey, Sparkle } from "@phosphor-icons/react";
import styles from "./PersonalMirrorDashboard.module.css";
import stateStyles from "./PersonalMirrorDashboardState.module.css";

type MirrorEvent = { id: string; question: string; savedAt: string; hexagram?: { originalHexagram?: { name?: string }; changedHexagram?: { name?: string } }; reflection?: { shareableReflection?: string; practicalGuidance?: string; shiguangInterpretation?: string } };
type PatternMemory = { id: string; title: string; summary: string; signalCount: number; confidence: number };
type DashboardMode = "loading" | "guest" | "authenticated";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/$/, "");
const HISTORY_KEY = "life-mirror:guest-history:v1";

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error ?? `request_failed_${response.status}`);
  return body as T;
}

function readGuestEvents(): MirrorEvent[] {
  try { return (JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]") as MirrorEvent[]).slice(0, 20); }
  catch { return []; }
}

export function PersonalMirrorDashboard() {
  const [mode, setMode] = useState<DashboardMode>("loading");
  const [events, setEvents] = useState<MirrorEvent[]>([]);
  const [patterns, setPatterns] = useState<PatternMemory[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "career" | "relationship">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await api<{ authenticated: boolean }>("/api/v1/auth/session");
        const [history, memories] = await Promise.all([
          api<{ events: MirrorEvent[] }>("/api/v1/daily-mirror/reflections"),
          api<{ patterns: PatternMemory[] }>("/api/v1/memories?limit=20"),
        ]);
        if (!active) return;
        setEvents(history.events); setPatterns(memories.patterns); setMode("authenticated");
      } catch (cause) {
        if (!active) return;
        const code = cause instanceof Error ? cause.message : "";
        setEvents(readGuestEvents()); setPatterns([]); setMode("guest");
        if (code !== "authentication_required") setError("暂时无法连接个人镜像，当前显示此设备保存的记录。");
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const visibleEvents = useMemo(() => events.filter((event) => filter === "all" || (filter === "career" ? /职业|工作|事业|选择|开始|行动/.test(event.question) : /关系|彼此|感情|伴侣|家庭/.test(event.question))), [events, filter]);
  const latest = events[0];
  const strongestPatterns = patterns.slice(0, 3);

  return <main className={styles.shell}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}><span>◌</span><b>LIFE MIRROR</b><small>PERSONAL MIRROR</small></Link>
      <nav aria-label="产品导航"><Link href="/app/">今日镜像</Link><Link className={styles.active} href="/mirror/">我的镜像</Link><Link href="/theory/">研究院</Link></nav>
      <span className={styles.private}><LockKey /> {mode === "authenticated" ? "私人空间" : "本地空间"}</span>
    </header>

    <section className={styles.hero}>
      <div><Link href="/app/" className={styles.back}><ArrowLeft /> 返回今日镜像</Link><p>PHASE 004 · PERSONAL MIRROR</p><h1>你正在成为的自己，<br /><em>已经留下了光。</em></h1><span>这里不定义你。它只把反复出现的选择、感受与成长线索，温柔地放回你面前。</span></div>
      <div className={styles.orbit} aria-label="个人镜像记录概览"><i /><i /><i /><strong>{mode === "loading" ? <CircleNotch className={stateStyles.spin} /> : events.length}<small>镜像时刻</small></strong></div>
    </section>

    {error && <p className={stateStyles.notice}>{error}</p>}
    <section className={styles.grid}>
      <article className={`${styles.card} ${styles.current}`}>
        <header><span><Sparkle /> 当前反思</span><small>{latest ? new Date(latest.savedAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" }) : "等待第一次记录"}</small></header>
        {latest ? <><h2>{latest.question}</h2><blockquote>“{latest.reflection?.shareableReflection ?? latest.reflection?.shiguangInterpretation ?? "一次值得被记住的观察。"}”</blockquote><div><span>{latest.hexagram?.originalHexagram?.name ?? "镜像"}</span><ArrowRight /><span>{latest.hexagram?.changedHexagram?.name ?? "成长"}</span></div></> : <div className={stateStyles.empty}><h2>你的镜像还在等待第一束光。</h2><p>完成并保存一次今日镜像后，它会出现在这里。</p></div>}
        <Link href="/app/">{latest ? "开启新的今日镜像" : "开始第一次今日镜像"} <ArrowRight /></Link>
      </article>

      <article className={`${styles.card} ${styles.dna}`}>
        <header><span><Eye /> Mirror DNA</span><small>持续演化 · 非固定标签</small></header>
        {strongestPatterns.length ? <><div className={styles.dnaMap}>{strongestPatterns.map((pattern) => <span key={pattern.id} style={{ "--size": `${Math.max(35, Math.round(pattern.confidence * 100))}%` } as React.CSSProperties}>{pattern.title}</span>)}</div><p>这些线索来自至少两次独立镜像，只代表目前可见的倾向。你可以在记忆控制中纠正、隐藏或删除它们。</p></> : <div className={stateStyles.empty}><h2>Mirror DNA 正在形成。</h2><p>当同一主题获得至少两条独立证据后，可修正的模式会显示在这里。</p></div>}
      </article>

      <article className={`${styles.card} ${styles.patterns}`}>
        <header><span>近期模式</span><small>至少 2 条独立证据后形成</small></header>
        {patterns.map((pattern) => <button key={pattern.id} onClick={() => setExpanded(expanded === pattern.id ? null : pattern.id)} className={styles.pattern}><span><i style={{ width: `${Math.round(pattern.confidence * 100)}%` }} /></span><b>{pattern.title}</b><small>{pattern.signalCount} 条镜像证据 · {Math.round(pattern.confidence * 100)}% 置信度 · {expanded === pattern.id ? "收起" : "查看"}</small>{expanded === pattern.id && <p>{pattern.summary}</p>}</button>)}
        {!patterns.length && <div className={stateStyles.empty}><p>{mode === "guest" ? "登录后，跨时间的 Pattern Memory 会在这里形成并保持同步。" : "继续保存镜像；达到证据门槛的模式会自动出现在这里。"}</p></div>}
      </article>
    </section>

    <section className={styles.timeline}>
      <header><div><p>MEMORY TIMELINE</p><h2>镜像时间线</h2></div><div className={styles.filters}><Funnel />{(["all", "career", "relationship"] as const).map((value) => <button className={filter === value ? styles.selected : ""} onClick={() => setFilter(value)} key={value}>{value === "all" ? "全部" : value === "career" ? "事业与行动" : "关系"}</button>)}</div></header>
      <div className={styles.timelineList}>{visibleEvents.map((event, index) => <article key={event.id}><div className={styles.node}><i /><span /></div><time><CalendarBlank />{new Date(event.savedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</time><div><small>MIRROR MOMENT {String(events.length - index).padStart(2, "0")}</small><h3>{event.question}</h3><p>{event.reflection?.shareableReflection ?? event.reflection?.shiguangInterpretation ?? "一次值得被记住的观察。"}</p><span>{event.hexagram?.originalHexagram?.name ?? "镜像"} → {event.hexagram?.changedHexagram?.name ?? "成长"}</span></div></article>)}</div>
      {mode !== "loading" && !visibleEvents.length && <div className={stateStyles.timelineEmpty}>{events.length ? "这个分类下还没有镜像记录。" : "保存第一次今日镜像后，时间线会从这里开始。"}</div>}
    </section>
  </main>;
}
