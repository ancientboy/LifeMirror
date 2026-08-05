"use client";

import { ArrowRight, Brain, CalendarBlank, DeviceMobile, FloppyDisk, LockKey, SignOut, Sparkle, Trash, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { addSavedFact, getMemorySettings, getSavedFacts, MEMORY_CHANGED_EVENT, removeSavedFact, updateMemorySettings, type MemorySettings, type SavedFact } from "@/lib/shiguang-memory";
import { AppBottomNav } from "./AppBottomNav";
import styles from "./ProfileHub.module.css";
import { AccountDataSync } from "./AccountDataSync";
import { BIRTH_PROFILE_CHANGED_EVENT, formatSavedBirthProfile, getSavedBirthProfile, removeSavedBirthProfile, type SavedBirthProfile } from "@/lib/birth-profile";

export function ProfileHub() {
  const [guest, setGuest] = useState(true);
  const [accountEmail, setAccountEmail] = useState("");
  const [settings, setSettings] = useState<MemorySettings>({ enabled: false, explicitFacts: true, mirrorEvidence: true });
  const [facts, setFacts] = useState<SavedFact[]>([]);
  const [draft, setDraft] = useState("");
  const [birthProfile, setBirthProfile] = useState<SavedBirthProfile | null>(null);

  useEffect(() => {
    const sync = () => { setSettings(getMemorySettings()); setFacts(getSavedFacts()); setBirthProfile(getSavedBirthProfile()); };
    const isGuest = window.localStorage.getItem("life-mirror:guest-session:v1") === "active";
    setGuest(isGuest);
    if (!isGuest) fetch("/api/v1/auth/session", { credentials: "include" }).then(async (response) => {
      if (!response.ok) { setGuest(true); return; }
      const session = await response.json() as { user?: { email?: string } };
      setAccountEmail(session.user?.email ?? "");
      setGuest(false);
    }).catch(() => undefined);
    sync();
    window.addEventListener(MEMORY_CHANGED_EVENT, sync);
    window.addEventListener(BIRTH_PROFILE_CHANGED_EVENT, sync);
    return () => { window.removeEventListener(MEMORY_CHANGED_EVENT, sync); window.removeEventListener(BIRTH_PROFILE_CHANGED_EVENT, sync); };
  }, []);

  function toggle(next: Partial<MemorySettings>) {
    setSettings(updateMemorySettings(next));
  }

  function saveFact() {
    if (!draft.trim()) return;
    addSavedFact(draft);
    setDraft("");
  }

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    window.location.href = "/app/";
  }

  return <main className={styles.shell}>
    {accountEmail && <AccountDataSync />}
    <header><UserCircle weight="thin" /><small>MY LIFE MIRROR</small><h1>我的</h1><p>{guest ? "当前以游客身份使用，记录仅保存在这台设备。" : "管理你的身份、镜像记录与隐私选择。"}</p></header>
    <section className={styles.accountSection}>
      <article><DeviceMobile /><div><small>当前身份</small><h2>{guest ? "游客 · 本机模式" : accountEmail || "正在确认账户"}</h2><p>{guest ? "记录仅保存在这台设备；登录后会自动合并到你的账户。" : "个人镜像、明确记忆与设置已启用跨设备同步。"}</p></div></article>
      <Link href="/mirror/"><Sparkle /><span><b>查看我的镜像</b><small>回看保存过的体验与时间线</small></span><ArrowRight /></Link>
      <Link href="/app/"><LockKey /><span><b>登录与账户</b><small>查看当前服务器连接状态</small></span><ArrowRight /></Link>
      {accountEmail && <button type="button" onClick={() => void logout()}><SignOut /><span><b>退出账户</b><small>退出后不会删除云端记录</small></span><ArrowRight /></button>}
    </section>

    <section className={styles.birthPanel} aria-labelledby="birth-profile-title">
      <header><CalendarBlank /><div><small>出生资料</small><h2 id="birth-profile-title">命盘与占星共用</h2><p>{birthProfile ? formatSavedBirthProfile(birthProfile) : "还没有保存出生资料。填写一次后，两个玩法都会自动载入。"}</p></div></header>
      <div className={styles.birthActions}>
        <Link href="/app/chart/">打开命盘 <ArrowRight /></Link>
        <Link href="/app/astrology/">打开占星 <ArrowRight /></Link>
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
        <div><input id="saved-fact" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveFact(); }} maxLength={180} placeholder="例如：我不喜欢被催着做决定" /><button type="button" onClick={saveFact} disabled={!draft.trim()}><FloppyDisk /> 保存</button></div>
        {facts.length ? <ul>{facts.map((fact) => <li key={fact.id}><span>{fact.text}<small>{new Date(fact.updatedAt).toLocaleDateString("zh-CN")}</small></span><button type="button" onClick={() => removeSavedFact(fact.id)} aria-label={`删除记忆：${fact.text}`}><Trash /></button></li>)}</ul> : <p>还没有明确记忆。你可以在这里添加，或在聊天中说“请记住……”。</p>}
      </div>
    </section>
    <p className={styles.privacy}><LockKey /> LifeMirror 不会在未经授权时上传设备内记录。</p>
    <AppBottomNav active="profile" />
  </main>;
}
