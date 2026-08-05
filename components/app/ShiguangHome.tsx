"use client";

import { Aperture, ArrowRight, Brain, ClockCounterClockwise, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./ShiguangHome.module.css";
import { AccountDataSync } from "./AccountDataSync";

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export function ShiguangHome() {
  const [ready, setReady] = useState(false);
  const [latestQuestion, setLatestQuestion] = useState("");
  const [latestClue, setLatestClue] = useState("");

  const dateLabel = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date());
  const dailyLines = [
    "今天不急着把所有事想明白，先照顾最消耗你的那一件。",
    "真正让你疲惫的，可能不是选择，而是一直悬着不选。",
    "先别问自己做得够不够好，看看什么正在悄悄耗掉你。",
    "今天适合少证明一点，多确认一次自己真正想要什么。",
    "有些答案不是想出来的，是你往前试一步后看见的。",
  ];
  const dayIndex = Math.floor(Date.now() / 86_400_000) % dailyLines.length;

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
      const history = JSON.parse(window.localStorage.getItem("life-mirror:guest-history:v1") ?? "[]") as Array<{ question?: string; reflection?: { shareableReflection?: string; shiguangInterpretation?: string; traditionalJudgment?: string } }>;
      setLatestQuestion(history[0]?.question?.trim() ?? "");
      setLatestClue(history[0]?.reflection?.shareableReflection?.trim() ?? history[0]?.reflection?.shiguangInterpretation?.trim() ?? history[0]?.reflection?.traditionalJudgment?.trim() ?? "");
    } catch { /* ignore invalid device history */ }
    if (window.localStorage.getItem("life-mirror:guest-session:v1") === "active") {
      setReady(true);
      return;
    }
    fetch("/api/v1/auth/session", { credentials: "include" })
      .then((response) => { if (!response.ok) throw new Error("signed_out"); setReady(true); })
      .catch(() => setReady(false));
  }, []);

  if (!ready) return <main className={styles.gate}><Aperture weight="thin" /><h1>直接和拾光聊聊。</h1><p>无需注册。游客记录只留在当前设备，之后也可以再登录同步。</p><button type="button" onClick={enterAsGuest}>以游客身份继续 <ArrowRight /></button><Link href="/app/">登录或创建账户</Link></main>;

  return <main className={styles.shell}>
    <AccountDataSync />
    <header className={styles.topbar}>
      <div className={styles.identity}><img src={assetPath("/characters/shiguang/shiguang-east-chibi-v2.png")} alt="Q版东方拾光" /><span><b>拾光</b><small><i /> 日常对话</small></span></div>
      <Link href="/app/profile/#memory"><Brain /><span>记忆</span></Link>
    </header>
    <section className={styles.today}>
      <div><small><Sparkle /> {dateLabel} · 今日拾光</small><h1>{latestClue ? [...latestClue].slice(0, 42).join("") : dailyLines[dayIndex]}</h1><p>{latestQuestion ? "我没有忘记上次那件事。今天不必重新讲一遍。" : "这不是预测，只是今天可以带在身上的一个观察。"}</p></div>
      <div className={styles.checkIn}><small>此刻更接近哪一种？</small><span>{["紧绷", "犹豫", "期待", "疲惫"].map((mood) => <button type="button" key={mood} onClick={() => seedChat(`我今天有点${mood}。${latestQuestion ? `可能还和“${latestQuestion}”有关。` : ""}`)}>{mood}</button>)}</span></div>
    </section>
    {latestQuestion && <aside className={styles.followUp}><ClockCounterClockwise /><span><small>上次你在意的事</small><b>{latestQuestion}</b><p>后来怎么样了？有新变化，就从这里接着说。</p></span></aside>}
    <section className={styles.chatSection}><ShiguangChat mode="home" theme="east" context={`这是 LifeMirror 的常规聊天首页。用户尚未选择具体工具。先自然回应近况；只有在确实有帮助时，才建议六爻、命盘、塔罗或占星中的一个，并说明为什么。不要强迫用户做测试。${latestQuestion ? `用户上次保存的问题是「${latestQuestion}」。如果用户愿意回顾，先问后来发生了什么，不要重新起卦。` : ""}`} opening={latestQuestion ? `我还记得你上次在意的是“${latestQuestion}”。后来有什么变化吗？` : "我在。你可以直接从此刻最想说的那件事开始。"} /></section>
    <AppBottomNav active="home" />
  </main>;
}
