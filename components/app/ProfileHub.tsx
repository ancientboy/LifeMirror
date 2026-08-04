"use client";

import { ArrowRight, DeviceMobile, LockKey, Sparkle, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import styles from "./ProfileHub.module.css";

export function ProfileHub() {
  const [guest, setGuest] = useState(false);
  useEffect(() => setGuest(window.localStorage.getItem("life-mirror:guest-session:v1") === "active"), []);
  return <main className={styles.shell}>
    <header><UserCircle weight="thin" /><small>MY LIFE MIRROR</small><h1>我的</h1><p>{guest ? "当前以游客身份使用，记录仅保存在这台设备。" : "管理你的身份、镜像记录与隐私选择。"}</p></header>
    <section>
      <article><DeviceMobile /><div><small>当前身份</small><h2>{guest ? "游客 · 本机模式" : "尚未登录"}</h2><p>跨设备同步与长期记忆要在个人镜像服务器接通后启用。</p></div></article>
      <Link href="/mirror/"><Sparkle /><span><b>查看我的镜像</b><small>回看保存过的体验与时间线</small></span><ArrowRight /></Link>
      <Link href="/app/"><LockKey /><span><b>登录与账户</b><small>查看当前服务器连接状态</small></span><ArrowRight /></Link>
    </section>
    <p className={styles.privacy}><LockKey /> LifeMirror 不会在未经授权时上传设备内记录。</p>
    <AppBottomNav active="profile" />
  </main>;
}
