"use client";

import { ArrowRight, Brain, CalendarBlank, Camera, Check, Copy, DeviceMobile, DownloadSimple, EnvelopeSimple, FloppyDisk, Gift, IdentificationCard, LockKey, PencilSimple, SignOut, Sparkle, Trash, UserCircle, UsersThree, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { addSavedFact, getMemorySettings, getSavedFacts, MEMORY_CHANGED_EVENT, removeSavedFact, updateMemorySettings, type MemorySettings, type SavedFact } from "@/lib/shiguang-memory";
import { AppBottomNav } from "./AppBottomNav";
import styles from "./ProfileHub.module.css";
import { AccountDataSync } from "./AccountDataSync";
import { BIRTH_PROFILE_CHANGED_EVENT, formatSavedBirthProfile, getSavedBirthProfile, removeSavedBirthProfile, type SavedBirthProfile } from "@/lib/birth-profile";
import { getUserProfile, saveUserProfile, USER_PROFILE_CHANGED_EVENT, type GenderDisplay, type UserProfile } from "@/lib/user-profile";
import { readLocalAccountData, writeLocalAccountData, type AccountSnapshot } from "@/lib/account-data";
import { forgetClientSession, readClientSession, rememberAuthenticatedSession } from "@/lib/client-session";

const avatarPresets = ["#315d52", "#625d82", "#a9823d", "#8a5a54"];
const MAX_AVATAR_SOURCE_BYTES = 15 * 1024 * 1024;
const AVATAR_MAX_EDGE = 512;
const AVATAR_TARGET_BYTES = 220 * 1024;
type ExpressionPreferences = { tone: "balanced" | "direct" | "gentle" | "clear"; length: "short" | "standard" | "detailed"; followUp: "natural" | "ask" | "avoid"; updatedAt?: string | null };
const defaultExpressionPreferences: ExpressionPreferences = { tone: "balanced", length: "standard", followUp: "natural" };

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("avatar_encode_failed")), "image/webp", quality));
}

async function loadAvatarImage(file: File) {
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("avatar_decode_failed")); image.src = source; });
    return image;
  } finally { URL.revokeObjectURL(source); }
}

async function compressAvatar(file: File) {
  const image = await loadAvatarImage(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight) || 1;
  const scale = Math.min(1, AVATAR_MAX_EDGE / longestEdge);
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let blob: Blob | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d"); if (!context) throw new Error("avatar_canvas_unavailable");
    context.drawImage(image, 0, 0, width, height);
    for (const quality of [.86, .76, .66, .56]) {
      blob = await canvasBlob(canvas, quality);
      if (blob.size <= AVATAR_TARGET_BYTES) break;
    }
    if (blob && blob.size <= AVATAR_TARGET_BYTES) break;
    width = Math.max(1, Math.round(width * .78)); height = Math.max(1, Math.round(height * .78));
  }
  if (!blob) throw new Error("avatar_encode_failed");
  const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("avatar_read_failed")); reader.onerror = () => reject(new Error("avatar_read_failed")); reader.readAsDataURL(blob); });
  return { dataUrl, width, height, byteSize: blob.size };
}

function readableAvatarSize(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function ProfileHub() {
  const [sessionReady, setSessionReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountProvider, setAccountProvider] = useState("");
  const [publicId, setPublicId] = useState("");
  const [settings, setSettings] = useState<MemorySettings>({ enabled: false, explicitFacts: true, mirrorEvidence: true });
  const [facts, setFacts] = useState<SavedFact[]>([]);
  const [draft, setDraft] = useState("");
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [factsBusy, setFactsBusy] = useState(false);
  const [birthProfile, setBirthProfile] = useState<SavedBirthProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => ({ version: 1, nickname: "", avatar: "", gender: "hidden", updatedAt: "" }));
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "compressing" | "ready" | "error">("idle");
  const [avatarDetail, setAvatarDetail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [expressionPreferences, setExpressionPreferences] = useState<ExpressionPreferences>(defaultExpressionPreferences);
  const [expressionBusy, setExpressionBusy] = useState(false);
  const [expressionSaved, setExpressionSaved] = useState(false);

  useEffect(() => {
    const sync = () => { setSettings(getMemorySettings()); setFacts(getSavedFacts()); setBirthProfile(getSavedBirthProfile()); setProfile(getUserProfile()); };
    const cached = readClientSession();
    if (cached.status === "authenticated") {
      setGuest(false); setAccountEmail(cached.user.email ?? ""); setAccountProvider(cached.user.provider ?? ""); setSessionReady(true);
    } else if (cached.status === "guest") { setGuest(true); setSessionReady(true); }
    fetch("/api/v1/auth/session", { credentials: "include" }).then(async (response) => {
      if (!response.ok) { forgetClientSession(); throw new Error("signed_out"); }
      const session = await response.json() as { user?: { email?: string | null; provider?: string } };
      rememberAuthenticatedSession(session.user);
      setAccountEmail(session.user?.email ?? "");
      setAccountProvider(session.user?.provider ?? "");
      setGuest(false);
      setSessionReady(true);
      window.localStorage.removeItem("life-mirror:guest-session:v1");
      fetch("/api/v1/account/context", { credentials: "include" }).then((value) => value.ok ? value.json() : null).then((value) => {
        const accountFacts = value?.context?.facts;
        if (Array.isArray(accountFacts)) setFacts(accountFacts as SavedFact[]);
      }).catch(() => undefined);
      fetch("/api/v1/social/me", { credentials: "include" }).then((value) => value.ok ? value.json() : null).then((value) => setPublicId(value?.profile?.publicId ?? "")).catch(() => undefined);
      fetch("/api/v1/account/expression-preferences", { credentials: "include" }).then((value) => value.ok ? value.json() : null).then((value) => {
        if (value?.preferences) setExpressionPreferences({ ...defaultExpressionPreferences, ...value.preferences });
      }).catch(() => undefined);
    }).catch(() => {
      const current = readClientSession();
      if (current.status !== "authenticated") { setAccountEmail(""); setAccountProvider(""); setGuest(true); }
      setSessionReady(true);
    });
    sync();
    window.addEventListener(MEMORY_CHANGED_EVENT, sync);
    window.addEventListener(BIRTH_PROFILE_CHANGED_EVENT, sync);
    window.addEventListener(USER_PROFILE_CHANGED_EVENT, sync);
    return () => { window.removeEventListener(MEMORY_CHANGED_EVENT, sync); window.removeEventListener(BIRTH_PROFILE_CHANGED_EVENT, sync); window.removeEventListener(USER_PROFILE_CHANGED_EVENT, sync); };
  }, []);

  function toggle(next: Partial<MemorySettings>) {
    setSettings(updateMemorySettings(next));
  }

  async function saveExpressionPreferences(next: ExpressionPreferences) {
    if (guest) return;
    setExpressionBusy(true);
    try {
      const response = await fetch("/api/v1/account/expression-preferences", { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ tone: next.tone, length: next.length, followUp: next.followUp }) });
      const value = await response.json().catch(() => null) as { preferences?: ExpressionPreferences } | null;
      if (!response.ok || !value?.preferences) throw new Error("expression_preferences_save_failed");
      setExpressionPreferences({ ...defaultExpressionPreferences, ...value.preferences });
      setExpressionSaved(true); window.setTimeout(() => setExpressionSaved(false), 1800);
    } finally { setExpressionBusy(false); }
  }

  async function saveFact() {
    if (!draft.trim()) return;
    if (guest) {
      addSavedFact(draft);
      setDraft("");
      return;
    }
    setFactsBusy(true);
    try {
      const path = editingFactId ? `/api/v1/account/facts/${encodeURIComponent(editingFactId)}` : "/api/v1/account/facts";
      const response = await fetch(path, { method: editingFactId ? "PATCH" : "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: draft }) });
      const value = await response.json().catch(() => null) as { data?: AccountSnapshot } | null;
      if (!response.ok || !value?.data) throw new Error("fact_save_failed");
      writeLocalAccountData(value.data);
      setFacts(getSavedFacts()); setDraft(""); setEditingFactId(null);
    } finally { setFactsBusy(false); }
  }

  async function removeFact(id: string) {
    if (guest) { removeSavedFact(id); return; }
    setFactsBusy(true);
    try {
      const response = await fetch(`/api/v1/account/facts/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      const value = await response.json().catch(() => null) as { data?: AccountSnapshot } | null;
      if (!response.ok || !value?.data) throw new Error("fact_delete_failed");
      writeLocalAccountData(value.data);
      setFacts(getSavedFacts());
      if (editingFactId === id) { setEditingFactId(null); setDraft(""); }
    } finally { setFactsBusy(false); }
  }

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    forgetClientSession();
    window.location.href = "/app/";
  }

  async function exportAccount() {
    const response = await fetch("/api/v1/account/export", { credentials: "include" });
    if (!response.ok) return;
    const blob = new Blob([JSON.stringify(await response.json(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `lifemirror-export-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function deleteAccount() {
    if (!window.confirm("这会永久删除账户、镜像记录、人物与关系数据，且无法恢复。确定继续吗？")) return;
    const confirmation = window.prompt("请输入“永久删除”以确认：");
    if (confirmation !== "永久删除") return;
    const response = await fetch("/api/v1/account", { method: "DELETE", credentials: "include" });
    if (response.ok) { window.localStorage.clear(); window.location.href = "/app/"; }
  }

  async function persistProfile() {
    if (avatarStatus === "compressing" || profileSaving) return;
    const saved = saveUserProfile(profile);
    setProfile(saved); setProfileSaving(true); setEditingProfile(false); setProfileNotice("");
    if (guest) {
      setProfileNotice("已保存到这台设备"); setProfileSaved(true); setProfileSaving(false);
      window.setTimeout(() => setProfileSaved(false), 2200);
      return;
    }
    setProfileNotice("正在同步头像…");
    try {
      const response = await fetch("/api/v1/account/data", { method: "PUT", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ data: readLocalAccountData() }) });
      const value = await response.json().catch(() => null) as { data?: AccountSnapshot } | null;
      if (!response.ok || !value?.data) throw new Error("profile_sync_failed");
      writeLocalAccountData(value.data); setProfile(getUserProfile()); setProfileNotice("头像已保存并同步");
    } catch { setProfileNotice("已保存到这台设备，网络恢复后会自动同步"); }
    finally { setProfileSaving(false); setProfileSaved(true); window.setTimeout(() => setProfileSaved(false), 2600); }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > MAX_AVATAR_SOURCE_BYTES) { setAvatarStatus("error"); setAvatarDetail("请选择 JPG、PNG 或 WebP，原图不超过 15MB"); return; }
    setAvatarStatus("compressing"); setAvatarDetail("正在压缩头像…");
    try {
      const compressed = await compressAvatar(file);
      setProfile((current) => ({ ...current, avatar: compressed.dataUrl }));
      setAvatarStatus("ready"); setAvatarDetail(`预览已更新 · ${compressed.width}×${compressed.height} · ${readableAvatarSize(compressed.byteSize)}，点击保存后同步`);
    } catch { setAvatarStatus("error"); setAvatarDetail("这张图片暂时无法处理，请换一张再试"); }
  }

  const displayName = profile.nickname || (accountEmail ? accountEmail.split("@")[0] : "镜像旅人");
  const genderLabel = ({ hidden: "不展示", female: "女性", male: "男性", nonbinary: "非二元／其他" } as Record<GenderDisplay, string>)[profile.gender];

  if (!sessionReady) return <main className={styles.sessionLoading} aria-busy="true"><UserCircle weight="thin" /><span>正在读取你的账户…</span><AppBottomNav active="profile" /></main>;

  return <main className={styles.shell}>
    {accountEmail && <AccountDataSync />}
    <header><UserCircle weight="thin" /><small>MY LIFE MIRROR</small>{!guest && <h1>{displayName}</h1>}<p>{guest ? "当前以游客身份使用，记录仅保存在这台设备。" : "管理你的身份、镜像记录与隐私选择。"}</p></header>
    <section className={styles.identityCard} aria-labelledby="personal-profile-title">
      <div className={styles.avatar} style={{ background: profile.avatar.startsWith("preset:") ? profile.avatar.slice(7) : avatarPresets[0] }}>
        {profile.avatar && !profile.avatar.startsWith("preset:") ? <img src={profile.avatar} alt="我的头像" /> : <span>{[...displayName][0]?.toUpperCase() || "我"}</span>}
      </div>
      <div className={styles.identityText}><small>个人资料</small><h2 id="personal-profile-title">{displayName}</h2><p>{genderLabel}{birthProfile ? ` · ${birthProfile.year}年${birthProfile.month}月${birthProfile.day}日` : " · 尚未填写生日"}</p></div>
      <button type="button" onClick={() => { setEditingProfile((value) => !value); setAvatarStatus("idle"); setAvatarDetail(""); }}>{editingProfile ? <X /> : <PencilSimple />}{editingProfile ? "取消" : "编辑"}</button>
      {editingProfile && <div className={styles.profileEditor}>
        <div className={styles.avatarEditor}>
          <label className={avatarStatus === "compressing" ? styles.avatarBusy : ""}><Camera /><span>{avatarStatus === "compressing" ? "正在压缩头像…" : "上传头像"}</span><small>JPG／PNG／WebP，自动压缩后再保存</small><input type="file" accept="image/png,image/jpeg,image/webp" disabled={avatarStatus === "compressing"} onChange={(event) => void uploadAvatar(event)} /></label>
          {profile.avatar && !profile.avatar.startsWith("preset:") && <div className={styles.avatarPreview}><img src={profile.avatar} alt="待保存的头像预览" /><span>{avatarStatus === "ready" ? "待保存" : "当前头像"}</span></div>}
          <div>{avatarPresets.map((color) => <button type="button" aria-label={`使用${color}头像`} key={color} style={{ background: color }} onClick={() => setProfile((current) => ({ ...current, avatar: `preset:${color}` }))} />)}</div>
        </div>
        {avatarDetail && <p className={`${styles.avatarStatus} ${avatarStatus === "error" ? styles.avatarError : ""}`} role="status">{avatarDetail}</p>}
        <label><span>昵称</span><input maxLength={20} value={profile.nickname} onChange={(event) => setProfile((current) => ({ ...current, nickname: event.target.value }))} placeholder="怎么称呼你" /></label>
        <label><span>性别显示</span><select value={profile.gender} onChange={(event) => setProfile((current) => ({ ...current, gender: event.target.value as GenderDisplay }))}><option value="hidden">不展示</option><option value="female">女性</option><option value="male">男性</option><option value="nonbinary">非二元／其他</option></select></label>
        <button className={styles.saveProfile} type="button" disabled={avatarStatus === "compressing" || profileSaving} onClick={() => void persistProfile()}><Check />{profileSaving ? "正在保存…" : avatarStatus === "compressing" ? "正在压缩头像…" : "保存个人资料"}</button>
      </div>}
      {profileSaved && <span className={styles.savedNotice}><Check /> {profileNotice || "已保存"}</span>}
    </section>

    <section className={styles.accountSection}>
      <article><DeviceMobile /><div><small>当前身份</small><h2>{guest ? "游客 · 本机模式" : accountProvider === "invite" ? "邀请测试账户" : accountProvider === "referral" ? "受邀体验账户" : accountEmail || "正在确认账户"}</h2><p>{guest ? "记录仅保存在这台设备；登录后会自动合并到你的账户。" : ["invite", "referral"].includes(accountProvider) ? "记录已经安全保存在服务器；绑定邮箱后可以换设备继续。" : "个人镜像、明确记忆与设置已启用跨设备同步。"}</p></div></article>
      <Link href="/mirror/"><Sparkle /><span><b>查看我的镜像</b><small>回看保存过的体验与时间线</small></span><ArrowRight /></Link>
      <Link href="/app/invite/"><Gift /><span><b>邀请朋友体验拾光</b><small>生成一组体验名额；不会自动添加好友</small></span><ArrowRight /></Link>
      <Link href="/app/relationships/"><UsersThree /><span><b>好友与关系</b><small>邀请朋友、处理申请与查看双方关系镜像</small></span><ArrowRight /></Link>
      {guest ? <Link href="/app/?login=1&return=/app/profile/"><LockKey /><span><b>登录并保存进度</b><small>登录后可跨设备同步、找回记录并使用好友功能</small></span><ArrowRight /></Link> : ["invite", "referral"].includes(accountProvider) ? <Link href="/app/?bind=1&return=/app/profile/"><EnvelopeSimple /><span><b>绑定邮箱</b><small>换设备继续，当前记录不会丢失</small></span><ArrowRight /></Link> : <div className={styles.accountReadonly}><IdentificationCard /><span><b>账户邮箱</b><small>{accountEmail}</small></span><Check /></div>}
      {publicId && <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(publicId); setProfileSaved(true); window.setTimeout(() => setProfileSaved(false), 1800); } catch { /* ID remains visible for manual copy */ } }}><IdentificationCard /><span><b>LifeMirror ID</b><small>{publicId} · 点击复制，好友可用它搜索你</small></span><Copy /></button>}
      {!guest && <button type="button" onClick={() => void exportAccount()}><DownloadSimple /><span><b>导出我的数据</b><small>下载账户、镜像、表达偏好与可追溯理解记录</small></span><ArrowRight /></button>}
      {!guest && <button type="button" onClick={() => void logout()}><SignOut /><span><b>退出账户</b><small>{["invite", "referral"].includes(accountProvider) ? "未绑定邮箱前，退出后可能无法找回当前账户" : "退出后不会删除云端记录"}</small></span><ArrowRight /></button>}
      {!guest && <button type="button" onClick={() => void deleteAccount()}><Trash /><span><b>永久删除账户</b><small>删除后，后台任务也不能重建这些记录</small></span><ArrowRight /></button>}
    </section>

    <section className={styles.birthPanel} aria-labelledby="birth-profile-title">
      <header><CalendarBlank /><div><small>出生资料</small><h2 id="birth-profile-title">命盘与占星共用</h2><p>{birthProfile ? formatSavedBirthProfile(birthProfile) : "还没有保存出生资料。填写一次后，两个玩法都会自动载入。"}</p></div></header>
      <div className={styles.birthActions}>
        <Link href="/app/profile/birth/">{birthProfile ? "编辑出生资料" : "填写出生资料"} <ArrowRight /></Link>
        <Link href="/app/chart/">去看命盘</Link>
        <Link href="/app/astrology/">去看占星</Link>
        {birthProfile && <button type="button" onClick={() => { removeSavedBirthProfile(); setBirthProfile(null); }}><Trash /> 删除资料</button>}
      </div>
      <small className={styles.birthPrivacy}>{guest ? "资料仅保存在这台设备。" : "资料会随账户跨设备同步。"} 不会用于六爻或塔罗。</small>
    </section>

    <section className={styles.memoryPanel} id="memory" aria-labelledby="memory-title">
      <header><Brain /><div><small>SHIGUANG MEMORY</small><h2 id="memory-title">拾光记忆</h2><p>默认关闭。开启后，每轮只检索与当前话题有关的少量记忆；镜像历史始终只是证据，不是对你的定义。</p></div></header>
      <div className={styles.settingRows}>
        <button type="button" role="switch" aria-checked={settings.enabled} onClick={() => toggle({ enabled: !settings.enabled })}><span><b>使用长期记忆</b><small>允许拾光在对话中读取已授权的相关记忆</small></span><i className={settings.enabled ? styles.on : ""} /></button>
        <button type="button" role="switch" aria-checked={settings.explicitFacts} disabled={!settings.enabled} onClick={() => toggle({ explicitFacts: !settings.explicitFacts })}><span><b>保存明确要求记住的信息</b><small>只有你说“请记住……”时才自动保存</small></span><i className={settings.explicitFacts ? styles.on : ""} /></button>
        <button type="button" role="switch" aria-checked={settings.mirrorEvidence} disabled={!settings.enabled} onClick={() => toggle({ mirrorEvidence: !settings.mirrorEvidence })}><span><b>检索镜像历史</b><small>最多带入 3 条相关记录，并保留来源与日期</small></span><i className={settings.mirrorEvidence ? styles.on : ""} /></button>
      </div>
      <div className={styles.factEditor}>
        <label htmlFor="saved-fact">明确记忆</label>
        <div><input id="saved-fact" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void saveFact(); }} maxLength={180} placeholder="例如：我不喜欢被催着做决定" /><button type="button" onClick={() => void saveFact()} disabled={!draft.trim() || factsBusy}><FloppyDisk /> {editingFactId ? "更新" : "保存"}</button>{editingFactId && <button type="button" onClick={() => { setEditingFactId(null); setDraft(""); }}>取消</button>}</div>
        {facts.length ? <ul>{facts.map((fact) => <li key={fact.id}><span>{fact.text}<small>{new Date(fact.updatedAt).toLocaleDateString("zh-CN")}</small></span><button type="button" onClick={() => { setEditingFactId(fact.id); setDraft(fact.text); }} disabled={factsBusy} aria-label={`纠正记忆：${fact.text}`}><PencilSimple /></button><button type="button" onClick={() => void removeFact(fact.id)} disabled={factsBusy} aria-label={`删除记忆：${fact.text}`}><Trash /></button></li>)}</ul> : <p>还没有明确记忆。你可以在这里添加，或在聊天中说“请记住……”。</p>}
      </div>
      {!guest && <section className={styles.expressionPreferences} aria-labelledby="expression-preferences-title">
        <div><small>回复方式</small><h3 id="expression-preferences-title">你希望拾光怎么和你说话</h3><p>这是你自己设定的表达偏好，不是系统对你的性格判断；随时可改，且不会改变记忆内容。</p></div>
        <label><span>语气</span><select value={expressionPreferences.tone} disabled={expressionBusy} onChange={(event) => void saveExpressionPreferences({ ...expressionPreferences, tone: event.target.value as ExpressionPreferences["tone"] })}><option value="balanced">自然平衡</option><option value="direct">直接一点</option><option value="gentle">温柔一点</option><option value="clear">清楚具体</option></select></label>
        <label><span>篇幅</span><select value={expressionPreferences.length} disabled={expressionBusy} onChange={(event) => void saveExpressionPreferences({ ...expressionPreferences, length: event.target.value as ExpressionPreferences["length"] })}><option value="short">简短</option><option value="standard">适中</option><option value="detailed">多解释一点</option></select></label>
        <label><span>追问</span><select value={expressionPreferences.followUp} disabled={expressionBusy} onChange={(event) => void saveExpressionPreferences({ ...expressionPreferences, followUp: event.target.value as ExpressionPreferences["followUp"] })}><option value="natural">自然决定</option><option value="ask">可以多问一句</option><option value="avoid">少把问题抛给我</option></select></label>
        {expressionSaved && <small className={styles.expressionSaved}><Check /> 已更新</small>}
      </section>}
    </section>
    <p className={styles.privacy}><LockKey /> LifeMirror 不会在未经授权时上传设备内记录。</p>
    <AppBottomNav active="profile" />
  </main>;
}
