"use client";

import { Aperture, ArrowRight, Brain, ClockCounterClockwise, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./ShiguangHome.module.css";
import { AccountDataSync } from "./AccountDataSync";
import { getSavedBirthProfile } from "@/lib/birth-profile";
import { buildDailyGuidanceContext, sanitizeDailyGuidance, type DailyEvidence, type DailyGuidance, type DailyGuidanceContext } from "@/lib/daily-guidance";

type MirrorHistoryItem = { question?: string; savedAt?: string; source?: string; sourceLabel?: string; reflection?: { shareableReflection?: string; shiguangInterpretation?: string; traditionalJudgment?: string } };

const stateFallbacks: DailyGuidance[] = [
  { theme: "今天先处理最消耗你的那一件。", reason: "先给眼前最悬着的事一个明确的位置，注意力才会慢慢回来。", action: "给它留十分钟：推进一步，或明确今天先不处理。", sources: ["近期状态"] },
  { theme: "今天不必把所有答案一次想完。", reason: "信息还不完整时，先确认下一步，比反复推演更有用。", action: "只确认下一步需要的一个事实。", sources: ["近期状态"] },
  { theme: "今天适合把感受和事实分开。", reason: "你在意的事值得认真对待，但先看已经发生了什么，会更容易找到落点。", action: "写下一句已发生的事实，再决定是否回应。", sources: ["近期状态"] },
];

function fallbackFor(context: DailyGuidanceContext, index: number): DailyGuidance {
  const base = stateFallbacks[index];
  if (context.mode === "daily_state_note") return { ...base, sources: context.evidence.map((item) => item.label).slice(0, 3) };
  const transit = context.evidence.find((item) => item.label === "今日行运")?.detail ?? "今天的盘面变化";
  return {
    theme: "今天先把注意力放回可确认的一步。",
    reason: `本次参考了你的本命底图与${transit}；先用现实行动验证感受，比急着扩大判断更稳。`,
    action: "选一件最在意的事，只完成它的下一步。",
    sources: context.evidence.map((item) => item.label).slice(0, 3),
  };
}

function extractJson(text: string): unknown {
  const source = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("missing_json");
  return JSON.parse(source.slice(start, end + 1));
}

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export function ShiguangHome() {
  const [ready, setReady] = useState(false);
  const [latestQuestion, setLatestQuestion] = useState("");
  const [followUpDue, setFollowUpDue] = useState(false);
  const [daily, setDaily] = useState<DailyGuidance>(stateFallbacks[0]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyMode, setDailyMode] = useState<DailyGuidanceContext["mode"]>("daily_state_note");
  const [dailyEvidence, setDailyEvidence] = useState<DailyEvidence[]>([]);

  const dateLabel = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date());
  const dayIndex = Math.floor(Date.now() / 86_400_000) % stateFallbacks.length;

  function seedChat(text: string) {
    window.dispatchEvent(new CustomEvent("life-mirror:chat-seed", { detail: text }));
    document.getElementById("shiguang-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 240);
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
      const dailyContext = buildDailyGuidanceContext(profile, history);
      const base = fallbackFor(dailyContext, dayIndex);
      setDaily(base);
      setDailyMode(dailyContext.mode);
      setDailyEvidence(dailyContext.evidence);
      const context = JSON.stringify(dailyContext.modelContext);
      void fetch("/api/shiguang", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "daily_guidance", theme: "east", context, messages: [{ role: "user", content: "生成我今天的个人导航。" }] }) })
        .then(async (response) => { if (!response.ok) throw new Error("daily_unavailable"); setDaily(sanitizeDailyGuidance(extractJson(await response.text()), base, dailyContext.evidence)); })
        .catch(() => setDaily(base))
        .finally(() => setDailyLoading(false));
    } catch { setDaily(stateFallbacks[dayIndex]); setDailyMode("daily_state_note"); setDailyLoading(false); }
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
    <section className={styles.welcome}>
      <div><small>你和拾光的私人空间</small><h1>先不用选工具。<br />说说你想理解的事。</h1><p>拾光会先陪你把问题说清；只有确实有帮助时，才建议命盘、星盘、塔罗或六爻作为补充视角。</p></div>
      <div className={styles.entryPoints} aria-label="选择一个想聊的方向">
        {[
          ["我想更了解自己", "我想从我的长期模式开始，更了解自己。"],
          ["有段关系让我有点乱", "我想理清一段关系。"],
          ["我正卡在一个选择里", "我正卡在一个选择里，不知道怎么往前走。"],
          ["我最近有点累或焦虑", "我最近有点累或焦虑，想知道自己真正需要什么。"],
          ["我有一件具体的事想问", "我有一件具体的事想慢慢理清。"],
        ].map(([label, seed]) => <button type="button" key={label} onClick={() => seedChat(seed)}>{label}<ArrowRight /></button>)}
      </div>
    </section>
    {latestQuestion && followUpDue && <aside className={styles.followUp}><ClockCounterClockwise /><span><small>拾光在等一次回访</small><b>{latestQuestion}</b><p>三天前的这件事，后来怎么样了？只要点一个状态，拾光会从这里接着理解你。</p><div>{["更好", "没变", "更糟"].map((state) => <button type="button" key={state} onClick={() => seedChat(`关于“${latestQuestion}”，现在是${state}。`)}>{state}</button>)}</div></span></aside>}
    <section className={styles.chatSection} id="shiguang-chat"><ShiguangChat mode="home" theme="east" context={`这是 LifeMirror 的常规聊天首页。这里首先是用户可以安全开口的私人空间。先自然回应近况、帮用户把感受或关系中的真实卡点说清；只有在确实有帮助时，才建议六爻、命盘、塔罗或占星中的一个作为补充视角，并说明为什么。不要强迫用户做测试。${latestQuestion ? `用户上次保存的问题是「${latestQuestion}」。如果用户愿意回顾，先问后来发生了什么，不要重新起卦。` : ""}`} opening={latestQuestion ? `我还记得你上次在意的是“${latestQuestion}”。后来有什么变化吗？` : "我在。今天，有什么事在心里吗？"} /></section>
    <section className={styles.daily} aria-busy={dailyLoading}>
      <div className={styles.dailyHeading}><small><Sparkle /> {dateLabel} · {dailyMode === "personal_daily_fortune" ? "今日运势" : "给你的轻提醒"}</small><h2>{daily.theme}</h2><p>{daily.reason}</p></div>
      <div className={styles.dailyAction}><b>如果今天只做一件小事</b><span>{daily.action}</span></div>
      <details><summary>这条提醒从哪里来？</summary><div className={styles.evidenceList}>{dailyEvidence.filter((item) => daily.sources.includes(item.label)).map((item) => <div key={`${item.label}-${item.detail}`}><b>{item.label}</b><span>{item.detail}</span></div>)}</div>{dailyMode === "daily_state_note" && <Link href="/app/profile/birth/">补充出生资料，开启个人运势 <ArrowRight /></Link>}</details>
    </section>
    <AppBottomNav active="home" />
  </main>;
}
