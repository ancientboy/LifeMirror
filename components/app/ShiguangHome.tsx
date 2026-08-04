"use client";

import { Aperture, ArrowRight, Compass, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./ShiguangHome.module.css";

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
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}><Aperture weight="thin" /><span><b>LifeMirror</b><small>拾光 · HOME</small></span></Link>
      <nav><Link href="/app/explore/"><Compass /> 探索镜像</Link><Link href="/mirror/"><UserCircle /> 我的镜像</Link></nav>
    </header>
    <section className={styles.welcome}>
      <div className={styles.copy}>
        <small>GOOD TO SEE YOU · 游客模式</small>
        <h1>先坐一会儿。<br />今天想从哪里说起？</h1>
        <p>这里是你和拾光的日常对话空间。六爻、命盘、塔罗与占星已经移到独立探索页；当你需要另一种观察方式时，再从那里选择。</p>
        <div className={styles.flow}><span>说说近况</span><i /><span>一起理清</span><i /><span>需要时再探索</span></div>
        <Link className={styles.exploreLink} href="/app/explore/">进入双镜探索页 <ArrowRight /></Link>
      </div>
      <div className={styles.character}><div /><img src={assetPath("/characters/shiguang/shiguang-hero.webp")} alt="拾光" /><blockquote>“不用先把话想完整。你从最放不下的那一小段说起就好。”</blockquote></div>
    </section>
    <section className={styles.chatSection}><ShiguangChat mode="home" theme="east" context="这是 LifeMirror 的常规聊天首页。用户尚未选择具体工具。先自然回应近况；只有在确实有帮助时，才建议六爻、命盘、塔罗或占星中的一个，并说明为什么。不要强迫用户做测试。" opening="我在。今天不用先选工具，你可以从刚刚发生的事、一个反复出现的念头，或一种说不清的感觉开始。" /></section>
    <AppBottomNav active="home" />
  </main>;
}
