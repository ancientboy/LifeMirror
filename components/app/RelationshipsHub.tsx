"use client";

import { ArrowRight, Bell, ChatCenteredText, Check, Copy, EnvelopeSimple, Heart, LinkSimple, LockKey, MagnifyingGlass, PaperPlaneTilt, ShareNetwork, ShieldCheck, Sparkle, UserPlus, UsersThree, Warning, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { getPrivatePeople, type PrivatePerson } from "@/lib/relationship-context";
import styles from "./RelationshipsHub.module.css";
import notificationStyles from "./RelationshipsHubNotifications.module.css";

type Person = { id: string; name: string; avatar: string };
type Relationship = { id: string; status: "pending" | "accepted" | "blocked"; direction: "incoming" | "outgoing"; person: Person; createdAt: string };
type SocialPayload = { user: Person; profile: { inviteCode: string; publicId: string; discoverable: number; shareBirth: number }; relationships: Relationship[] };
type SharePayload = { id: string; ownerId: string; shareKind: "relationship" | "compare"; mirrorKind: string; quote: string; meta: string; owner: Person };
type RelationMirror = { ready: boolean; me: Person; other: Person; mySign?: string; theirSign?: string; rhythm?: string; tension?: string; question?: string };
type BridgeQuestion = { id: string; question: string; response?: string | null; status: "open" | "answered" | "archived"; createdAt: string; answeredAt?: string | null };
type BridgeLink = { id: string; privatePersonId: string; displayName: string; ownerUserId: string; linkedUserId: string; status: "pending" | "linked" | "declined"; createdAt: string };
type Bridge = { relationshipId: string; other: Person; links: BridgeLink[]; receivedQuestions: BridgeQuestion[]; sentQuestions: BridgeQuestion[]; events: Array<{ id: string; kind: string; content: string; createdAt: string; authorUserId: string }> };
type NotificationType = "relationship_request" | "relationship_accepted" | "relationship_question" | "share_response";
type NotificationItem = { id: string; type: NotificationType; relationshipId?: string | null; state: "unread" | "read"; createdAt: string; readAt?: string | null };
type NotificationPreferences = { relationshipRequest: boolean | number; relationshipAccepted: boolean | number; relationshipQuestion: boolean | number; shareResponse: boolean | number; quietHoursEnabled: boolean | number; emailEnabled: boolean | number };
type NotificationPayload = { notifications: NotificationItem[]; preferences: NotificationPreferences };

const notificationCopy: Record<NotificationType, string> = {
  relationship_request: "你收到一条新的关系邀请",
  relationship_accepted: "你的关系邀请已被接受",
  relationship_question: "有人在等你的真实回应",
  share_response: "你的镜像分享收到回应",
};

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
  const [searchResult, setSearchResult] = useState<(Person & { publicId: string }) | null>(null);
  const [notice, setNotice] = useState("");
  const [share, setShare] = useState<SharePayload | null>(null);
  const [mirror, setMirror] = useState<RelationMirror | null>(null);
  const [loadingMirror, setLoadingMirror] = useState("");
  const [bridge, setBridge] = useState<Bridge | null>(null);
  const [bridgeId, setBridgeId] = useState("");
  const [questionDraft, setQuestionDraft] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [privatePeople, setPrivatePeople] = useState<PrivatePerson[]>([]);
  const [personToLink, setPersonToLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [notificationData, setNotificationData] = useState<NotificationPayload | null>(null);

  async function refresh() {
    try {
      const [social, notifications] = await Promise.all([api<SocialPayload>("/api/v1/social/me"), api<NotificationPayload>("/api/v1/account/notifications")]);
      setData(social); setNotificationData(notifications); setSignedOut(false);
    }
    catch { setSignedOut(true); }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteCode(params.get("invite") || "");
    const token = params.get("share");
    if (token) api<{ share: SharePayload }>(`/api/v1/social/shares/${token}`).then((value) => setShare(value.share)).catch(() => setNotice("这张关系镜像已失效或不存在。"));
    void refresh();
    setPrivatePeople(getPrivatePeople());
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
      setSearchResult(null);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error && error.message === "person_not_found" ? "没有找到这个好友邀请，请检查后重试。" : "暂时无法发送申请。");
    } finally { setBusy(false); }
  }

  async function searchFriend() {
    const publicId = inviteCode.trim().toUpperCase().replace(/\s+/g, "");
    if (!publicId) return;
    setBusy(true); setNotice(""); setSearchResult(null);
    try {
      const result = await api<{ person: Person; publicId: string }>(`/api/v1/social/search?id=${encodeURIComponent(publicId)}`);
      setSearchResult({ ...result.person, publicId: result.publicId });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setNotice(code === "cannot_add_self" ? "这是你自己的 LifeMirror ID。" : "没有找到这个 LifeMirror ID，请检查后重试。");
    } finally { setBusy(false); }
  }

  async function shareInvite() {
    if (!inviteLink) return;
    setNotice("");
    if (navigator.share) {
      try {
        await navigator.share({ title: `${data?.user.name ?? "我"} 邀请你加入 LifeMirror`, text: `用 LifeMirror ID ${data?.profile.publicId ?? ""} 和我建立私密关系镜像。`, url: inviteLink });
        setNotice("邀请已打开，你可以选择要发送给谁。");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") { setNotice("已取消分享，邀请链接仍在这里。"); return; }
      }
    }
    try { await navigator.clipboard.writeText(inviteLink); setNotice("邀请链接已复制，可以直接发给好友。"); }
    catch { setNotice(`无法自动复制，请手动发送 LifeMirror ID：${data?.profile.publicId ?? ""}`); }
  }

  async function act(id: string, action: "accept" | "remove" | "block") {
    setBusy(true);
    try { await api(`/api/v1/social/relationships/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }); await refresh(); setMirror(null); }
    finally { setBusy(false); }
  }

  async function reportAndBlock(id: string) {
    if (!window.confirm("举报后会立即屏蔽这位用户，双方的关系镜像和真实对话将无法继续打开。继续吗？")) return;
    setBusy(true); setNotice("");
    try {
      await api(`/api/v1/social/relationships/${id}/report`, { method: "POST", body: JSON.stringify({ reasonCode: "other" }) });
      await refresh(); setMirror(null); setBridge(null); setNotice("已举报并屏蔽。我们没有上传聊天内容或你的私人资料。");
    } catch { setNotice("暂时无法完成举报，请稍后重试。"); }
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

  async function openBridge(id: string) {
    setBusy(true); setBridge(null); setBridgeId(id); setNotice("");
    try { const value = await api<{ bridge: Bridge }>(`/api/v1/social/relationships/${id}/bridge`); setBridge(value.bridge); }
    catch { setNotice("这段关系暂时无法打开。") }
    finally { setBusy(false); }
  }

  async function refreshBridge() { if (bridgeId) await openBridge(bridgeId); }

  async function sendQuestion() {
    if (!bridgeId || !questionDraft.trim()) return;
    setBusy(true); setNotice("");
    try { await api(`/api/v1/social/relationships/${bridgeId}/questions`, { method: "POST", body: JSON.stringify({ question: questionDraft }) }); setQuestionDraft(""); await refreshBridge(); setNotice("问题已经送给 TA；等对方愿意时，真实回答会回到这里。"); }
    catch { setNotice("暂时无法发送这个问题。") }
    finally { setBusy(false); }
  }

  async function answerQuestion(id: string) {
    const answer = answers[id]?.trim(); if (!bridgeId || !answer) return;
    setBusy(true); setNotice("");
    try { await api(`/api/v1/social/relationships/${bridgeId}/questions/${id}/answer`, { method: "POST", body: JSON.stringify({ answer }) }); setAnswers((current) => ({ ...current, [id]: "" })); await refreshBridge(); setNotice("你的真实回答已送达。") }
    catch { setNotice("暂时无法提交回答。") }
    finally { setBusy(false); }
  }

  async function linkPerson() {
    const person = privatePeople.find((item) => item.id === personToLink); if (!bridgeId || !person) return;
    setBusy(true); setNotice("");
    try { await api(`/api/v1/social/relationships/${bridgeId}/links`, { method: "POST", body: JSON.stringify({ privatePersonId: person.id, displayName: person.displayName }) }); setNotice(`已邀请 ${bridge?.other.name ?? "TA"} 确认你记录的“${person.displayName}”就是自己。确认前它仍只是你的私人视角。`); await refreshBridge(); }
    catch { setNotice("暂时无法发送确认邀请。") }
    finally { setBusy(false); }
  }

  async function respondToLink(id: string, action: "accept" | "decline") {
    if (!bridgeId) return; setBusy(true);
    try { await api(`/api/v1/social/relationships/${bridgeId}/links/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }); await refreshBridge(); setNotice(action === "accept" ? "已确认链接；双方资料仍各自独立保存。" : "已拒绝链接，不会影响原有私人记录。") }
    catch { setNotice("暂时无法处理确认。") }
    finally { setBusy(false); }
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

  async function readNotification(item: NotificationItem) {
    if (item.state === "read") return;
    await api(`/api/v1/account/notifications/${item.id}`, { method: "PATCH", body: JSON.stringify({ state: "read" }) });
    setNotificationData((current) => current ? { ...current, notifications: current.notifications.map((entry) => entry.id === item.id ? { ...entry, state: "read", readAt: new Date().toISOString() } : entry) } : current);
  }

  async function saveNotificationPreferences(patch: Partial<NotificationPreferences>) {
    if (!notificationData) return;
    const next = { ...notificationData.preferences, ...patch };
    const value = await api<{ preferences: NotificationPreferences }>("/api/v1/account/notifications/preferences", { method: "PATCH", body: JSON.stringify({
      relationshipRequest: Boolean(next.relationshipRequest), relationshipAccepted: Boolean(next.relationshipAccepted), relationshipQuestion: Boolean(next.relationshipQuestion), shareResponse: Boolean(next.shareResponse), quietHoursEnabled: Boolean(next.quietHoursEnabled), emailEnabled: Boolean(next.emailEnabled),
    }) });
    setNotificationData({ ...notificationData, preferences: value.preferences });
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
        <div><small>你的 LifeMirror ID</small><h2>{data.profile.publicId}</h2><p>好友可以搜索这个唯一 ID，或通过邀请链接找到你。</p></div>
        <button onClick={() => void shareInvite()}><ShareNetwork />邀请好友</button>
        <div className={styles.idActions}><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(data.profile.publicId); setNotice("LifeMirror ID 已复制。"); } catch { setNotice(`请手动复制：${data.profile.publicId}`); } }}><Copy />复制 ID</button><span>{inviteLink}</span></div>
        <div className={styles.codeEntry}><input aria-label="好友 LifeMirror ID" value={inviteCode} onChange={(event) => { setInviteCode(event.target.value.toUpperCase()); setSearchResult(null); }} placeholder="输入 LM-A1B2C3D4" /><button disabled={busy || !inviteCode.trim()} onClick={() => void searchFriend()}><MagnifyingGlass />搜索</button></div>
        {searchResult && <div className={styles.searchResult}><Avatar person={searchResult} /><span><b>{searchResult.name}</b><small>{searchResult.publicId}</small></span><button disabled={busy} onClick={() => void sendRequest(searchResult.id)}><UserPlus />发送申请</button></div>}
      </section>

      {notificationData && <section className={notificationStyles.card}>
        <header><div><small><Bell /> 私密通知</small><h2>最近发生的事</h2><p>这里只显示固定提示，不复制关系问题、分享文案或人物资料。</p></div><span>{notificationData.notifications.filter((item) => item.state === "unread").length}</span></header>
        <div className={notificationStyles.list}>{notificationData.notifications.length ? notificationData.notifications.slice(0, 8).map((item) => <button type="button" className={item.state === "unread" ? notificationStyles.unread : ""} key={item.id} onClick={() => void readNotification(item)}><Bell /><span><b>{notificationCopy[item.type]}</b><small>{new Date(item.createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}{item.state === "unread" ? " · 点击标为已读" : " · 已读"}</small></span></button>) : <p>暂时没有新的关系通知。</p>}</div>
        <details className={notificationStyles.settings}><summary>提醒设置</summary><label><input type="checkbox" checked={Boolean(notificationData.preferences.relationshipRequest)} onChange={(event) => void saveNotificationPreferences({ relationshipRequest: event.target.checked })}/>关系邀请</label><label><input type="checkbox" checked={Boolean(notificationData.preferences.relationshipAccepted)} onChange={(event) => void saveNotificationPreferences({ relationshipAccepted: event.target.checked })}/>邀请接受</label><label><input type="checkbox" checked={Boolean(notificationData.preferences.relationshipQuestion)} onChange={(event) => void saveNotificationPreferences({ relationshipQuestion: event.target.checked })}/>真实问题</label><label><input type="checkbox" checked={Boolean(notificationData.preferences.shareResponse)} onChange={(event) => void saveNotificationPreferences({ shareResponse: event.target.checked })}/>分享回应</label><label><input type="checkbox" checked={Boolean(notificationData.preferences.quietHoursEnabled)} onChange={(event) => void saveNotificationPreferences({ quietHoursEnabled: event.target.checked })}/>夜间不发站外提醒</label><label><EnvelopeSimple /><input type="checkbox" checked={Boolean(notificationData.preferences.emailEnabled)} onChange={(event) => void saveNotificationPreferences({ emailEnabled: event.target.checked })}/>允许发送不含私人内容的邮件提醒</label></details>
      </section>}

      {incoming.length > 0 && <section className={styles.panel}><header><div><small>等待你回应</small><h2>好友申请</h2></div><span>{incoming.length}</span></header><div className={styles.people}>{incoming.map((item) => <article key={item.id}><Avatar person={item.person} /><div><b>{item.person.name}</b><small>想与你建立私密关系镜像</small></div><button disabled={busy} onClick={() => void act(item.id, "accept")}><Check />接受</button><button className={styles.iconButton} aria-label="忽略申请" onClick={() => void act(item.id, "remove")}><X /></button><button className={styles.iconButton} aria-label={`举报并屏蔽 ${item.person.name}`} onClick={() => void reportAndBlock(item.id)}><Warning /></button></article>)}</div></section>}

      <section className={styles.panel}><header><div><small>RELATIONSHIPS</small><h2>我的关系</h2></div><span>{accepted.length}</span></header>
        {accepted.length ? <div className={styles.people}>{accepted.map((item) => <article key={item.id}><Avatar person={item.person} /><div><b>{item.person.name}</b><small>已建立私密关系</small></div><button disabled={loadingMirror === item.id} onClick={() => void openMirror(item.id)}><Sparkle />{loadingMirror === item.id ? "正在打开" : "关系镜像"}</button><button disabled={busy} onClick={() => void openBridge(item.id)}><ChatCenteredText />真实对话</button><button className={styles.iconButton} aria-label={`移除 ${item.person.name}`} onClick={() => void act(item.id, "remove")}><X /></button><button className={styles.iconButton} aria-label={`举报并屏蔽 ${item.person.name}`} onClick={() => void reportAndBlock(item.id)}><Warning /></button></article>)}</div> : <div className={styles.empty}><Heart /><p>关系页还是空的。先邀请一个你真正想理解的人。</p></div>}
        {outgoing.length > 0 && <p className={styles.pendingText}>另有 {outgoing.length} 个邀请正在等待回应。</p>}
      </section>

      {mirror && <section className={styles.mirrorCard}>
        <small><Sparkle /> 双人关系镜像 · BETA</small><h2>{mirror.me.name} × {mirror.other.name}</h2>
        {mirror.ready ? <><div className={styles.signs}><span>{mirror.mySign}</span><LinkSimple /><span>{mirror.theirSign}</span></div><article><b>相处节奏</b><p>{mirror.rhythm}</p></article><article><b>需要留意</b><p>{mirror.tension}</p></article><blockquote>{mirror.question}</blockquote></> : <div className={styles.permissionNeeded}><ShieldCheck /><p>双方都需要主动允许“用出生资料生成关系洞察”，系统才会生成，不会向对方展示具体出生时间和地点。</p></div>}
      </section>}

      {bridge && <section className={styles.bridgeCard}>
        <header><div><small><ChatCenteredText /> REAL RELATIONSHIP BRIDGE</small><h2>和 {bridge.other.name} 的真实对话</h2><p>这里显示的是双方明确发送或回答的内容；不会把任何一方的私人观察交给另一方。</p></div><button type="button" onClick={() => setBridge(null)} aria-label="关闭真实对话"><X /></button></header>
        {privatePeople.length > 0 && <div className={styles.claimRow}><div><b>把“我在意的人”与真实 TA 连接</b><p>这只是请 TA 确认身份；你的原始观察不会自动分享。</p></div><select aria-label="选择私人人物" value={personToLink} onChange={(event) => setPersonToLink(event.target.value)}><option value="">选择一个人物</option>{privatePeople.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select><button disabled={busy || !personToLink} onClick={() => void linkPerson()}>邀请确认</button></div>}
        {bridge.links.filter((link) => link.linkedUserId === data?.user.id && link.status === "pending").map((link) => <div className={styles.linkRequest} key={link.id}><p>{bridge.other.name} 想确认：你是否是 TA 私人记录里的“{link.displayName}”？确认不会公开 TA 的描述。</p><button disabled={busy} onClick={() => void respondToLink(link.id, "accept")}>确认</button><button disabled={busy} onClick={() => void respondToLink(link.id, "decline")}>不是我</button></div>)}
        <form className={styles.askForm} onSubmit={(event) => { event.preventDefault(); void sendQuestion(); }}><label>问 TA 一个真正想听答案的问题<textarea required maxLength={280} value={questionDraft} onChange={(event) => setQuestionDraft(event.target.value)} placeholder="例如：你忙的时候，更希望我继续找你，还是等你主动？" /></label><button disabled={busy || !questionDraft.trim()}><PaperPlaneTilt />发给 TA</button></form>
        <div className={styles.questionGrid}><article><b>等你回答</b>{bridge.receivedQuestions.length ? bridge.receivedQuestions.map((item) => <div className={styles.question} key={item.id}><p>{item.question}</p>{item.status === "open" ? <><textarea aria-label="你的真实回答" maxLength={500} value={answers[item.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="只写你愿意真实表达的部分……" /><button disabled={busy || !(answers[item.id] ?? "").trim()} onClick={() => void answerQuestion(item.id)}>送出回答</button></> : <small>你已回答：{item.response}</small>}</div>) : <small>暂时没有等待你回答的问题。</small>}</article><article><b>我发出的问题</b>{bridge.sentQuestions.length ? bridge.sentQuestions.map((item) => <div className={styles.question} key={item.id}><p>{item.question}</p><small>{item.status === "answered" ? `TA 的回答：${item.response}` : "等待 TA 自己选择是否回答"}</small></div>) : <small>还没有发出问题。</small>}</article></div>
        {bridge.events.length > 0 && <div className={styles.eventList}><b>共同发生过</b>{bridge.events.map((event) => <p key={event.id}>{event.content}</p>)}</div>}
      </section>}

      <section className={styles.privacyCard}><ShieldCheck /><div><b>关系隐私</b><p>允许已接受的好友用双方出生资料生成关系洞察。只返回摘要，不展示生日、时间、地点或坐标。</p></div><button role="switch" aria-checked={Boolean(data.profile.shareBirth)} onClick={() => void updatePrivacy(!data.profile.shareBirth)}><i className={data.profile.shareBirth ? styles.on : ""} /></button></section>
    </>}
    {notice && <p className={styles.notice} role="status"><PaperPlaneTilt />{notice}</p>}
    <AppBottomNav active="profile" />
  </main>;
}
