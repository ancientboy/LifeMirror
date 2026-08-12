"use client";

import { Aperture, ArrowRight, Brain, CheckCircle, ClockCounterClockwise, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./ShiguangHome.module.css";
import { AccountDataSync } from "./AccountDataSync";
import { ACCOUNT_DATA_CHANGED_EVENT, readLocalAccountData, writeLocalAccountData, type AccountSnapshot } from "@/lib/account-data";
import { getSavedBirthProfile } from "@/lib/birth-profile";
import { buildDailyGuidanceContext, sanitizeDailyGuidance, type DailyGuidance, type DailyGuidanceContext } from "@/lib/daily-guidance";
import { dailyEvidenceFingerprint, isNewHomeExperience } from "@/lib/home-experience";
import { metricDayKey, recordProductMetric } from "@/lib/product-metrics";
import { patchLocalLifeEventLoop, readLifeEventLoops, type LifeEventLoop } from "@/lib/life-event-loops";

type MirrorHistoryItem = { question?: string; savedAt?: string; source?: string; sourceLabel?: string; reflection?: { shareableReflection?: string; shiguangInterpretation?: string; traditionalJudgment?: string } };
type DailyLoopStatus = "done" | "later" | "release";
type DailyLoopRecord = { date: string; theme: string; action: string; status?: DailyLoopStatus; checkedInAt?: string };
type DailyRuntime = { observations?: Array<{ title?: string; summary?: string; evidenceCount?: number; lastObservedAt?: string }>; dailyCheckins?: Array<{ id?: string; summary?: string; occurredAt?: string }> };
type AccountContextResponse = { context?: { runtime?: DailyRuntime } };
type AccountDataResponse = { data?: AccountSnapshot };

const DAILY_LOOP_KEY = "dailyLoop";

function localDay(date = new Date()) {
  // A daily promise and its evening check-in must follow the user's device day.
  // Hard-coding a single timezone made the card roll over at the wrong time for
  // anyone outside China.
  return new Intl.DateTimeFormat("en-CA").format(date);
}

function readDailyLoop(): DailyLoopRecord[] {
  const value = readLocalAccountData().settings[DAILY_LOOP_KEY];
  return Array.isArray(value) ? value.filter((item): item is DailyLoopRecord => Boolean(item && typeof item === "object" && typeof (item as DailyLoopRecord).date === "string" && typeof (item as DailyLoopRecord).action === "string")).slice(0, 14) : [];
}

function saveDailyLoop(records: DailyLoopRecord[]) {
  const snapshot = readLocalAccountData();
  writeLocalAccountData({ ...snapshot, settings: { ...snapshot.settings, [DAILY_LOOP_KEY]: records.slice(0, 14) } });
}

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
  const [daily, setDaily] = useState<DailyGuidance>(stateFallbacks[0]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyMode, setDailyMode] = useState<DailyGuidanceContext["mode"]>("daily_state_note");
  const [dailyLoop, setDailyLoop] = useState<DailyLoopRecord[]>([]);
  const [lifeLoops, setLifeLoops] = useState<LifeEventLoop[]>([]);
  const [newUser, setNewUser] = useState(true);
  const dailyRunRef = useRef(0);
  const dailyAbortRef = useRef<AbortController | null>(null);
  const dailyFingerprintRef = useRef("");
  const runtimeRef = useRef<DailyRuntime | null>(null);
  const hydratedRef = useRef(false);

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

  function ensureTodayAction(next: DailyGuidance) {
    const today = localDay();
    setDailyLoop((current) => {
      const existing = current.find((item) => item.date === today);
      const records = existing
        ? current.map((item) => item.date === today && !item.status ? { ...item, theme: next.theme, action: next.action } : item)
        : [{ date: today, theme: next.theme, action: next.action }, ...current].slice(0, 14);
      saveDailyLoop(records);
      return records;
    });
  }

  function checkIn(status: DailyLoopStatus) {
    const today = localDay();
    const records = dailyLoop.some((item) => item.date === today) ? dailyLoop.map((item) => item.date === today ? { ...item, status, checkedInAt: new Date().toISOString() } : item) : [{ date: today, theme: daily.theme, action: daily.action, status, checkedInAt: new Date().toISOString() }, ...dailyLoop];
    setDailyLoop(records); saveDailyLoop(records);
    // Guests retain the loop on this device. Signed-in users also write the
    // check-in as an account event so Daily and later understanding can use
    // the same evidence on every device.
    void fetch("/api/v1/account/daily-checkins", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ date: today, theme: daily.theme, action: daily.action, status }) })
      .then(async (response) => response.ok ? await response.json() as { data?: Parameters<typeof writeLocalAccountData>[0] } : null)
      .then((value) => { if (value?.data) writeLocalAccountData(value.data); })
      .catch(() => undefined);
  }

  function updateLifeLoop(loop: LifeEventLoop, outcomeStatus: "better" | "same" | "worse" | "closed") {
    const status = outcomeStatus === "closed" ? "dismissed" : outcomeStatus === "same" ? "open" : "resolved";
    const data = patchLocalLifeEventLoop(loop.id, { outcomeStatus, status });
    setLifeLoops(readLifeEventLoops(data));
    if (outcomeStatus !== "closed") {
      recordProductMetric("life_loop_feedback", "chat", `loop-feedback:${loop.id}:${outcomeStatus}`);
      recordProductMetric("memory_recall_positive", "chat", `memory-ok:${loop.id}`);
    }
    void fetch(`/api/v1/account/life-loops/${encodeURIComponent(loop.id)}`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ outcomeStatus, status }) })
      .then(async (response) => response.ok ? await response.json() as { data?: Parameters<typeof writeLocalAccountData>[0] } : null)
      .then((value) => { if (value?.data) { writeLocalAccountData(value.data); setLifeLoops(readLifeEventLoops(value.data)); } })
      .catch(() => undefined);
    if (outcomeStatus !== "closed") seedChat(`关于“${loop.userFact}”，后来是${outcomeStatus === "better" ? "有了更好的进展" : outcomeStatus === "same" ? "还没有变化" : "变得更糟了"}。请从上次的判断接着聊，不要重新从头问。`);
  }

  function rejectLifeLoop(loop: LifeEventLoop) {
    const data = patchLocalLifeEventLoop(loop.id, { outcomeStatus: "closed", status: "dismissed", judgmentCalibration: "overturned" });
    setLifeLoops(readLifeEventLoops(data));
    recordProductMetric("memory_recall_negative", "chat", `memory-wrong:${loop.id}`);
    void fetch(`/api/v1/account/life-loops/${encodeURIComponent(loop.id)}`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ outcomeStatus: "closed", status: "dismissed", judgmentCalibration: "overturned" }) }).catch(() => undefined);
  }

  useEffect(() => {
    recordProductMetric("daily_opened", "daily", metricDayKey("daily"));
    let active = true;

    function applyExperience(snapshot: AccountSnapshot, runtime: DailyRuntime | null = runtimeRef.current) {
      const history = snapshot.history as MirrorHistoryItem[];
      const facts = snapshot.facts as Array<{ text?: string; updatedAt?: string }>;
      const loop = Array.isArray(snapshot.settings[DAILY_LOOP_KEY]) ? snapshot.settings[DAILY_LOOP_KEY] as DailyLoopRecord[] : [];
      const eventLoops = readLifeEventLoops(snapshot);
      setLatestQuestion(history[0]?.question?.trim() ?? "");
      setDailyLoop(loop);
      setLifeLoops(eventLoops);

      const fingerprint = dailyEvidenceFingerprint(snapshot, runtime);
      if (fingerprint === dailyFingerprintRef.current) return;
      dailyFingerprintRef.current = fingerprint;
      const dailyContext = buildDailyGuidanceContext(getSavedBirthProfile(), history, facts, loop, runtime, eventLoops);
      const base = fallbackFor(dailyContext, dayIndex);
      const runId = ++dailyRunRef.current;
      dailyAbortRef.current?.abort();
      const controller = new AbortController();
      dailyAbortRef.current = controller;
      setDaily(base); setDailyMode(dailyContext.mode); setDailyLoading(true); ensureTodayAction(base);
      const context = JSON.stringify(dailyContext.modelContext);
      void fetch("/api/shiguang", { method: "POST", credentials: "include", signal: controller.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "daily_guidance", theme: "east", context, messages: [{ role: "user", content: "生成我今天的个人导航。" }] }) })
        .then(async (response) => {
          if (!response.ok) throw new Error("daily_unavailable");
          const generated = sanitizeDailyGuidance(extractJson(await response.text()), base, dailyContext.evidence);
          if (active && runId === dailyRunRef.current) { setDaily(generated); ensureTodayAction(generated); }
        })
        .catch(() => { if (active && runId === dailyRunRef.current) setDaily(base); })
        .finally(() => { if (active && runId === dailyRunRef.current) setDailyLoading(false); });
    }

    const refresh = () => {
      if (!hydratedRef.current) return;
      applyExperience(readLocalAccountData());
    };
    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, refresh);

    async function initialize() {
      let snapshot = readLocalAccountData();
      let authenticated = false;
      try {
        const session = await fetch("/api/v1/auth/session", { credentials: "include" });
        if (!session.ok) throw new Error("signed_out");
        authenticated = true;
        window.localStorage.removeItem("life-mirror:guest-session:v1");
        const [accountResponse, contextResponse] = await Promise.all([
          fetch("/api/v1/account/data", { credentials: "include" }),
          fetch("/api/v1/account/context?mode=daily_guidance", { credentials: "include" }),
        ]);
        if (accountResponse.ok) {
          const account = await accountResponse.json() as AccountDataResponse;
          if (account.data) { writeLocalAccountData(account.data); snapshot = account.data; }
        }
        if (contextResponse.ok) {
          const accountContext = await contextResponse.json() as AccountContextResponse;
          runtimeRef.current = accountContext.context?.runtime ?? null;
        }
      } catch { authenticated = false; }
      if (!active) return;
      setNewUser(isNewHomeExperience(snapshot));
      applyExperience(snapshot, runtimeRef.current);
      hydratedRef.current = true;
      const hasGuestSession = window.localStorage.getItem("life-mirror:guest-session:v1") === "active";
      setReady(authenticated || hasGuestSession);
    }
    void initialize();
    return () => {
      active = false;
      dailyAbortRef.current?.abort();
      window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, refresh);
    };
  }, []);

  const todayRecord = dailyLoop.find((item) => item.date === localDay());
  const weeklyRecords = dailyLoop.filter((item) => item.status && Date.now() - Date.parse(`${item.date}T12:00:00`) < 7 * 86_400_000);
  const weeklyDone = weeklyRecords.filter((item) => item.status === "done").length;
  const weeklyReleased = weeklyRecords.filter((item) => item.status === "release").length;
  const priorityLoop = lifeLoops.find((item) => item.status === "open");
  const recentEventResults = lifeLoops.filter((item) => item.status === "resolved" && Date.now() - Date.parse(item.updatedAt) < 7 * 86_400_000);

  useEffect(() => {
    const continuation = new URLSearchParams(window.location.search).get("continue");
    if (continuation) window.setTimeout(() => seedChat(continuation), 180);
  }, []);

  if (!ready) return <main className={styles.gate}><Aperture weight="thin" /><h1>直接和拾光聊聊。</h1><p>无需注册。游客记录只留在当前设备，之后也可以再登录同步。</p><button type="button" onClick={enterAsGuest}>以游客身份继续 <ArrowRight /></button><Link href="/app/">登录或创建账户</Link></main>;

  const priorityCard = priorityLoop ? <aside className={styles.priorityLoop}><ClockCounterClockwise /><div><small>上次那件事，后来怎么样了？</small><h2>{priorityLoop.userFact}</h2><p>我还记得当时的判断。你只要告诉我结果，不必重新解释一遍。</p><span><button type="button" onClick={() => updateLifeLoop(priorityLoop, "better")}>有新进展</button><button type="button" onClick={() => updateLifeLoop(priorityLoop, "same")}>还没有</button><button type="button" onClick={() => updateLifeLoop(priorityLoop, "worse")}>变糟了</button><button type="button" onClick={() => updateLifeLoop(priorityLoop, "closed")}>不想再提</button></span><button className={styles.wrongMemory} type="button" onClick={() => rejectLifeLoop(priorityLoop)}>这不是我说的</button></div></aside> : null;
  const dailyCard = <section className={styles.daily} aria-busy={dailyLoading}>
    <div className={styles.dailyHeading}><small><Sparkle /> {dateLabel} · {dailyMode === "personal_daily_fortune" ? "今日运势" : "给你的轻提醒"}</small><h2>{daily.theme}</h2><p>{daily.reason}</p></div>
    <div className={styles.dailyAction}><b>如果今天只做一件小事</b><span>{daily.action}</span></div>
    <div className={styles.checkIn}>
      {todayRecord?.status ? <><small><CheckCircle weight="fill" /> 今天已回访：{todayRecord.status === "done" ? "我做了" : todayRecord.status === "later" ? "还没" : "今天先放下"}</small><button type="button" onClick={() => seedChat(`今天的「${todayRecord.action}」我${todayRecord.status === "done" ? "做了" : todayRecord.status === "later" ? "还没做" : "决定先放下"}。`)}>和拾光接着聊</button></> : <><small>今晚回来告诉拾光，今天这一步后来怎样了。</small><span><button type="button" onClick={() => checkIn("done")}>我做了</button><button type="button" onClick={() => checkIn("later")}>还没</button><button type="button" onClick={() => checkIn("release")}>先放下</button></span></>}
    </div>
  </section>;
  const chatCard = <section className={`${styles.welcome} ${styles.conversation}`}>
    {newUser && <div><small>{dateLabel} · 第一次见面</small><h1>有事就说，我会记得后来。</h1><p>不用先理解任何玩法。直接说一件正在发生的事就好。</p></div>}
    <section className={styles.homeChat} id="shiguang-chat"><ShiguangChat mode="home" theme="east" onboarding={newUser} context={`这是 LifeMirror 的常规聊天首页。这里首先是用户可以安全开口的私人空间。先自然回应近况、帮用户把感受或关系中的真实卡点说清；只有在确实有帮助时，才建议六爻、命盘、塔罗或占星中的一个作为补充视角，并说明为什么。不要强迫用户做测试。${latestQuestion ? `用户上次保存的问题是「${latestQuestion}」。如果用户愿意回顾，先问后来发生了什么，不要重新起卦。` : ""}`} opening={latestQuestion ? `我还记得你上次在意的是“${latestQuestion}”。后来有什么变化吗？` : "我在。今天，有什么事在心里吗？"} /></section>
    <Link className={styles.exploreLink} href="/app/explore/">想从命盘、塔罗或六爻开始？去探索 <ArrowRight /></Link>
  </section>;

  return <main className={styles.shell}>
    <AccountDataSync />
    <header className={styles.topbar}>
      <div className={styles.identity}><img src={assetPath("/characters/shiguang/shiguang-east-chibi-v2.png")} alt="Q版东方拾光" /><span><b>拾光</b><small><i /> 日常对话</small></span></div>
      <Link href="/app/profile/#memory"><Brain /><span>记忆</span></Link>
    </header>
    {newUser ? chatCard : <>
      {priorityCard && <section className={`${styles.welcome} ${styles.continuity}`}>{priorityCard}</section>}
      {dailyCard}
      {(weeklyRecords.length >= 2 || recentEventResults.length > 0) && <section className={styles.weeklyMirror}><small><Sparkle /> 本周镜像 · 只根据你确认过的现实反馈</small><h2>{recentEventResults.length ? `这周有 ${recentEventResults.length} 件悬着的事出现了变化。` : `这周你给了 ${weeklyDone} 件事一个落点${weeklyReleased ? `，也允许 ${weeklyReleased} 件事暂时放下` : ""}。`}</h2><p>{recentEventResults[0] ? `最值得回看的是“${recentEventResults[0].userFact}”。现实结果会优先于当时的象征判断，拾光会据此修正下一次回应。` : "不是每天都要完成什么。你愿意回来确认一件事，本身就在让拾光更贴近你的真实节奏。"}</p><button type="button" onClick={() => seedChat(`我想一起回看这周：有${recentEventResults.length}件等待中的事出现了结果，我完成了${weeklyDone}件今日行动，暂时放下了${weeklyReleased}件。请只根据这些真实回访，说明哪些判断被支持、哪些需要修正，以及下周最值得留意的一件事。`)}>一起回看 <ArrowRight /></button></section>}
      {chatCard}
    </>}
    <AppBottomNav active="home" />
  </main>;
}
