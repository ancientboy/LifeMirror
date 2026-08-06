"use client";

import { Aperture, ArrowRight, Brain, ClockCounterClockwise, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./ShiguangHome.module.css";
import { AccountDataSync } from "./AccountDataSync";
import { getSavedBirthProfile } from "@/lib/birth-profile";

type DailyGuidance = { theme: string; reason: string; action: string; sources: string[] };
type MirrorHistoryItem = { question?: string; savedAt?: string; source?: string; sourceLabel?: string; reflection?: { shareableReflection?: string; shiguangInterpretation?: string; traditionalJudgment?: string } };

const fallbackDaily: DailyGuidance[] = [
  { theme: "今天先处理最消耗你的那一件。", reason: "有些疲惫不是事情太多，而是一个悬着的问题一直占着注意力。", action: "给它留十分钟：推进一步，或明确今天先不处理。", sources: ["今日节律"] },
  { theme: "今天不必把所有答案一次想完。", reason: "当现实信息还不完整时，继续推演只会让心里更吵。", action: "只确认下一步需要的一个事实。", sources: ["今日节律"] },
  { theme: "今天适合把感受和事实分开。", reason: "你在意的事值得认真对待，但不必让最坏的猜测先替现实下结论。", action: "写下一句已发生的事实，再决定是否回应。", sources: ["今日节律"] },
];

function extractJson(text: string): unknown {
  const source = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("missing_json");
  return JSON.parse(source.slice(start, end + 1));
}

function cleanDaily(value: unknown, fallback: DailyGuidance): DailyGuidance {
  if (!value || typeof value !== "object") return fallback;
  const item = value as Record<string, unknown>;
  const text = (key: string, base: string, max: number) => typeof item[key] === "string" && item[key].trim().length >= 4 ? [...item[key].trim()].slice(0, max).join("") : base;
  const allowed = new Set(["个人底图", "今日节律", "近期对话", "近期镜像"]);
  const sources = Array.isArray(item.sources) ? item.sources.filter((source): source is string => typeof source === "string" && allowed.has(source)).slice(0, 3) : [];
  return { theme: text("theme", fallback.theme, 52), reason: text("reason", fallback.reason, 120), action: text("action", fallback.action, 80), sources: sources.length ? sources : fallback.sources };
}

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export function ShiguangHome() {
  const [ready, setReady] = useState(false);
  const [latestQuestion, setLatestQuestion] = useState("");
  const [followUpDue, setFollowUpDue] = useState(false);
  const [daily, setDaily] = useState<DailyGuidance>(fallbackDaily[0]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [hasBirthProfile, setHasBirthProfile] = useState(false);

  const dateLabel = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date());
  const dayIndex = Math.floor(Date.now() / 86_400_000) % fallbackDaily.length;

  function seedChat(text: string) {
    window.dispatchEvent(new CustomEvent("life-mirror:chat-seed", { detail: text }));
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 0);
  }

  function enterAsGuest() {
    window.localStorage.setItem("life-mirror:guest-session:v1", "active");
    setReady(true);
  }

  useEffect(() => {
    try {
      const history = JSON.parse(window.localStorage.getItem("life-mirror:guest-history:v1") ?? "[]") as MirrorHistoryItem[];
      setLatestQuestion(history[0]?.question?.trim() ?? "");
      const savedAt = history[0]?.savedAt ? Date.parse(history[0].savedAt) : Number.NaN;
      setFollowUpDue(Number.isFinite(savedAt) && Date.now() - savedAt >= 3 * 86_400_000);
      const profile = getSavedBirthProfile();
      setHasBirthProfile(Boolean(profile));
      const base = fallbackDaily[dayIndex];
      setDaily(base);
      const context = JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        birthProfile: profile ? { year: profile.year, month: profile.month, day: profile.day, timeKnown: !profile.unknownTime, place: profile.place } : null,
        recentMirror: history[0] ? { question: history[0].question, source: history[0].sourceLabel ?? history[0].source, summary: history[0].reflection?.shiguangInterpretation ?? history[0].reflection?.shareableReflection } : null,
        instruction: "将盘面与近期材料消化成日常语言；不要在正文罗列塔罗牌名、卦名、四柱或相位术语。",
      });
      void fetch("/api/shiguang", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "daily_guidance", theme: "east", context, messages: [{ role: "user", content: "生成我今天的个人导航。" }] }) })
        .then(async (response) => { if (!response.ok) throw new Error("daily_unavailable"); setDaily(cleanDaily(extractJson(await response.text()), base)); })
        .catch(() => setDaily({ ...base, sources: history[0] ? ["近期镜像", "今日节律"] : ["今日节律"] }))
        .finally(() => setDailyLoading(false));
    } catch { setDaily(fallbackDaily[dayIndex]); setDailyLoading(false); }
    const hasGuestSession = window.localStorage.getItem("life-mirror:guest-session:v1") === "active";
    fetch("/api/v1/auth/session", { credentials: "include" })
      .then((response) => { if (!response.ok) throw new Error("signed_out"); window.localStorage.removeItem("life-mirror:guest-session:v1"); setReady(true); })
      .catch(() => setReady(hasGuestSession));
  }, []);

  useEffect(() => {
    const continuation = new URLSearchParams(window.location.search).get("continue");
    if (continuation) window.setTimeout(() => seedChat(continuation), 180);
  }, []);

  if (!ready) return <main className={styles.gate}><Aperture weight="thin" /><h1>直接和拾光聊聊。</h1><p>无需注册。游客记录只留在当前设备，之后也可以再登录同步。</p><button type="button" onClick={enterAsGuest}>以游客身份继续 <ArrowRight /></button><Link href="/app/">登录或创建账户</Link></main>;

  return <main className={styles.shell}>
    <AccountDataSync />
    <header className={styles.topbar}>
      <div className={styles.identity}><img src={assetPath("/characters/shiguang/shiguang-east-chibi-v2.png")} alt="Q版东方拾光" /><span><b>拾光</b><small><i /> 日常对话</small></span></div>
      <Link href="/app/profile/#memory"><Brain /><span>记忆</span></Link>
    </header>
    <section className={styles.today} aria-busy={dailyLoading}>
      <div className={styles.dailyCopy}><small><Sparkle /> {dateLabel} · 你的今日导航</small><h1>{daily.theme}</h1><p>{daily.reason}</p><div className={styles.dailyAction}><b>今天的小动作</b><span>{daily.action}</span></div><details><summary>查看这条内容的依据</summary><div className={styles.sources}>{daily.sources.map((source) => <span key={source}>{source}</span>)}</div><p>{hasBirthProfile ? "结合你保存的个人底图、今天的时间节律与近期上下文生成。塔罗只在你近期主动使用过时作为补充。" : "目前主要依据今天的时间节律与近期上下文。补充出生资料后，会加入命盘与本命星盘的长期底图。"}</p>{!hasBirthProfile && <Link href="/app/profile/birth/">补充出生资料 <ArrowRight /></Link>}</details></div>
      <div className={styles.checkIn}><small>10 秒告诉拾光，你现在怎样？</small><span>{["紧绷", "犹豫", "期待", "疲惫"].map((mood) => <button type="button" key={mood} onClick={() => seedChat(`我今天有点${mood}。${latestQuestion ? `可能还和“${latestQuestion}”有关。` : ""}`)}>{mood}</button>)}</span></div>
    </section>
    {latestQuestion && followUpDue && <aside className={styles.followUp}><ClockCounterClockwise /><span><small>拾光在等一次回访</small><b>{latestQuestion}</b><p>三天前的这件事，后来怎么样了？只要点一个状态，拾光会从这里接着理解你。</p><div>{["更好", "没变", "更糟"].map((state) => <button type="button" key={state} onClick={() => seedChat(`关于“${latestQuestion}”，现在是${state}。`)}>{state}</button>)}</div></span></aside>}
    <section className={styles.chatSection}><ShiguangChat mode="home" theme="east" context={`这是 LifeMirror 的常规聊天首页。用户尚未选择具体工具。先自然回应近况；只有在确实有帮助时，才建议六爻、命盘、塔罗或占星中的一个，并说明为什么。不要强迫用户做测试。${latestQuestion ? `用户上次保存的问题是「${latestQuestion}」。如果用户愿意回顾，先问后来发生了什么，不要重新起卦。` : ""}`} opening={latestQuestion ? `我还记得你上次在意的是“${latestQuestion}”。后来有什么变化吗？` : "我在。你可以直接从此刻最想说的那件事开始。"} /></section>
    <AppBottomNav active="home" />
  </main>;
}
