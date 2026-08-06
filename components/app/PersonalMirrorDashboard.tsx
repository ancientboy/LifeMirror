"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarBlank, CircleNotch, Eye, Funnel, LockKey, Sparkle } from "@phosphor-icons/react";
import styles from "./PersonalMirrorDashboard.module.css";
import stateStyles from "./PersonalMirrorDashboardState.module.css";
import { AppBottomNav } from "./AppBottomNav";
import { AccountDataSync } from "./AccountDataSync";
import { ACCOUNT_DATA_CHANGED_EVENT } from "@/lib/account-data";

type MirrorEvent = { id: string; question: string; savedAt: string; source?: "tarot" | "bazi" | "astrology"; sourceLabel?: string; meta?: string; hexagram?: { originalHexagram?: { name?: string }; changedHexagram?: { name?: string } }; reflection?: { shareableReflection?: string; practicalGuidance?: string; shiguangInterpretation?: string } };
type PatternMemory = { id: string; title: string; summary: string; signalCount: number; confidence: number };
type DashboardMode = "loading" | "guest" | "authenticated";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
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

const dnaTopics = [
  { key: "relationship", title: "关系中的回应与边界", match: /关系|感情|伴侣|朋友|家人|对方|彼此|爱|复合/ },
  { key: "career", title: "事业方向与行动节奏", match: /工作|职业|事业|创业|项目|面试|升职|方向/ },
  { key: "decision", title: "重要选择与内在取舍", match: /选择|决定|要不要|是否|纠结|犹豫/ },
  { key: "emotion", title: "情绪消耗与自我照顾", match: /焦虑|压力|难过|疲惫|害怕|情绪|失眠/ },
] as const;

function deriveDnaPatterns(events: MirrorEvent[]): PatternMemory[] {
  const grouped = new Map<string, { title: string; events: MirrorEvent[] }>();
  for (const event of events) {
    const topic = dnaTopics.find((item) => item.match.test(event.question)) ?? { key: "growth", title: "正在展开的自我探索" };
    const current = grouped.get(topic.key) ?? { title: topic.title, events: [] };
    current.events.push(event); grouped.set(topic.key, current);
  }
  return [...grouped.entries()].map(([key, value]) => {
    const signalCount = value.events.length;
    const latest = value.events[0];
    const clue = latest.reflection?.shareableReflection ?? latest.reflection?.shiguangInterpretation ?? latest.question;
    return {
      id: `derived:${key}`,
      title: value.title,
      summary: signalCount === 1 ? `这是第一次记录形成的初始观察：${clue}。它还不是稳定结论，后续记录可以加强、修正或推翻它。` : `这个主题已经在 ${signalCount} 次独立镜像中出现。当前只把它视为可继续核对的倾向，新的经历仍会更新判断。`,
      signalCount,
      confidence: Math.min(0.82, signalCount === 1 ? 0.28 : 0.35 + signalCount * 0.11),
    };
  }).sort((left, right) => right.signalCount - left.signalCount || right.confidence - left.confidence);
}

function dnaObservation(pattern: PatternMemory, latest?: MirrorEvent) {
  const source = latest?.sourceLabel ?? "最近一次镜像";
  const clue = pattern.summary.replace(/^这是第一次记录形成的初始观察：/u, "").replace(/。它还不是[\s\S]*$/u, "").replace(/。当前只把[\s\S]*$/u, "").slice(0, 78);
  const repeated = pattern.signalCount >= 2;
  return {
    focus: `最近反复牵动你的，是${pattern.title}。`,
    response: repeated ? `这条线索已经出现 ${pattern.signalCount} 次：你会先把局面想清楚，再决定把话说到什么程度。` : `这还是第一次出现，但你没有把它轻轻带过。`,
    changing: repeated ? "它正在从“一个当下的问题”，慢慢变成值得认真对待的习惯或关系方式。" : "再有新的经历时，拾光会先看它是在被印证，还是应该被推翻。",
    evidence: clue || `${source}留下了一条与它相关的记录。`,
    source,
  };
}

export function PersonalMirrorDashboard() {
  const [mode, setMode] = useState<DashboardMode>("loading");
  const [events, setEvents] = useState<MirrorEvent[]>([]);
  const [patterns, setPatterns] = useState<PatternMemory[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "career" | "relationship">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dnaFeedback, setDnaFeedback] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await api<{ authenticated: boolean }>("/api/v1/auth/session");
        if (!active) return;
        setEvents(readGuestEvents()); setPatterns([]); setMode("authenticated");
      } catch (cause) {
        if (!active) return;
        const code = cause instanceof Error ? cause.message : "";
        setEvents(readGuestEvents()); setPatterns([]); setMode("guest");
        if (code !== "authentication_required") setError("暂时无法连接个人镜像，当前显示此设备保存的记录。");
      }
    }
    void load();
    const refresh = () => setEvents(readGuestEvents());
    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, refresh);
    return () => { active = false; window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, refresh); };
  }, []);

  const visibleEvents = useMemo(() => events.filter((event) => filter === "all" || (filter === "career" ? /职业|工作|事业|选择|开始|行动/.test(event.question) : /关系|彼此|感情|伴侣|家庭/.test(event.question))), [events, filter]);
  const latest = events[0];
  const displayPatterns = useMemo(() => patterns.length ? patterns : deriveDnaPatterns(events), [events, patterns]);
  const strongestPatterns = displayPatterns.slice(0, 3);
  const primaryDna = strongestPatterns[0] ? dnaObservation(strongestPatterns[0], latest) : null;
  const repeatedPatterns = displayPatterns.filter((pattern) => pattern.signalCount >= 2);
  const sourceStart = (event: MirrorEvent) => event.sourceLabel ?? event.hexagram?.originalHexagram?.name ?? "镜像";
  const sourceEnd = (event: MirrorEvent) => event.meta ?? event.hexagram?.changedHexagram?.name ?? "成长";

  return <main className={styles.shell}>
    {mode === "authenticated" && <AccountDataSync />}
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
        {latest ? <><h2>{latest.question}</h2><blockquote>“{latest.reflection?.shareableReflection ?? latest.reflection?.shiguangInterpretation ?? "一次值得被记住的观察。"}”</blockquote><div><span>{sourceStart(latest)}</span><ArrowRight /><span>{sourceEnd(latest)}</span></div></> : <div className={stateStyles.empty}><h2>你的镜像还在等待第一束光。</h2><p>完成并保存一次今日镜像后，它会出现在这里。</p></div>}
        <Link href="/app/">{latest ? "开启新的今日镜像" : "开始第一次今日镜像"} <ArrowRight /></Link>
      </article>

      <article className={`${styles.card} ${styles.dna}`}>
        <header><span><Eye /> Mirror DNA</span><small>拾光目前读到的你</small></header>
        {primaryDna ? <><div className={styles.dnaInsight}><article><small>此刻主线</small><b>{primaryDna.focus}</b></article><article><small>你的应对方式</small><p>{primaryDna.response}</p></article><article><small>正在变化</small><p>{primaryDna.changing}</p></article></div><div className={styles.dnaEvidence}><span>来自 {primaryDna.source}</span><p>“{primaryDna.evidence}”</p></div><div className={styles.dnaFeedback}><span>这像你吗？</span><button className={dnaFeedback === "yes" ? styles.feedbackActive : ""} onClick={() => setDnaFeedback("yes")}>像</button><button className={dnaFeedback === "no" ? styles.feedbackActive : ""} onClick={() => setDnaFeedback("no")}>不太像</button>{dnaFeedback && <small>{dnaFeedback === "yes" ? "记下了，我会继续用新的经历来核对它。" : "记下了，这条观察不会被当成你的标签。"}</small>}</div></> : <div className={stateStyles.empty}><h2>Mirror DNA 等待第一次记录。</h2><p>保存第一次镜像后，这里会出现拾光对你当下状态的具体观察。</p></div>}
      </article>

      <article className={`${styles.card} ${styles.patterns}`}>
        <header><span>近期模式</span><small>至少 2 条独立证据后形成</small></header>
        {repeatedPatterns.map((pattern) => <button key={pattern.id} onClick={() => setExpanded(expanded === pattern.id ? null : pattern.id)} className={styles.pattern}><span><i style={{ width: `${Math.round(pattern.confidence * 100)}%` }} /></span><b>{pattern.title}</b><small>{pattern.signalCount} 条镜像证据 · {Math.round(pattern.confidence * 100)}% 阶段可信度 · {expanded === pattern.id ? "收起" : "查看"}</small>{expanded === pattern.id && <p>{pattern.summary}</p>}</button>)}
        {!repeatedPatterns.length && <div className={stateStyles.empty}><p>{latest ? "已经有一条初始观察；同一主题再次出现后，会在这里升级为可核对的长期模式。" : mode === "guest" ? "第一次保存后先形成初始观察；登录后可跨设备持续更新。" : "第一次保存后先形成初始观察，后续记录会逐步形成长期模式。"}</p></div>}
      </article>
    </section>

    <section className={styles.timeline}>
      <header><div><p>MEMORY TIMELINE</p><h2>镜像时间线</h2></div><div className={styles.filters}><Funnel />{(["all", "career", "relationship"] as const).map((value) => <button className={filter === value ? styles.selected : ""} onClick={() => setFilter(value)} key={value}>{value === "all" ? "全部" : value === "career" ? "事业与行动" : "关系"}</button>)}</div></header>
      <div className={styles.timelineList}>{visibleEvents.map((event, index) => <article key={event.id}><div className={styles.node}><i /><span /></div><time><CalendarBlank />{new Date(event.savedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</time><div><small>MIRROR MOMENT {String(events.length - index).padStart(2, "0")} · {event.sourceLabel ?? "六爻镜像"}</small><h3>{event.question}</h3><p>{event.reflection?.shareableReflection ?? event.reflection?.shiguangInterpretation ?? "一次值得被记住的观察。"}</p><span>{sourceStart(event)} → {sourceEnd(event)}</span></div></article>)}</div>
      {mode !== "loading" && !visibleEvents.length && <div className={stateStyles.timelineEmpty}>{events.length ? "这个分类下还没有镜像记录。" : "保存第一次今日镜像后，时间线会从这里开始。"}</div>}
    </section>
    <AppBottomNav active="mirror" />
  </main>;
}
