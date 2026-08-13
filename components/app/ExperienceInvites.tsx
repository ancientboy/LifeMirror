"use client";

import { ArrowRight, Check, Copy, Gift, LinkSimple, LockKey, ShareNetwork, Sparkle, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { AppBackLink } from "./AppBackLink";
import styles from "./ExperienceInvites.module.css";

type InviteBatch = {
  id: string;
  code: string;
  initialSlots: number;
  maxUses: number;
  useCount: number;
  qualifiedCount: number;
  remaining: number;
  expiresAt: string;
  active: boolean;
};

type InvitePayload = {
  batch: InviteBatch | null;
  summary: { monthlyAccepted: number; monthlyLimit: number; initialSlots: number; validityDays: number };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { "content-type": "application/json", ...init?.headers }, ...init });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "request_failed");
  return payload;
}

export function ExperienceInvites() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [payload, setPayload] = useState<InvitePayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    request("/api/v1/auth/session").then(() => {
      setSignedIn(true);
      return request<InvitePayload>("/api/v1/account/experience-invites");
    }).then(setPayload).catch(() => setSignedIn(false));
  }, []);

  const link = useMemo(() => payload?.batch && typeof window !== "undefined" ? `${window.location.origin}/app/?referral=${payload.batch.code}` : "", [payload]);

  async function generate() {
    setBusy(true); setNotice("");
    try {
      const next = await request<InvitePayload>("/api/v1/account/experience-invites", { method: "POST", body: "{}" });
      setPayload(next);
      setNotice(next.batch?.useCount ? "这一组邀请仍然有效，可以继续分享。" : "已经为你准备好 3 个体验名额。 ");
    } catch (error) {
      setNotice(error instanceof Error && error.message === "experience_invite_monthly_limit" ? "这个月的 10 个有效邀请名额已经用完，下个月会重新开放。" : "暂时无法生成体验邀请，请稍后再试。");
    } finally { setBusy(false); }
  }

  async function copyLink() {
    if (!link || !batch?.active) return;
    try { await navigator.clipboard.writeText(link); setNotice("体验邀请链接已复制。"); }
    catch { setNotice(`请手动复制：${link}`); }
  }

  async function shareLink() {
    if (!link || !batch?.active) return;
    const text = "我最近在用拾光聊一些关系和生活里的事，想邀请你也来试试。";
    if (navigator.share) {
      try { await navigator.share({ title: "来体验拾光", text, url: link }); setNotice("已经打开系统分享。"); return; }
      catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
    }
    await copyLink();
  }

  const batch = payload?.batch;
  const expired = batch ? Date.parse(batch.expiresAt) <= Date.now() : false;

  return <main className={styles.shell}>
    <AppBackLink href="/app/profile/" label="返回我的" />
    <header><small><Gift /> SHIGUANG INVITE</small><h1>邀请朋友体验拾光</h1><p>把完整体验分享给你真正觉得适合的人。对方不会被限制聊天次数，也不会自动成为你的好友。</p></header>

    {signedIn === false ? <section className={styles.signIn}><LockKey /><h2>登录后生成你的体验邀请</h2><p>邀请记录需要与你的账户关联；游客仍然可以分享普通站点链接。</p><Link href="/app/?login=1&return=/app/invite/">登录并继续 <ArrowRight /></Link></section> : signedIn && <>
      <section className={styles.inviteCard}>
        <div className={styles.cardTop}><span><small>你的体验名额</small><h2>{batch && !expired ? `${batch.remaining} 个可用` : "还没有生成"}</h2></span>{batch && <em>{new Date(batch.expiresAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} 前有效</em>}</div>
        {batch && !expired ? <>
          <div className={styles.stats}><span><b>{batch.useCount}</b><small>已开始体验</small></span><span><b>{batch.qualifiedCount}</b><small>完成有效体验</small></span><span><b>{payload?.summary.monthlyAccepted || 0}/{payload?.summary.monthlyLimit || 10}</b><small>本月邀请</small></span></div>
          <div className={styles.linkBox}><LinkSimple /><span><b>{batch.code}</b><small>{link}</small></span><button type="button" disabled={!batch.active} onClick={() => void copyLink()} aria-label="复制体验邀请链接"><Copy /></button></div>
          <div className={styles.actions}><button type="button" disabled={!batch.active} onClick={() => void shareLink()}><ShareNetwork />分享给朋友</button><button type="button" disabled={!batch.active} onClick={() => void copyLink()}><Copy />复制链接</button></div>
          {!batch.active && <p className={styles.waiting}>这一组名额正在体验中。有人完成第一次有效体验后，会自动补回 1 个名额；每月最多邀请 10 位新用户。</p>}
        </> : <div className={styles.empty}><Sparkle /><h2>先生成一组 3 个名额</h2><p>链接30天内有效。朋友完成第一次有效体验后，会为你补回1个名额。</p><button disabled={busy} onClick={() => void generate()}>{busy ? "正在准备…" : "生成体验邀请"} <ArrowRight /></button></div>}
      </section>

      <section className={styles.rules}>
        <h2>分享不会变成任务</h2>
        <div><article><Check /><span><b>对方获得完整体验</b><small>不限制核心功能和聊天次数，也不要求先注册。</small></span></article><article><Check /><span><b>真实体验后才计入</b><small>只打开链接不算；完成首次回复、继续对话或生成镜像后才生效。</small></span></article><article><Check /><span><b>双方内容仍然私密</b><small>邀请人看不到对方聊了什么，也不会自动建立好友关系。</small></span></article></div>
      </section>

      <section className={styles.friendCard}><UsersThree /><span><b>想邀请对方成为好友？</b><small>体验邀请负责让朋友进入拾光；好友邀请负责建立双方关系，两者不会混在一起。</small></span><Link href="/app/relationships/">去关系镜像 <ArrowRight /></Link></section>
    </>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <AppBottomNav active="profile" />
  </main>;
}
