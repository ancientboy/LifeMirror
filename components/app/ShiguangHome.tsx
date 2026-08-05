"use client";

import { Aperture, ArrowRight, Brain } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./ShiguangHome.module.css";
import { AccountDataSync } from "./AccountDataSync";

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export function ShiguangHome() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("life-mirror:guest-session:v1") === "active") {
      setReady(true);
      return;
    }
    fetch("/api/v1/auth/session", { credentials: "include" })
      .then((response) => { if (!response.ok) throw new Error("signed_out"); setReady(true); })
      .catch(() => router.replace("/app/"));
  }, [router]);

  if (!ready) return <main className={styles.gate}><Aperture weight="thin" /><h1>先从欢迎页进入 LifeMirror。</h1><p>这样拾光才能知道你正在使用游客模式，并把记录留在当前设备。</p><Link href="/">返回欢迎页 <ArrowRight /></Link></main>;

  return <main className={styles.shell}>
    <AccountDataSync />
    <header className={styles.topbar}>
      <div className={styles.identity}><img src={assetPath("/characters/shiguang/shiguang-east-chibi-v2.png")} alt="Q版东方拾光" /><span><b>拾光</b><small><i /> 日常对话</small></span></div>
      <Link href="/app/profile/#memory"><Brain /><span>记忆</span></Link>
    </header>
    <section className={styles.chatSection}><ShiguangChat mode="home" theme="east" context="这是 LifeMirror 的常规聊天首页。用户尚未选择具体工具。先自然回应近况；只有在确实有帮助时，才建议六爻、命盘、塔罗或占星中的一个，并说明为什么。不要强迫用户做测试。" opening="我在。你可以直接从此刻最想说的那件事开始。" /></section>
    <AppBottomNav active="home" />
  </main>;
}
