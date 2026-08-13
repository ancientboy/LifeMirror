"use client";

import { Aperture, ArrowLeft, ArrowRight, ChatCircleDots, CircleNotch, EnvelopeSimple, Gift, Key, LockKey, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { accountLoginPayload, finishAccountLogin, type AccountSnapshot } from "@/lib/account-data";
import { rememberAuthenticatedSession, rememberGuestSession } from "@/lib/client-session";
import styles from "./LifeMirrorGateway.module.css";

const GUEST_SESSION_KEY = "life-mirror:guest-session:v1";
const ONBOARDING_KEY = "life-mirror:onboarding:v1";
type LoginResponse = { data: AccountSnapshot; user: { email?: string | null; provider?: string }; created?: boolean };
type ExperienceInvitePreview = { invite: { code: string; expiresAt: string; remaining: number; inviter?: { name?: string } | null } };
type Step = "invite" | "referral" | "email" | "code";

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { "content-type": "application/json", ...init?.headers }, ...init });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "server_unavailable");
  return payload;
}

function message(error: unknown) {
  const code = error instanceof Error ? error.message : "server_unavailable";
  return ({
    invalid_invite: "这个邀请码无效，请检查后重试。",
    invite_expired: "这个邀请已经过期，请联系邀请你的人。",
    invite_full: "这批测试名额已经用完，请联系邀请你的人。",
    invite_revoked: "这个邀请已停止使用，请联系邀请你的人。",
    invalid_experience_invite: "这个体验邀请无效，请检查链接后重试。",
    experience_invite_expired: "这个体验邀请已经过期，可以请朋友重新邀请你。",
    experience_invite_full: "这组体验名额暂时用完了，可以请朋友稍后再发一次。",
    experience_invite_revoked: "这个体验邀请已经停止使用。",
    invalid_email: "请输入有效的邮箱地址。",
    code_cooldown: "验证码刚刚已发送，请稍后再试。",
    code_rate_limited: "请求次数较多，请 15 分钟后再试。",
    invalid_code: "验证码不正确，请重新检查。",
    code_expired: "验证码已过期，请重新获取。",
    code_attempts_exceeded: "尝试次数过多，请重新获取验证码。",
    email_delivery_failed: "验证码邮件发送失败，请稍后再试。",
    email_service_not_configured: "邮件服务正在配置中，请稍后再试。",
    chatgpt_identity_unavailable: "未能取得 ChatGPT 登录身份，请重试或使用邮箱。",
  } as Record<string, string>)[code] ?? "暂时无法进入，请稍后再试。";
}

export function LifeMirrorGateway() {
  const router = useRouter();
  const autoInviteStarted = useRef(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>("invite");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [returnTo, setReturnTo] = useState("/app/home/");
  const [binding, setBinding] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referral, setReferral] = useState<ExperienceInvitePreview["invite"] | null>(null);

  function enterAsGuest() {
    rememberGuestSession();
    router.replace(returnTo);
  }

  async function enterWithInvite(rawCode: string, destination = returnTo) {
    const normalized = rawCode.normalize("NFKC").trim().toUpperCase().replace(/\s+/g, "");
    if (!normalized) { setError("请输入邀请码。"); return; }
    setInviteCode(normalized); setBusy(true); setError("");
    try {
      const result = await authRequest<LoginResponse>("/api/v1/auth/invite", { method: "POST", body: JSON.stringify({ code: normalized, ...accountLoginPayload() }) });
      finishAccountLogin(result.data, result.user);
      window.localStorage.removeItem(GUEST_SESSION_KEY);
      if (result.created) window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ version: 1, stage: "welcome", startedAt: new Date().toISOString() }));
      router.replace(destination);
    } catch (cause) { setError(message(cause)); setChecking(false); }
    finally { setBusy(false); }
  }

  async function enterWithExperienceInvite() {
    if (!referralCode) return;
    setBusy(true); setError("");
    try {
      const result = await authRequest<LoginResponse & { inviter?: { name?: string } | null }>("/api/v1/auth/experience-invite", { method: "POST", body: JSON.stringify({ code: referralCode, ...accountLoginPayload() }) });
      finishAccountLogin(result.data, result.user);
      window.localStorage.removeItem(GUEST_SESSION_KEY);
      window.localStorage.setItem("life-mirror:experience-invite:v1", JSON.stringify({ inviterName: result.inviter?.name || referral?.inviter?.name || "朋友", acceptedAt: new Date().toISOString() }));
      if (result.created) window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ version: 1, stage: "welcome", startedAt: new Date().toISOString() }));
      router.replace(returnTo);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    let active = true;
    async function open() {
      const params = new URLSearchParams(window.location.search);
      const requestedReturn = params.get("return") || "/app/home/";
      const safeReturn = requestedReturn.startsWith("/app/") ? requestedReturn : "/app/home/";
      const invite = params.get("invite") || "";
      const experienceCode = params.get("referral") || "";
      const bind = params.get("bind") === "1";
      const forceLogin = params.get("login") === "1" || bind;
      setReturnTo(safeReturn); setBinding(bind);
      if (experienceCode) {
        const normalized = experienceCode.normalize("NFKC").trim().toUpperCase().replace(/\s+/g, "");
        setReferralCode(normalized);
        try {
          const preview = await authRequest<ExperienceInvitePreview>(`/api/v1/auth/experience-invite?code=${encodeURIComponent(normalized)}`);
          if (active) { setReferral(preview.invite); setStep("referral"); setChecking(false); }
        } catch (cause) { if (active) { setError(message(cause)); setStep("referral"); setChecking(false); } }
        return;
      }
      if (invite && !autoInviteStarted.current) {
        autoInviteStarted.current = true;
        setInviteCode(invite);
        await enterWithInvite(invite, safeReturn);
        return;
      }
      if (!forceLogin && window.localStorage.getItem(GUEST_SESSION_KEY) === "active") { router.replace("/app/home/"); return; }
      if (params.get("chatgpt") === "1") {
        try {
          const result = await authRequest<LoginResponse>("/api/v1/auth/chatgpt", { method: "POST", body: JSON.stringify(accountLoginPayload()) });
          finishAccountLogin(result.data, result.user); router.replace(safeReturn); return;
        } catch (cause) { if (active) setError(message(cause)); }
      } else if (!forceLogin) {
        try { const session = await authRequest<{ user?: LoginResponse["user"] }>("/api/v1/auth/session"); rememberAuthenticatedSession(session.user); router.replace("/app/home/"); return; } catch { /* show invite */ }
      }
      if (active) { setStep(forceLogin ? "email" : "invite"); setChecking(false); }
    }
    void open();
    return () => { active = false; };
  // enterWithInvite deliberately reads the destination passed above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (step === "referral") { await enterWithExperienceInvite(); return; }
    if (step === "invite") { await enterWithInvite(inviteCode); return; }
    setBusy(true); setError("");
    const normalizedEmail = email.normalize("NFKC").trim().toLowerCase();
    setEmail(normalizedEmail);
    try {
      if (step === "email") {
        await authRequest("/api/v1/auth/request-code", { method: "POST", body: JSON.stringify({ email: normalizedEmail }) });
        setStep("code");
      } else {
        const result = await authRequest<LoginResponse>("/api/v1/auth/verify-code", { method: "POST", body: JSON.stringify({ email: normalizedEmail, code, ...accountLoginPayload() }) });
        finishAccountLogin(result.data, result.user); router.replace(returnTo);
      }
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  if (checking) return <main className={styles.checking}><CircleNotch className={styles.spin} /><span>{inviteCode ? "正在确认你的邀请…" : "正在打开你的镜像…"}</span></main>;

  return <main className={styles.shell}>
    <header><Link href="/"><Aperture weight="thin" /><span><b>LifeMirror</b><small>拾光 · PERSONAL MIRROR</small></span></Link><span><LockKey /> 你的内容属于你</span></header>
    <section className={styles.layout}>
      <div className={styles.intro}><small><Sparkle /> MEET SHIGUANG</small><h1>有事就说，<br />我会记得后来。</h1><p>拾光是一位会记得后来发生了什么的 AI 朋友。测试期间可以直接以游客身份体验，不需要先注册，也不用先理解任何玩法。</p><ol><li><b>先直接聊一件事</b><span>不用选择分析方式</span></li><li><b>先在这台设备继续</b><span>游客记录不会上传到其他设备</span></li><li><b>需要时再登录</b><span>登录后可同步、找回并使用好友功能</span></li></ol></div>
      <form className={styles.card} onSubmit={submit}>
        {step === "invite" ? <Key weight="thin" /> : step === "referral" ? <Gift weight="thin" /> : step === "email" ? <EnvelopeSimple weight="thin" /> : <LockKey weight="thin" />}
        <h2>{step === "invite" ? "直接开始体验" : step === "referral" ? `${referral?.inviter?.name || "一位朋友"} 邀请你体验拾光` : step === "email" ? binding ? "绑定邮箱" : "登录并保存进度" : "输入验证码"}</h2>
        <p>{step === "invite" ? "无需注册。游客记录只保存在当前设备，之后可以再登录同步。" : step === "referral" ? "无需注册，也没有聊天次数或核心功能限制。接受后会为你保存体验；是否添加邀请人为好友，之后仍由你决定。" : step === "email" ? binding ? "绑定后可以换设备继续，当前测试记录不会丢失。" : "登录用于跨设备同步、找回记录和好友功能。" : `验证码已发送到 ${email}，10 分钟内有效。`}</p>
        {step === "invite" && <button className={styles.primary} type="button" onClick={enterAsGuest}>直接和拾光聊聊 <ArrowRight /></button>}
        {step === "referral" && <button className={styles.primary} type="submit" disabled={busy || !referral}>{busy ? <CircleNotch className={styles.spin} /> : <>接受邀请，直接开始 <ArrowRight /></>}</button>}
        {step === "email" && <label>邮箱<input type="email" required inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => setEmail((value) => value.normalize("NFKC").trim().toLowerCase())} placeholder="you@example.com" /></label>}
        {step === "code" && <label>6 位验证码<input className={styles.codeInput} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label>}
        {error && <div className={styles.error} role="alert">{error}</div>}
        {step !== "invite" && step !== "referral" && <button className={styles.primary} disabled={busy || (step === "code" && code.length !== 6)}>{busy ? <CircleNotch className={styles.spin} /> : step === "email" ? "发送验证码" : "验证并继续"}</button>}
        {step === "code" && <button className={styles.switcher} type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }}><ArrowLeft /> 更换邮箱</button>}
        {step === "referral" && <button className={styles.switcher} type="button" onClick={enterAsGuest}>先以游客身份看看</button>}
        {step === "invite" && <><button className={styles.switcher} type="button" onClick={() => { setStep("email"); setError(""); }}>登录并保存进度</button><details className={styles.inviteDetails}><summary>我有内测体验码</summary><label>内测体验码<input required autoCapitalize="characters" spellCheck={false} autoComplete="one-time-code" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="例如 SHIGUANG-01" /></label><button className={styles.inviteButton} disabled={busy}>{busy ? <CircleNotch className={styles.spin} /> : <>使用体验码进入 <ArrowRight /></>}</button><small>体验码用于定向测试和活动，可创建无需邮箱的云端测试账户。</small></details></>}
        {step === "email" && !binding && <><div className={styles.divider}><span>也可以</span></div><a className={styles.chatgpt} href={`/signin-with-chatgpt?return_to=${encodeURIComponent(`/app/?chatgpt=1&return=${encodeURIComponent(returnTo)}`)}`}><ChatCircleDots /> 使用 ChatGPT 登录</a><button className={styles.switcher} type="button" onClick={() => { setStep("invite"); setError(""); }}><ArrowLeft /> 返回直接体验</button></>}
        <small className={styles.privacyNote}>{step === "invite" ? "游客内容只保存在当前设备，不会自动公开或同步。" : step === "referral" ? "接受体验邀请不会自动添加好友，也不会把你的对话发给邀请人。" : "账户内容会安全保存在服务器；你可以随时导出或删除。"}</small>
      </form>
    </section>
  </main>;
}
