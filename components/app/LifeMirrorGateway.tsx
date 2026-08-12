"use client";

import { Aperture, ArrowLeft, ArrowRight, ChatCircleDots, CircleNotch, EnvelopeSimple, Key, LockKey, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { accountLoginPayload, finishAccountLogin, type AccountSnapshot } from "@/lib/account-data";
import styles from "./LifeMirrorGateway.module.css";

const GUEST_SESSION_KEY = "life-mirror:guest-session:v1";
const ONBOARDING_KEY = "life-mirror:onboarding:v1";
type LoginResponse = { data: AccountSnapshot; user: { email?: string | null; provider?: string }; created?: boolean };
type Step = "invite" | "email" | "code";

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

  async function enterWithInvite(rawCode: string, destination = returnTo) {
    const normalized = rawCode.normalize("NFKC").trim().toUpperCase().replace(/\s+/g, "");
    if (!normalized) { setError("请输入邀请码。"); return; }
    setInviteCode(normalized); setBusy(true); setError("");
    try {
      const result = await authRequest<LoginResponse>("/api/v1/auth/invite", { method: "POST", body: JSON.stringify({ code: normalized, ...accountLoginPayload() }) });
      finishAccountLogin(result.data);
      window.localStorage.removeItem(GUEST_SESSION_KEY);
      if (result.created) window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ version: 1, stage: "welcome", startedAt: new Date().toISOString() }));
      router.replace(destination);
    } catch (cause) { setError(message(cause)); setChecking(false); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    let active = true;
    async function open() {
      const params = new URLSearchParams(window.location.search);
      const requestedReturn = params.get("return") || "/app/home/";
      const safeReturn = requestedReturn.startsWith("/app/") ? requestedReturn : "/app/home/";
      const invite = params.get("invite") || "";
      const bind = params.get("bind") === "1";
      const forceLogin = params.get("login") === "1" || bind;
      setReturnTo(safeReturn); setBinding(bind);
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
          finishAccountLogin(result.data); router.replace(safeReturn); return;
        } catch (cause) { if (active) setError(message(cause)); }
      } else if (!forceLogin) {
        try { await authRequest("/api/v1/auth/session"); router.replace("/app/home/"); return; } catch { /* show invite */ }
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
        finishAccountLogin(result.data); router.replace(returnTo);
      }
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  if (checking) return <main className={styles.checking}><CircleNotch className={styles.spin} /><span>{inviteCode ? "正在确认你的邀请…" : "正在打开你的镜像…"}</span></main>;

  return <main className={styles.shell}>
    <header><Link href="/"><Aperture weight="thin" /><span><b>LifeMirror</b><small>拾光 · PERSONAL MIRROR</small></span></Link><span><LockKey /> 你的内容属于你</span></header>
    <section className={styles.layout}>
      <div className={styles.intro}><small><Sparkle /> MEET SHIGUANG</small><h1>有事就说，<br />我会记得后来。</h1><p>拾光是一位会记得后来发生了什么的 AI 朋友。测试期间通过邀请进入，不需要先注册邮箱，也不用先理解任何玩法。</p><ol><li><b>先直接聊一件事</b><span>不用选择分析方式</span></li><li><b>保留未完的进展</b><span>下次回来可以从这里接着说</span></li><li><b>再决定是否绑定</b><span>体验后再用邮箱保留跨设备记录</span></li></ol></div>
      <form className={styles.card} onSubmit={submit}>
        {step === "invite" ? <Key weight="thin" /> : step === "email" ? <EnvelopeSimple weight="thin" /> : <LockKey weight="thin" />}
        <h2>{step === "invite" ? "加入拾光测试" : step === "email" ? binding ? "绑定邮箱" : "已有账户登录" : "输入验证码"}</h2>
        <p>{step === "invite" ? "输入邀请人发给你的测试码；邀请链接会自动完成这一步。" : step === "email" ? binding ? "绑定后可以换设备继续，当前测试记录不会丢失。" : "邮箱只用于找回已有账户和跨设备同步。" : `验证码已发送到 ${email}，10 分钟内有效。`}</p>
        {step === "invite" && <label>邀请码<input required autoCapitalize="characters" spellCheck={false} autoComplete="one-time-code" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="例如 SHIGUANG-01" /></label>}
        {step === "email" && <label>邮箱<input type="email" required inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => setEmail((value) => value.normalize("NFKC").trim().toLowerCase())} placeholder="you@example.com" /></label>}
        {step === "code" && <label>6 位验证码<input className={styles.codeInput} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label>}
        {error && <div className={styles.error} role="alert">{error}</div>}
        <button className={styles.primary} disabled={busy || (step === "code" && code.length !== 6)}>{busy ? <CircleNotch className={styles.spin} /> : step === "invite" ? <>开始和拾光聊聊 <ArrowRight /></> : step === "email" ? "发送验证码" : "验证并继续"}</button>
        {step === "code" && <button className={styles.switcher} type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }}><ArrowLeft /> 更换邮箱</button>}
        {step === "invite" && <button className={styles.switcher} type="button" onClick={() => { setStep("email"); setError(""); }}>已有账户？登录</button>}
        {step === "email" && !binding && <><div className={styles.divider}><span>也可以</span></div><a className={styles.chatgpt} href={`/signin-with-chatgpt?return_to=${encodeURIComponent(`/app/?chatgpt=1&return=${encodeURIComponent(returnTo)}`)}`}><ChatCircleDots /> 使用 ChatGPT 登录</a><button className={styles.switcher} type="button" onClick={() => { setStep("invite"); setError(""); }}><ArrowLeft /> 返回邀请码</button></>}
        <small className={styles.privacyNote}>测试账户保存在服务器；不会公开你的聊天。你可以随时导出或删除账户。</small>
      </form>
    </section>
  </main>;
}
