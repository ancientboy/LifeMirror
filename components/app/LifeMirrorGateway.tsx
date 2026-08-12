"use client";

import { Aperture, ArrowLeft, ArrowRight, ChatCircleDots, CircleNotch, EnvelopeSimple, LockKey, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { accountLoginPayload, finishAccountLogin, type AccountSnapshot } from "@/lib/account-data";
import styles from "./LifeMirrorGateway.module.css";

const GUEST_SESSION_KEY = "life-mirror:guest-session:v1";
type LoginResponse = { data: AccountSnapshot; user: { email: string } };

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { "content-type": "application/json", ...init?.headers }, ...init });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "server_unavailable");
  return payload;
}

function message(error: unknown) {
  const code = error instanceof Error ? error.message : "server_unavailable";
  return ({ invalid_email: "请输入有效的邮箱地址。", code_cooldown: "验证码刚刚已发送，请稍后再试。", code_rate_limited: "请求次数较多，请 15 分钟后再试。", invalid_code: "验证码不正确，请重新检查。", code_expired: "验证码已过期，请重新获取。", code_attempts_exceeded: "尝试次数过多，请重新获取验证码。", email_delivery_failed: "验证码邮件发送失败，请稍后再试。", email_service_not_configured: "邮件服务正在配置中，请稍后再试。", chatgpt_identity_unavailable: "未能取得 ChatGPT 登录身份，请重试或使用邮箱。" } as Record<string, string>)[code] ?? "暂时无法登录，请稍后再试。";
}

export function LifeMirrorGateway() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [returnTo, setReturnTo] = useState("/app/home/");

  useEffect(() => {
    let active = true;
    async function open() {
      const params = new URLSearchParams(window.location.search);
      const requestedReturn = params.get("return") || "/app/home/";
      const safeReturn = requestedReturn.startsWith("/app/") ? requestedReturn : "/app/home/";
      setReturnTo(safeReturn);
      const forceLogin = params.get("login") === "1";
      if (!forceLogin && window.localStorage.getItem(GUEST_SESSION_KEY) === "active") { router.replace("/app/home/"); return; }
      if (params.get("chatgpt") === "1") {
        try {
          const result = await authRequest<LoginResponse>("/api/v1/auth/chatgpt", { method: "POST", body: JSON.stringify(accountLoginPayload()) });
          finishAccountLogin(result.data); router.replace(safeReturn); return;
        } catch (cause) { if (active) setError(message(cause)); }
      } else if (!forceLogin) {
        try { await authRequest("/api/v1/auth/session"); router.replace("/app/home/"); return; } catch { /* show login */ }
      }
      if (active) setChecking(false);
    }
    void open();
    return () => { active = false; };
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
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

  function enterAsGuest() { window.localStorage.setItem(GUEST_SESSION_KEY, "active"); router.push("/app/home/"); }
  if (checking) return <main className={styles.checking}><CircleNotch /><span>正在打开你的镜像…</span></main>;

  return <main className={styles.shell}>
    <header><Link href="/"><Aperture weight="thin" /><span><b>LifeMirror</b><small>拾光 · PERSONAL MIRROR</small></span></Link><span><LockKey /> 你的内容属于你</span></header>
    <section className={styles.layout}>
      <div className={styles.intro}><small><Sparkle /> MEET SHIGUANG</small><h1>有事就说，<br />我会记得后来。</h1><p>拾光是一位会记得后来发生了什么的 AI 朋友。它不只给一次回答，也会在事情有结果时从上次的判断接着聊。</p><ol><li><b>先给判断</b><span>不把问题原样丢回给你</span></li><li><b>记住未完的事</b><span>跨设备保留事件与回访状态</span></li><li><b>保留选择</b><span>也可以继续使用本机游客模式</span></li></ol></div>
      <form className={styles.card} onSubmit={submit}>
        {step === "email" ? <EnvelopeSimple weight="thin" /> : <LockKey weight="thin" />}
        <h2>{step === "email" ? "邮箱登录" : "输入验证码"}</h2>
        <p>{step === "email" ? "首次验证即自动注册，不再区分注册与登录。" : `验证码已发送到 ${email}，10 分钟内有效。`}</p>
        {step === "email" ? <label>邮箱<input type="email" required inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => setEmail((value) => value.normalize("NFKC").trim().toLowerCase())} placeholder="you@example.com" /></label> : <label>6 位验证码<input className={styles.codeInput} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label>}
        {error && <div className={styles.error} role="alert">{error}</div>}
        <button className={styles.primary} disabled={busy || (step === "code" && code.length !== 6)}>{busy ? <CircleNotch className={styles.spin} /> : step === "email" ? "发送验证码" : "验证并登录"}</button>
        {step === "code" && <button className={styles.switcher} type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }}><ArrowLeft /> 更换邮箱</button>}
        <div className={styles.divider}><span>其他方式</span></div>
        <a className={styles.chatgpt} href={`/signin-with-chatgpt?return_to=${encodeURIComponent(`/app/?chatgpt=1&return=${encodeURIComponent(returnTo)}`)}`}><ChatCircleDots /> 使用 ChatGPT 登录（可选）</a>
        <button className={styles.guest} type="button" onClick={enterAsGuest}>以游客身份进入 <ArrowRight /></button>
      </form>
    </section>
  </main>;
}
