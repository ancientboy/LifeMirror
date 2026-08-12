"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarBlank, Check, CircleNotch, Funnel, Heart, LockKey, Sparkle, Trash, TrendUp, UserPlus } from "@phosphor-icons/react";
import styles from "./PersonalMirrorDashboard.module.css";
import lifeStyles from "./PersonalMirrorLife.module.css";
import stateStyles from "./PersonalMirrorDashboardState.module.css";
import { AppBottomNav } from "./AppBottomNav";
import { AccountDataSync } from "./AccountDataSync";
import { ACCOUNT_DATA_CHANGED_EVENT, writeLocalAccountData, type AccountSnapshot } from "@/lib/account-data";
import { getLatestSavedNatalMirrors, type SavedNatalMirror } from "@/lib/natal-mirror-history";
import { deleteMirrorHistory, updateMirrorHistory } from "@/lib/mirror-history";
import { deletePrivatePerson, deleteRelationshipLoop, getPrivatePeople, getRelationshipArchive, getRelationshipLoopMetrics, getRelationshipLoops, getRelationshipLoopsForPerson, reportRelationshipLoop, savePrivatePerson, type PrivatePerson, type RelationshipLoop } from "@/lib/relationship-context";
import { RelationshipSandbox } from "./RelationshipSandbox";
import { PersonMirror } from "./PersonMirror";

type MirrorEvent = { id: string; question: string; savedAt: string; source?: "tarot" | "bazi" | "astrology"; sourceLabel?: string; meta?: string; important?: boolean; personId?: string; personName?: string; openLoopStatus?: "open" | "resolved" | "unknown"; hexagram?: { originalHexagram?: { name?: string }; changedHexagram?: { name?: string } }; reflection?: { shareableReflection?: string; practicalGuidance?: string; shiguangInterpretation?: string } };
type PatternMemory = { id: string; title: string; summary: string; signalCount: number; confidence: number };
type DashboardMode = "loading" | "guest" | "authenticated";
type EffectLoopSummary = { rehearsalsStarted: number; followupsSeen: number; actionsTaken: number; feedbackReported: number; repeatPracticePeople: number; actionRate: number; feedbackCompletionRate: number };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const HISTORY_KEY = "life-mirror:guest-history:v1";

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error ?? `request_failed_${response.status}`);
  return body as T;
}

/** Account data and effect telemetry live with the Sites session/D1, not the optional analysis API. */
async function accountApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error ?? `request_failed_${response.status}`);
  return body as T;
}

function readGuestEvents(): MirrorEvent[] {
  try { return (JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]") as MirrorEvent[]).slice(0, 20); }
  catch { return []; }
}

function normalizeServerTimeline(items: Array<MirrorEvent & { occurredAt?: string; summary?: string; title?: string; triggerText?: string }>): MirrorEvent[] {
  return items.map((item) => ({
    ...item,
    question: item.question ?? item.triggerText ?? item.title ?? "一次已记录的镜像",
    savedAt: item.savedAt ?? item.occurredAt ?? new Date().toISOString(),
    reflection: item.reflection ?? { shiguangInterpretation: item.summary },
    sourceLabel: item.sourceLabel ?? "已记录的镜像",
  }));
}

const lifeFields = [
  { key: "self", title: "我如何成为我", subtitle: "外在表达、核心驱动力与个人节奏", match: /自我|性格|我自己|表达|状态/, fallback: "先从你的出生镜像开始，观察你想怎样被看见、又如何确认自己。" },
  { key: "emotion", title: "情绪与安全感", subtitle: "压力反应、恢复方式与真正需要", match: /焦虑|压力|难过|疲惫|害怕|情绪|失眠/, fallback: "还没有足够的当下记录；下一次情绪明显时，试着把当时发生的事也留下一句。" },
  { key: "relationship", title: "爱情与亲密关系", subtitle: "靠近、回应、边界与连接方式", match: /关系|感情|伴侣|朋友|家人|对方|彼此|爱|复合/, fallback: "关系不是“合不合”的单选题；先看你在连接里最需要被怎样回应。" },
  { key: "career", title: "事业与天赋", subtitle: "工作方式、成就感与长期方向", match: /工作|职业|事业|创业|项目|面试|升职|方向/, fallback: "事业镜像会同时看你的长期节奏，和眼下这一步真正卡在哪里。" },
  { key: "value", title: "金钱与价值感", subtitle: "安全感、资源、交换与自我认可", match: /钱|收入|消费|价值|资源|报酬/, fallback: "这不只关乎钱，也关乎你愿意为自己留出怎样的空间与选择。" },
  { key: "growth", title: "家庭、人际与成长", subtitle: "归属、社群与正在展开的人生方向", match: /家庭|父母|孩子|朋友|社群|成长|学习|未来/, fallback: "你不必马上定义未来；持续留下经历，方向会在反复出现的选择里慢慢显影。" },
] as const;

function natalSummary(kind: "bazi" | "astrology", mirror?: SavedNatalMirror) {
  if (!mirror) return null;
  if (kind === "astrology") {
    const result = mirror.result as { headline?: string; themes?: string[] };
    return result.headline ?? result.themes?.[0] ?? "星盘已读入，等待与你的真实经历一起核对。";
  }
  const result = mirror.result as { fiveElementProfile?: { dayMaster?: string; dayMasterElement?: string; strengthBand?: string } };
  const profile = result.fiveElementProfile;
  return profile?.dayMaster ? `${profile.dayMaster}日主 · ${profile.dayMasterElement} · 初步${profile.strengthBand}。命盘已读入，等待与你的真实经历一起核对。` : "命盘已读入，等待与你的真实经历一起核对。";
}

export function PersonalMirrorDashboard() {
  const [mode, setMode] = useState<DashboardMode>("loading");
  const [events, setEvents] = useState<MirrorEvent[]>([]);
  const [patterns, setPatterns] = useState<PatternMemory[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "career" | "relationship">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [natalMirrors, setNatalMirrors] = useState<Partial<Record<"bazi" | "astrology", SavedNatalMirror>>>({});
  const [people, setPeople] = useState<PrivatePerson[]>([]);
  const [relationshipLoops, setRelationshipLoops] = useState<RelationshipLoop[]>([]);
  const [reviewingLoopId, setReviewingLoopId] = useState<string | null>(null);
  const [loopOutcome, setLoopOutcome] = useState<RelationshipLoop["outcome"]>();
  const [loopReflection, setLoopReflection] = useState("");
  const [personDraft, setPersonDraft] = useState({ displayName: "", relationshipType: "", userDescription: "", communicationNotes: "" });
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [relationshipNotice, setRelationshipNotice] = useState("");
  const [sandboxPerson, setSandboxPerson] = useState<PrivatePerson | null>(null);
  const [mirrorPerson, setMirrorPerson] = useState<PrivatePerson | null>(null);
  const [expandedRelationshipArchive, setExpandedRelationshipArchive] = useState<string | null>(null);
  const [effectLoopSummary, setEffectLoopSummary] = useState<EffectLoopSummary | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await api<{ authenticated: boolean }>("/api/v1/auth/session");
        if (!active) return;
        const summary = await api<{ timeline?: MirrorEvent[]; recentPatterns?: PatternMemory[] }>("/api/v1/memories/summary").catch(() => null);
        if (!active) return;
        // A signed-in account must never be silently replaced by stale device history.
        setEvents(normalizeServerTimeline(summary?.timeline ?? []));
        setPatterns(summary?.recentPatterns ?? []);
        setMode("authenticated");
        const effect = await accountApi<{ summary: EffectLoopSummary }>("/api/v1/account/effect-loop/summary").catch(() => null);
        if (active) setEffectLoopSummary(effect?.summary ?? null);
      } catch (cause) {
        if (!active) return;
        const code = cause instanceof Error ? cause.message : "";
        setEvents(readGuestEvents()); setPatterns([]); setMode("guest");
        if (code !== "authentication_required") setError("暂时无法连接个人镜像，当前显示此设备保存的记录。");
      }
    }
    void load();
    const refresh = () => {
      setNatalMirrors(getLatestSavedNatalMirrors()); setPeople(getPrivatePeople()); setRelationshipLoops(getRelationshipLoops());
      void load();
    };
    setNatalMirrors(getLatestSavedNatalMirrors());
    setPeople(getPrivatePeople());
    setRelationshipLoops(getRelationshipLoops());
    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, refresh);
    return () => { active = false; window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, refresh); };
  }, []);

  const visibleEvents = useMemo(() => events.filter((event) => filter === "all" || (filter === "career" ? /职业|工作|事业|选择|开始|行动/.test(event.question) : /关系|彼此|感情|伴侣|家庭/.test(event.question))), [events, filter]);
  const latest = events[0];
  const repeatedPatterns = mode === "authenticated" ? patterns.filter((pattern) => pattern.signalCount >= 2) : [];
  const sourceStart = (event: MirrorEvent) => event.sourceLabel ?? event.hexagram?.originalHexagram?.name ?? "镜像";
  const sourceEnd = (event: MirrorEvent) => event.meta ?? event.hexagram?.changedHexagram?.name ?? "成长";
  const natalCards = [
    { key: "astrology", label: "星盘 · 稳定底图", summary: natalSummary("astrology", natalMirrors.astrology), href: "/app/astrology/" },
    { key: "bazi", label: "命盘 · 稳定底图", summary: natalSummary("bazi", natalMirrors.bazi), href: "/app/chart/" },
  ] as const;
  const openLoops = events.filter((event) => event.openLoopStatus === "open");
  const pendingRelationshipLoops = relationshipLoops.filter((loop) => loop.status === "awaiting_action");
  const loopMetrics = getRelationshipLoopMetrics();
  const reviewingLoop = relationshipLoops.find((loop) => loop.id === reviewingLoopId);

  function followUpTiming(loop: RelationshipLoop) {
    const hours = Math.floor((Date.now() - new Date(loop.createdAt).getTime()) / 3_600_000);
    if (hours >= 72) return "拾光想轻轻问一下：后来怎么样了？";
    if (hours >= 24) return "如果你已经去聊过，点一下就能留下结果。";
    return "等你真的去聊过再回来；不急。";
  }

  function submitRelationshipFeedback(actionTaken: boolean) {
    if (!reviewingLoop) return;
    reportRelationshipLoop(reviewingLoop.id, { actionTaken, outcome: loopOutcome, reflection: loopReflection });
    setRelationshipLoops(getRelationshipLoops());
    setReviewingLoopId(null); setLoopOutcome(undefined); setLoopReflection("");
  }

  async function changeEvent(id: string, patch: Parameters<typeof updateMirrorHistory>[1]) {
    if (mode !== "authenticated") {
      updateMirrorHistory(id, patch);
      setEvents(readGuestEvents());
      return;
    }
    try {
      const response = await accountApi<{ history: MirrorEvent; data: AccountSnapshot }>(`/api/v1/account/history/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch),
      });
      writeLocalAccountData(response.data);
      setEvents((current) => current.map((event) => event.id === id ? { ...event, ...response.history } : event));
    } catch { setError("没有保存这次更改，请稍后重试。"); }
  }

  async function removeEvent(id: string) {
    if (mode !== "authenticated") {
      deleteMirrorHistory(id); setEvents(readGuestEvents()); return;
    }
    try {
      const response = await accountApi<{ data: AccountSnapshot }>(`/api/v1/account/history/${encodeURIComponent(id)}`, { method: "DELETE" });
      writeLocalAccountData(response.data);
      setEvents((current) => current.filter((event) => event.id !== id));
    } catch { setError("没有删除这条记录，请稍后重试。"); }
  }

  function addPerson(event: React.FormEvent) {
    event.preventDefault();
    const person = savePrivatePerson({ ...personDraft, id: editingPersonId ?? undefined });
    if (!person) return;
    setPeople(getPrivatePeople());
    setEditingPersonId(null);
    setPersonDraft({ displayName: "", relationshipType: "", userDescription: "", communicationNotes: "" });
    setRelationshipNotice(editingPersonId ? "这份关系档案已更新。" : "已加入这份私人的关系档案。");
  }

  function beginEditPerson(person: PrivatePerson) {
    setEditingPersonId(person.id);
    setPersonDraft({ displayName: person.displayName, relationshipType: person.relationshipType ?? "", userDescription: person.userDescription ?? "", communicationNotes: person.communicationNotes ?? "" });
    setRelationshipNotice("");
  }

  function removePerson(person: PrivatePerson) {
    const loopCount = getRelationshipLoopsForPerson(person.id).length;
    if (!window.confirm(`删除“${person.displayName}”的档案${loopCount ? `及 ${loopCount} 条互动记录` : ""}？这只会删除你自己的记录。`)) return;
    deletePrivatePerson(person.id);
    setPeople(getPrivatePeople()); setRelationshipLoops(getRelationshipLoops());
    if (editingPersonId === person.id) { setEditingPersonId(null); setPersonDraft({ displayName: "", relationshipType: "", userDescription: "", communicationNotes: "" }); }
    setRelationshipNotice("该人物档案和关联互动已删除，匿名闭环计数也已一并移除。");
  }

  function removeRelationshipRecord(loop: RelationshipLoop) {
    if (!window.confirm("删除这条互动记录？它不会再用于后续的沟通校准。")) return;
    if (!deleteRelationshipLoop(loop.id)) return;
    setRelationshipLoops(getRelationshipLoops());
    setRelationshipNotice("这条互动记录已删除，相关匿名计数也已移除。");
  }

  return <main className={styles.shell}>
    {mode === "authenticated" && <AccountDataSync />}
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}><span>◌</span><b>LIFE MIRROR</b><small>PERSONAL MIRROR</small></Link>
      <nav aria-label="产品导航"><Link href="/app/">今日镜像</Link><Link className={styles.active} href="/mirror/">我的镜像</Link><Link href="/theory/">研究院</Link></nav>
      <span className={styles.private}><LockKey /> {mode === "authenticated" ? "私人空间" : "本地空间"}</span>
    </header>

    <section className={styles.hero}>
      <div><Link href="/app/" className={styles.back}><ArrowLeft /> 返回今日镜像</Link><p>MY CONTEXT · PRIVATE</p><h1>发生过的事，<br /><em>都能在这里找回。</em></h1><span>记录、明确记忆与长期线索各自分开；拾光只在有证据时，才把它们带回给你。</span></div>
      <div className={styles.orbit} aria-label="个人镜像记录概览"><i /><i /><i /><strong>{mode === "loading" ? <CircleNotch className={stateStyles.spin} /> : events.length}<small>镜像时刻</small></strong></div>
    </section>

    {error && <p className={stateStyles.notice}>{error}</p>}
    <section className={lifeStyles.lifeMirror} aria-labelledby="life-mirror-title">
      <header><div><small>YOUR LIFE MIRROR</small><h2 id="life-mirror-title">先看你，再看工具。</h2><p>命盘和星盘回答“你的长期底色”；塔罗与六爻记录“你此刻正在经历什么”。拾光只负责把这些线索放回你的真实生活。</p></div><Link href="/app/home/">从一个问题开始 <ArrowRight /></Link></header>
      <div className={lifeStyles.natalGrid}>{natalCards.map((card) => <article key={card.key}><small>{card.label}</small><p>{card.summary ?? "还没有读入这张稳定底图。完成一次出生资料测算后，它会与之后的镜像一起留在这里。"}</p><Link href={card.href}>{card.summary ? "回看这张盘" : "建立这张盘"} <ArrowRight /></Link></article>)}</div>
      <div className={lifeStyles.lifeFieldGrid}>{lifeFields.map((field) => {
        const event = events.find((item) => field.match.test(item.question));
        const summary = event?.reflection?.shareableReflection ?? event?.reflection?.shiguangInterpretation ?? field.fallback;
        return <article key={field.key}><small>{field.subtitle}</small><h3>{field.title}</h3><p>{summary}</p>{event ? <span>来自 {event.sourceLabel ?? "最近一次镜像"} · {new Date(event.savedAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</span> : <Link href="/app/home/">和拾光从这里聊起 <ArrowRight /></Link>}</article>;
      })}</div>
    </section>
    <section className={styles.contextGrid}>
      <article className={styles.contextCard}>
        <header><span><Sparkle /> 等你回来的一句话</span><small>{pendingRelationshipLoops.length} 项待回访</small></header>
        {pendingRelationshipLoops.length ? <div className={styles.loopList}>{pendingRelationshipLoops.slice(0, 3).map((loop) => { const person = people.find((item) => item.id === loop.personId); return <div key={loop.id}><b>和 {person?.displayName ?? "TA"} 的这次沟通</b><p>{loop.situation}</p><p>{followUpTiming(loop)}</p><span><button onClick={() => { setReviewingLoopId(loop.id); setLoopOutcome(undefined); setLoopReflection(""); }}>回来复盘</button></span></div>; })}</div> : <p className={styles.contextEmpty}>{loopMetrics.rehearsalsStarted ? `你已留下 ${loopMetrics.feedbackReported} 次现实反馈。下一次演练后，拾光会在这里等你。` : "完成一次沟通演练后，拾光会在这里等你带回现实里的结果。"}</p>}
        {reviewingLoop && <div className={styles.loopList}><div><b>这次真的去聊了吗？</b><p>选一个结果就够；可选的一句话只记录这次互动。</p><span>{([['smooth', '顺利'], ['mixed', '一般'], ['rough', '翻车']] as const).map(([value, label]) => <button key={value} className={loopOutcome === value ? styles.marked : ""} onClick={() => setLoopOutcome(value)}>{label}</button>)}</span><textarea value={loopReflection} maxLength={300} onChange={(event) => setLoopReflection(event.target.value)} placeholder="可选：发生了什么？你有什么感受？" /><span><button className={styles.marked} onClick={() => submitRelationshipFeedback(Boolean(loopOutcome))}>记录现实反馈</button><button onClick={() => submitRelationshipFeedback(false)}>这次还没开口</button></span></div></div>}
      </article>
      <article className={styles.contextCard}>
        <header><span><Heart /> 还没结束的事</span><small>{openLoops.length} 件</small></header>
        {openLoops.length ? <div className={styles.loopList}>{openLoops.slice(0, 3).map((event) => <div key={event.id}><b>{event.question}</b><p>{event.personName ? `和 ${event.personName} 有关 · ` : ""}这件事还在等待现实里的新消息。</p><span><button onClick={() => changeEvent(event.id, { openLoopStatus: "resolved" })}><Check /> 已有结果</button><button onClick={() => changeEvent(event.id, { openLoopStatus: "unknown" })}>暂不确定</button></span></div>)}</div> : <p className={styles.contextEmpty}>没有被标记为“未结束”的现实事项。之后遇到仍在等待答案的事，可以在记录里留下它。</p>}
      </article>
      {mode === "authenticated" && <article className={styles.contextCard}>
        <header><span><TrendUp /> 效果闭环</span><small>仅记录匿名化动作</small></header>
        {effectLoopSummary ? <div className={styles.effectSummary}><p>这里不保存你们聊了什么，也不记录 TA 的信息；只用于确认“演练有没有真的回到现实”。</p><div><span><b>{effectLoopSummary.rehearsalsStarted}</b><small>发起演练</small></span><span><b>{effectLoopSummary.actionsTaken}</b><small>带去行动</small></span><span><b>{effectLoopSummary.feedbackReported}</b><small>带回反馈</small></span></div>{effectLoopSummary.rehearsalsStarted > 0 && <p>闭环完成率 {Math.round(effectLoopSummary.feedbackCompletionRate * 100)}% · 已有 {effectLoopSummary.repeatPracticePeople} 段关系进行了第二次演练。</p>}</div> : <p className={styles.contextEmpty}>正在读取你的闭环进展。</p>}
      </article>}
      <article className={styles.contextCard}>
        <header><span><UserPlus /> 我在意的人</span><small>只保存你的视角</small></header>
        {people.length ? <div className={styles.peopleList}>{people.map((person) => { const archive = getRelationshipArchive(person.id); const interactions = getRelationshipLoopsForPerson(person.id); const expanded = expandedRelationshipArchive === person.id; return <div key={person.id}><span><b>{person.displayName}</b><small>{person.relationshipType || "关系未说明"}</small></span><p>{person.userDescription || person.communicationNotes || "还没有写下你的观察。"}</p><div className={styles.personActions}><button type="button" onClick={() => setMirrorPerson(person)}><Sparkle />进入 TA 的镜像</button><button type="button" onClick={() => setSandboxPerson(person)}>快速演练</button><button type="button" className={styles.archiveButton} onClick={() => setExpandedRelationshipArchive(expanded ? null : person.id)}>{expanded ? "收起档案" : "关系档案"}</button><button type="button" onClick={() => beginEditPerson(person)}>编辑</button><button aria-label={`删除 ${person.displayName}`} onClick={() => removePerson(person)}><Trash /></button></div>{expanded && <section className={styles.relationshipArchive}><small>你的现实反馈 · 不代表 TA 的人格或内心</small><p className={styles.archiveSummary}>{archive.summary}</p><div className={styles.archiveAdjustment}><b>拾光这次更新了什么</b><p>{archive.visibleAdjustment}</p></div>{archive.awaitingFeedback > 0 && <p className={styles.archivePending}>还有 {archive.awaitingFeedback} 次演练等你带回结果。</p>}{interactions.length > 0 && <div className={styles.archiveEvidence}><b>互动记录</b>{interactions.map((loop) => <article key={loop.id}><span>{loop.status === "awaiting_action" ? "待回访" : loop.actionTaken ? ({ smooth: "顺利", mixed: "一般", rough: "翻车" } as const)[loop.outcome ?? "mixed"] : "未行动"}</span><div><strong>{loop.situation || "一次沟通"}</strong>{loop.reflection && <p>“{loop.reflection}”</p>}<small>{new Date(loop.reportedAt ?? loop.createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</small></div><button type="button" aria-label={`删除互动记录：${loop.situation}`} onClick={() => removeRelationshipRecord(loop)}><Trash /></button></article>)}</div>}</section>}</div>; })}</div> : <p className={styles.contextEmpty}>先留住一个你想理解的人。这里记录的是你的体验，不会把它当作对方的真实人格。</p>}
        {relationshipNotice && <p className={styles.relationshipNotice} role="status">{relationshipNotice}</p>}
        <form className={styles.personForm} onSubmit={addPerson}><b>{editingPersonId ? "编辑这份关系档案" : "加入一位我在意的人"}</b><input required value={personDraft.displayName} onChange={(event) => setPersonDraft({ ...personDraft, displayName: event.target.value })} placeholder="TA 的昵称" /><input value={personDraft.relationshipType} onChange={(event) => setPersonDraft({ ...personDraft, relationshipType: event.target.value })} placeholder="和我的关系（可选）" /><textarea value={personDraft.userDescription} onChange={(event) => setPersonDraft({ ...personDraft, userDescription: event.target.value })} placeholder="在这段关系里，我观察到……（可选）" maxLength={300} /><textarea value={personDraft.communicationNotes} onChange={(event) => setPersonDraft({ ...personDraft, communicationNotes: event.target.value })} placeholder="我希望怎样沟通、哪些边界要留意（可选）" maxLength={300} /><span><button type="submit">{editingPersonId ? "保存修改" : "加入人物"}</button>{editingPersonId && <button type="button" className={styles.cancelEdit} onClick={() => { setEditingPersonId(null); setPersonDraft({ displayName: "", relationshipType: "", userDescription: "", communicationNotes: "" }); }}>取消</button>}</span></form>
      </article>
    </section>
    <section className={styles.grid}>
      <article className={`${styles.card} ${styles.current}`}>
        <header><span><Sparkle /> 当前反思</span><small>{latest ? new Date(latest.savedAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" }) : "等待第一次记录"}</small></header>
        {latest ? <><h2>{latest.question}</h2><blockquote>“{latest.reflection?.shareableReflection ?? latest.reflection?.shiguangInterpretation ?? "一次值得被记住的观察。"}”</blockquote><div><span>{sourceStart(latest)}</span><ArrowRight /><span>{sourceEnd(latest)}</span></div></> : <div className={stateStyles.empty}><h2>你的镜像还在等待第一束光。</h2><p>完成并保存一次今日镜像后，它会出现在这里。</p></div>}
        <Link href="/app/">{latest ? "开启新的今日镜像" : "开始第一次今日镜像"} <ArrowRight /></Link>
      </article>

      <article className={`${styles.card} ${styles.dna}`}>
        <header><span><Sparkle /> 拾光记得</span><small>只保留你明确授权的事实</small></header>
        <div className={stateStyles.empty}><h2>你的明确偏好和确认过的事，会在这里出现。</h2><p>镜像结果与聊天记录不会自动被当作人格事实；你随时可以在“我的”中更正或删除。</p></div>
      </article>

      <article className={`${styles.card} ${styles.patterns}`}>
        <header><span>最近的变化</span><small>只在多条真实证据支持时显示</small></header>
        {repeatedPatterns.map((pattern) => <button key={pattern.id} onClick={() => setExpanded(expanded === pattern.id ? null : pattern.id)} className={styles.pattern}><b>{pattern.title}</b><small>{pattern.signalCount} 条可追溯记录 · {expanded === pattern.id ? "收起" : "查看"}</small>{expanded === pattern.id && <p>{pattern.summary}</p>}</button>)}
        {!repeatedPatterns.length && <div className={stateStyles.empty}><p>{mode === "authenticated" ? "还没有足够的独立现实证据形成长期线索。" : "登录后，这里只会显示可纠正、可追溯的长期线索。"}</p></div>}
      </article>
    </section>

    <section className={styles.timeline}>
      <header><div><p>MEMORY TIMELINE</p><h2>镜像时间线</h2></div><div className={styles.filters}><Funnel />{(["all", "career", "relationship"] as const).map((value) => <button className={filter === value ? styles.selected : ""} onClick={() => setFilter(value)} key={value}>{value === "all" ? "全部" : value === "career" ? "事业与行动" : "关系"}</button>)}</div></header>
      <div className={styles.timelineList}>{visibleEvents.map((event, index) => <article key={event.id}><div className={styles.node}><i /><span /></div><time><CalendarBlank />{new Date(event.savedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</time><div><small>MIRROR MOMENT {String(events.length - index).padStart(2, "0")} · {event.sourceLabel ?? "六爻镜像"}</small><h3>{event.question}</h3><p>{event.reflection?.shareableReflection ?? event.reflection?.shiguangInterpretation ?? "一次值得被记住的观察。"}</p><span>{sourceStart(event)} → {sourceEnd(event)}</span><div className={styles.recordActions}><button className={event.important ? styles.marked : ""} onClick={() => void changeEvent(event.id, { important: !event.important })}><Heart />{event.important ? "已标记重要" : "标记重要"}</button><select aria-label="关联到人物" value={event.personId ?? ""} onChange={(change) => { const person = people.find((item) => item.id === change.target.value); void changeEvent(event.id, { personId: person?.id, personName: person?.displayName }); }}><option value="">关联到某人</option>{people.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select><button className={event.openLoopStatus === "open" ? styles.marked : ""} onClick={() => void changeEvent(event.id, { openLoopStatus: event.openLoopStatus === "open" ? "unknown" : "open" })}>{event.openLoopStatus === "open" ? "等待现实进展" : "标为未结束"}</button><button className={styles.deleteRecord} onClick={() => void removeEvent(event.id)} aria-label={`删除记录：${event.question}`}><Trash /></button></div></div></article>)}</div>
      {mode !== "loading" && !visibleEvents.length && <div className={stateStyles.timelineEmpty}>{events.length ? "这个分类下还没有镜像记录。" : "保存第一次今日镜像后，时间线会从这里开始。"}</div>}
    </section>
    <AppBottomNav active="mirror" />
    {sandboxPerson && <RelationshipSandbox person={sandboxPerson} onClose={() => setSandboxPerson(null)} />}
    {mirrorPerson && <PersonMirror person={mirrorPerson} onClose={() => setMirrorPerson(null)} onPractice={(person) => { setMirrorPerson(null); setSandboxPerson(person); }} />}
  </main>;
}
