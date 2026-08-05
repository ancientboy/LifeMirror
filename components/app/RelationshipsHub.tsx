"use client";

import { ArrowRight, Check, Copy, Heart, LinkSimple, LockKey, PaperPlaneTilt, ShieldCheck, Sparkle, UserPlus, UsersThree, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import styles from "./RelationshipsHub.module.css";

type Person = { id: string; name: string; avatar: string };
type Relationship = { id: string; status: "pending" | "accepted" | "blocked"; direction: "incoming" | "outgoing"; person: Person; createdAt: string };
type SocialPayload = { user: Person; profile: { inviteCode: string; discoverable: number; shareBirth: number }; relationships: Relationship[] };
type SharePayload = { id: string; ownerId: string; shareKind: "relationship" | "compare"; mirrorKind: string; quote: string; meta: string; owner: Person };
type RelationMirror = { ready: boolean; me: Person; other: Person; mySign?: string; theirSign?: string; rhythm?: string; tension?: string; question?: string };

async function api<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, { credentials: "include", headers: { "content-type": "application/json", ...init?.headers }, ...init });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "request_failed");
  return payload;
}

function Avatar({ person }: { person: Person }) {
  const preset = person.avatar?.startsWith("preset:") ? person.avatar.slice(7) : "#315d52";
  return <span className={styles.avatar} style={{ background: preset }}>{person.avatar && !person.avatar.startsWith("preset:") ? <img src={person.avatar} alt="" /> : person.name.slice(0, 1)}</span>;
}

export function RelationshipsHub() {
  const [data, setData] = useState<SocialPayload | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [notice, setNotice] = useState("");
  const [share, setShare] = useState<SharePayload | null>(null);
  const [mirror, setMirror] = useState<RelationMirror | null>(null);
  const [loadingMirror, setLoadingMirror] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try { setData(await api<SocialPayload>("/api/v1/social/me")); setSignedOut(false); }
    catch { setSignedOut(true); }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteCode(params.get("invite") || "");
    const token = params.get("share");
    if (token) api<{ share: SharePayload }>(`/api/v1/social/shares/${token}`).then((value) => setShare(value.share)).catch(() => setNotice("这张关系镜像已失效或不存在。"));
    void refresh();
  }, []);

  const accepted = useMemo(() => data?.relationships.filter((item) => item.status === "accepted") ?? [], [data]);
  const incoming = useMemo(() => data?.relationships.filter((item) => item.status === "pending" && item.direction === "incoming") ?? [], [data]);
  const outgoing = useMemo(() => data?.relationships.filter((item) => item.status === "pending" && item.direction === "outgoing") ?? [], [data]);

  async function sendRequest(targetUserId?: string) {
    if (!data) { setSignedOut(true); return; }
    setBusy(true); setNotice("");
    try {
      const result = await api<{ alreadyExists?: boolean }>("/api/v1/social/requests", { method: "POST", body: JSON.stringify(targetUserId ? { targetUserId } : { inviteCode }) });
      setNotice(result.alreadyExists ? "你们已经有一条关系记录。" : "好友申请已发出，等 TA 回应。");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error && error.message === "person_not_found" ? "没有找到这个邀请码，请检查后重试。" : "暂时无法发送申请。");
    } finally { setBusy(false); }
  }

  async function act(id: string, action: "accept" | "remove" | "block") {
    setBusy(true);
    try { await api(`/api/v1/social/relationships/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }); await refresh(); setMirror(null); }
    finally { setBusy(false); }
  }

  async function updatePrivacy(shareBirth: boolean) {
    if (!data) return;
    const payload = await api<{ profile: SocialPayload["profile"] }>("/api/v1/social/privacy", { method: "PATCH", body: JSON.stringify({ discoverable: Boolean(data.profile.discoverable), shareBirth }) });
    setData({ ...data, profile: payload.profile });
  }

  async function openMirror(id: string) {
    setLoadingMirror(id); setMirror(null);
    try { const payload = await api<{ mirror: RelationMirror }>(`/api/v1/social/relationships/${id}/mirror`); setMirror(payload.mirror); }
    catch { setNotice("关系镜像暂时无法打开。"); }
    finally { setLoadingMirror(""); }
  }

  async function respond(response: "like_me" | "not_me" | "want_compare") {
    if (!share) return;
    if (!data) { setSignedOut(true); return; }
    setBusy(true);
    try {
      await api(`/api/v1/social/shares/${new URLSearchParams(window.location.search).get("share")}/respond`, { method: "POST", body: JSON.stringify({ response }) });
      setNotice("你的回应已经送达，同时发出了关系申请。");
      await refresh();
    } catch (error) { setNotice(error instanceof Error && error.message === "cannot_respond_self" ? "这是你自己生成的分享链接。" : "暂时无法提交回应。"); }
    finally { setBusy(false); }
  }

  const returnPath = typeof window === "undefined" ? "/app/relationships/" : window.location.pathname + window.location.search;
  const loginHref = `/app/?login=1&return=${encodeURIComponent(returnPath)}`;
  const inviteLink = data && typeof window !== "undefined" ? `${window.location.origin}/app/relationships/?invite=${data.profile.inviteCode}` : "";

  return <main className={styles.shell}>
    <header><small><UsersThree /> PRIVATE RELATIONSHIPS</small><h1>关系镜像</h1><p>只连接你真正想邀请的人。没有公开广场，也不会默认公开出生资料。</p></header>

    {share && <section className={styles.shareArrival}>
      <div className={styles.shareOwner}><Avatar person={share.owner} /><span><b>{share.owner.name} 发来一张镜像</b><small>{share.shareKind === "compare" ? "邀请你生成自己的结果并对照" : "想听听你看到这句话的感受"}</small></span></div>
      <blockquote>“{share.quote}”</blockquote>{share.meta && <p>{share.meta}</p>}
      {data ? <div className={styles.responseRow}><button disabled={busy} onClick={() => void respond("like_me")}>这也像我</button><button disabled={busy} onClick={() => void respond("not_me")}>我看到的不一样</button><button disabled={busy} onClick={() => void respond("want_compare")}>生成双方对照</button></div> : <Link className={styles.primaryLink} href={loginHref}><LockKey />登录后回应这张镜像 <ArrowRight /></Link>}
    </section>}

    {signedOut && !data ? <section className={styles.signInCard}><LockKey /><h2>登录后建立私密关系</h2><p>好友、回应和双方关系镜像需要绑定账户，游客记录不会被公开。</p><Link href={loginHref}>登录并继续 <ArrowRight /></Link></section> : data && <>
      <section className={styles.inviteCard}>
        <div><small>你的专属邀请</small><h2>{data.user.name} 的关系入口</h2><p>把链接发给认识的人。对方回应后，你们会先成为待确认关系。</p></div>
        <button onClick={async () => { await navigator.clipboard.writeText(inviteLink); setNotice("邀请链接已复制。"); }}><Copy />复制邀请链接</button>
        <div className={styles.codeEntry}><input aria-label="好友邀请码" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="输入好友邀请码" /><button disabled={busy || !inviteCode.trim()} onClick={() => void sendRequest()}><UserPlus />添加</button></div>
      </section>

      {incoming.length > 0 && <section className={styles.panel}><header><div><small>等待你回应</small><h2>好友申请</h2></div><span>{incoming.length}</span></header><div className={styles.people}>{incoming.map((item) => <article key={item.id}><Avatar person={item.person} /><div><b>{item.person.name}</b><small>想与你建立私密关系镜像</small></div><button disabled={busy} onClick={() => void act(item.id, "accept")}><Check />接受</button><button className={styles.iconButton} aria-label="忽略申请" onClick={() => void act(item.id, "remove")}><X /></button></article>)}</div></section>}

      <section className={styles.panel}><header><div><small>RELATIONSHIPS</small><h2>我的关系</h2></div><span>{accepted.length}</span></header>
        {accepted.length ? <div className={styles.people}>{accepted.map((item) => <article key={item.id}><Avatar person={item.person} /><div><b>{item.person.name}</b><small>已建立私密关系</small></div><button disabled={loadingMirror === item.id} onClick={() => void openMirror(item.id)}><Sparkle />{loadingMirror === item.id ? "正在打开" : "关系镜像"}</button><button className={styles.iconButton} aria-label={`移除 ${item.person.name}`} onClick={() => void act(item.id, "remove")}><X /></button></article>)}</div> : <div className={styles.empty}><Heart /><p>关系页还是空的。先邀请一个你真正想理解的人。</p></div>}
        {outgoing.length > 0 && <p className={styles.pendingText}>另有 {outgoing.length} 个邀请正在等待回应。</p>}
      </section>

      {mirror && <section className={styles.mirrorCard}>
        <small><Sparkle /> 双人关系镜像 · BETA</small><h2>{mirror.me.name} × {mirror.other.name}</h2>
        {mirror.ready ? <><div className={styles.signs}><span>{mirror.mySign}</span><LinkSimple /><span>{mirror.theirSign}</span></div><article><b>相处节奏</b><p>{mirror.rhythm}</p></article><article><b>需要留意</b><p>{mirror.tension}</p></article><blockquote>{mirror.question}</blockquote></> : <div className={styles.permissionNeeded}><ShieldCheck /><p>双方都需要主动允许“用出生资料生成关系洞察”，系统才会生成，不会向对方展示具体出生时间和地点。</p></div>}
      </section>}

      <section className={styles.privacyCard}><ShieldCheck /><div><b>关系隐私</b><p>允许已接受的好友用双方出生资料生成关系洞察。只返回摘要，不展示生日、时间、地点或坐标。</p></div><button role="switch" aria-checked={Boolean(data.profile.shareBirth)} onClick={() => void updatePrivacy(!data.profile.shareBirth)}><i className={data.profile.shareBirth ? styles.on : ""} /></button></section>
    </>}
    {notice && <p className={styles.notice} role="status"><PaperPlaneTilt />{notice}</p>}
    <AppBottomNav active="relationships" />
  </main>;
}
