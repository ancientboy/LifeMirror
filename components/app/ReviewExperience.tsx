"use client";

import { ArrowLeft, Check, CircleNotch, ClockCounterClockwise, Eye, EyeSlash, SignOut, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./ReviewExperience.module.css";

type Review = { cadence: "weekly" | "monthly"; status: "ready" | "insufficient_evidence"; summary: string; themes: Array<{ name: string; signalCount: number; evidenceIds: string[] }>; changes: Array<{ description: string; evidenceIds: string[] }>; reflectionQuestions: string[]; gentleSuggestions: string[]; evidence: Array<{ id: string; occurredAt: string; title: string; summary: string }>; trust: { confidence: number; evidenceCount: number; limitations: string[] } };
type Preferences = { enabled: boolean; weeklyEnabled: boolean; monthlyEnabled: boolean; cooldownHours: number };
type Session = { authenticated: boolean; user?: { email: string } };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/$/, "");

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...init, credentials: "include", headers: { "content-type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error ?? `request_failed_${response.status}`);
  return body as T;
}

export function ReviewExperience() {
  const [cadence, setCadence] = useState<"weekly" | "monthly">("weekly");
  const [review, setReview] = useState<Review | null>(null);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const session = await api<Session>("/api/v1/auth/session");
      setEmail(session.user?.email ?? "私人镜像");
      const [reviewData, preferenceData] = await Promise.all([
        api<{ review: Review }>(`/api/v1/reviews?cadence=${cadence}&timezone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`),
        api<{ preferences: Preferences }>("/api/v1/proactive-reflections/preferences"),
      ]);
      setReview(reviewData.review); setPrefs(preferenceData.preferences);
    } catch (cause) {
      if (cause instanceof Error && (cause.message === "authentication_required" || cause.message === "request_failed_401")) window.location.href = "/app/";
      else setError("暂时无法载入回顾，请稍后再试。");
    } finally { setBusy(false); }
  }, [cadence]);

  useEffect(() => { void load(); }, [load]);

  async function update(next: Preferences) {
    setPrefs(next); setSaved(false); setError("");
    try {
      const result = await api<{ preferences: Preferences }>("/api/v1/proactive-reflections/preferences", { method: "PATCH", body: JSON.stringify(next) });
      setPrefs(result.preferences); setSaved(true);
    } catch { setError("设置未保存，请稍后再试。"); }
  }

  async function signOut() {
    try { await api("/api/v1/auth/logout", { method: "POST" }); } finally { window.location.href = "/app/"; }
  }

  return <main className={styles.shell}><div className={styles.ambient}/><header><Link href="/app/"><ArrowLeft/>返回探索大厅</Link><div><span>{email}</span><button type="button" onClick={() => void signOut()} aria-label="退出登录"><SignOut/></button></div></header><section className={styles.hero}><div><small>REVIEW MODE · 有来源的阶段性线索</small><h1>你的周期回顾</h1><p>只呈现你已保存记录里的变化，不把少量线索说成确定结论。</p></div><nav aria-label="选择回顾周期"><button aria-pressed={cadence === "weekly"} onClick={() => setCadence("weekly")}>这一周</button><button aria-pressed={cadence === "monthly"} onClick={() => setCadence("monthly")}>这个月</button></nav></section>{busy ? <div className={styles.loading}><CircleNotch/>正在整理可追溯的线索…</div> : error ? <div className={styles.error} role="alert">{error}</div> : review && <div className={styles.grid}><section className={styles.reviewCard}><div className={styles.cardTitle}><ClockCounterClockwise/><span><small>{review.trust.evidenceCount} 条证据</small><b>{Math.round(review.trust.confidence * 100)}% 阶段置信度</b></span></div><h2>{review.status === "ready" ? "这一段时间，你在关注什么" : "还需要更多记录"}</h2><p>{review.summary}</p>{review.themes.length > 0 && <div className={styles.chips}>{review.themes.map(theme => <span key={theme.name}>{theme.name} · {theme.signalCount}</span>)}</div>}{review.changes.map(change => <article key={change.description}><Sparkle/><p>{change.description}</p><small>{change.evidenceIds.length} 条记录支持</small></article>)}{review.trust.limitations.map(item => <div className={styles.limit} key={item}>{item}</div>)}<button className={styles.evidenceToggle} onClick={() => setEvidenceOpen(!evidenceOpen)}>{evidenceOpen ? <EyeSlash/> : <Eye/>}{evidenceOpen ? "收起证据" : "展开证据与来源"}</button>{evidenceOpen && <div className={styles.evidence}>{review.evidence.map(item => <details key={item.id}><summary>{new Date(item.occurredAt).toLocaleDateString("zh-CN")} · {item.title}</summary><p>{item.summary}</p></details>)}</div>}</section><aside><section className={styles.settings}><small>PROACTIVE REFLECTION</small><h2>主动反思设置</h2><p>建议只是邀请，不是通知压力。你可以关闭或调整频率。</p>{prefs && <><label><span>允许主动建议</span><input type="checkbox" checked={prefs.enabled} onChange={event => void update({ ...prefs, enabled: event.target.checked })}/></label><label><span>周度回顾</span><input type="checkbox" checked={prefs.weeklyEnabled} disabled={!prefs.enabled} onChange={event => void update({ ...prefs, weeklyEnabled: event.target.checked })}/></label><label><span>月度回顾</span><input type="checkbox" checked={prefs.monthlyEnabled} disabled={!prefs.enabled} onChange={event => void update({ ...prefs, monthlyEnabled: event.target.checked })}/></label><label><span>建议冷却时间</span><select value={prefs.cooldownHours} disabled={!prefs.enabled} onChange={event => void update({ ...prefs, cooldownHours: Number(event.target.value) })}><option value={72}>3 天</option><option value={168}>7 天</option><option value={336}>14 天</option><option value={720}>30 天</option></select></label>{saved && <div className={styles.saved}><Check/>已保存</div>}</>}</section>{review.reflectionQuestions.length > 0 && <section className={styles.questions}><small>留给此刻的问题</small>{review.reflectionQuestions.map(item => <p key={item}>{item}</p>)}</section>}{review.gentleSuggestions.length > 0 && <section className={styles.questions}><small>温和行动建议</small>{review.gentleSuggestions.map(item => <p key={item}>{item}</p>)}</section>}</aside></div>}</main>;
}
