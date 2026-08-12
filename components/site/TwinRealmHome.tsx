"use client";

import { Aperture, ArrowRight, DotsThree, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import styles from "./TwinRealmHome.module.css";

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export function TwinRealmHome() {
  const [skin, setSkin] = useState<"east" | "west">("east");
  const character = skin === "east" ? "/characters/shiguang/shiguang-east.webp" : "/characters/shiguang/shiguang-west.webp";

  return <main className={`${styles.companionShell} ${styles[skin]}`}>
    <header className={styles.companionHeader}>
      <Link href="/" className={styles.brand} aria-label="LifeMirror 首页"><Aperture weight="thin" /><span><b>LifeMirror</b><small>拾光 · PERSONAL MIRROR</small></span></Link>
      <nav aria-label="主导航"><Link href="/theory/">我们如何工作</Link><Link href="/mirror/">我的镜像</Link><button aria-label="更多"><DotsThree weight="bold" /></button></nav>
    </header>

    <section className={styles.companionHero}>
      <div className={styles.companionCopy}>
        <span className={styles.companionKicker}><Sparkle /> SHIGUANG · 你的长期陪伴者</span>
        <h1>先和拾光聊聊，<br />再决定从哪里<br />看见自己。</h1>
        <p>不必先懂六爻、塔罗或星盘。告诉拾光你此刻在意什么，她会陪你厘清问题，再由你选择适合的镜像方式。</p>
        <div className={styles.companionActions}><Link className={styles.primaryCta} href="/app/home/?guest=1">直接体验拾光 <ArrowRight /></Link><Link className={styles.loginLink} href="/app/?login=1">登录并保存进度</Link><small><ShieldCheck /> 无需注册；游客记录只保存在当前设备，之后可再登录同步</small></div>
        <div className={styles.companionSteps}><article><b>01</b><span><strong>先说此刻</strong><small>自由聊天或描述困惑</small></span></article><article><b>02</b><span><strong>选择镜像</strong><small>六爻、命盘、塔罗、占星</small></span></article><article><b>03</b><span><strong>继续追问</strong><small>让一次体验变成持续理解</small></span></article></div>
      </div>

      <div className={styles.companionStage}>
        <div className={styles.companionHalo} />
        <img src={assetPath(character)} alt={`${skin === "east" ? "东方" : "西方"}皮肤的拾光`} />
        <div className={styles.companionBubble}><img src={assetPath(skin === "east" ? "/characters/shiguang/shiguang-east-avatar.webp" : "/characters/shiguang/shiguang-west-avatar.webp")} alt={`Q版${skin === "east" ? "东方" : "西方"}拾光`} /><p>“你不需要马上找到答案。先告诉我，今天哪件事一直留在心里？”</p></div>
        <div className={styles.skinChoice}><span>同一个拾光 · 两种文化皮肤</span><button className={skin === "east" ? styles.active : ""} onClick={() => setSkin("east")}><img src={assetPath("/characters/shiguang/shiguang-east-avatar.webp")} alt="东方拾光" /></button><button className={skin === "west" ? styles.active : ""} onClick={() => setSkin("west")}><img src={assetPath("/characters/shiguang/shiguang-west-avatar.webp")} alt="西方拾光" /></button></div>
      </div>
    </section>

    <footer className={styles.companionFooter}><span>SYMBOLIC REFLECTION + PERSONAL AI MIRROR</span><p>她不替你预言答案，只陪你把问题看得更清楚。</p><span>YOUR LIGHT, YOUR MIRROR</span></footer>
  </main>;
}
