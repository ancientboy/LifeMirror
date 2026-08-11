Warning: truncated output (original token count: 4079)
Total output lines: 197

"use client";

import { Aperture, ArrowRight, Brain, CheckCircle, ClockCounterClockwise, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./ShiguangHome.module.css";
import { AccountDataSync } from "./AccountDataSync";
import { ACCOUNT_DATA_CHANGED_EVENT, readLocalAccountData, writeLocalAccountData } from "@/lib/account-data";
import { getSavedBirthProfile } from "@/lib/birth-profile";
import { buildDailyGuidanceContext, sanitizeDailyGuidance, type DailyEvidence, type DailyGuidance, type DailyGuidanceContext } from "@/lib/daily-guidance";

type MirrorHistoryItem = { question?: string; savedAt?: string; source?: string; sourceLabel?: string; reflection?: { shareableReflection?: string; shiguangInterpretation?: string; traditionalJudgment?: string } };
type StartingPath = { label: string; tool: string; href: string; question?: string };
type DailyLoopStatus = "done" | "later" | "release";
type DailyLoopRecord = { date: string; theme: string; action: string; status?: DailyLoopStatus; checkedInAt?: string };

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
  writeLocalA…3079 tokens truncated…</b><span>{daily.action}</span></div>
      <div className={styles.checkIn}>
        {todayRecord?.status ? <><small><CheckCircle weight="fill" /> 今天已回访：{todayRecord.status === "done" ? "我做了" : todayRecord.status === "later" ? "还没" : "今天先放下"}</small><button type="button" onClick={() => seedChat(`今天的「${todayRecord.action}」我${todayRecord.status === "done" ? "做了" : todayRecord.status === "later" ? "还没做" : "决定先放下"}。`)}>和拾光接着聊</button></> : <><small>今晚回来告诉拾光，今天这一步后来怎样了。</small><span><button type="button" onClick={() => checkIn("done")}>我做了</button><button type="button" onClick={() => checkIn("later")}>还没</button><button type="button" onClick={() => checkIn("release")}>先放下</button></span></>}
      </div>
      <details><summary>这条提醒从哪里来？</summary><div className={styles.evidenceList}>{dailyEvidence.filter((item) => daily.sources.includes(item.label)).map((item) => <div key={`${item.label}-${item.detail}`}><b>{item.label}</b><span>{item.detail}</span></div>)}</div>{dailyMode === "daily_state_note" && <Link href="/app/profile/birth/">补充出生资料，开启个人运势 <ArrowRight /></Link>}</details>
    </section>
    {weeklyRecords.length >= 2 && <section className={styles.weeklyMirror}><small><Sparkle /> 本周镜像 · 只根据你确认过的回访</small><h2>这周你给了 {weeklyDone} 件事一个落点{weeklyReleased ? `，也允许 ${weeklyReleased} 件事暂时放下` : ""}。</h2><p>不是每天都要完成什么。你愿意回来确认一件事，本身就在让拾光更贴近你的真实节奏。</p><button type="button" onClick={() => seedChat(`我想一起回看这周：我完成了${weeklyDone}件今日行动，暂时放下了${weeklyReleased}件。请从这些真实回访开始聊，不要编造经历。`)}>一起回看 <ArrowRight /></button></section>}
    <AppBottomNav active="home" />
  </main>;
}