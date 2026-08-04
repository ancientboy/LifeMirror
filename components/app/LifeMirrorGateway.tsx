"use client";

import { Aperture, ArrowRight, CircleNotch, LockKey, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./LifeMirrorGateway.module.css";

const GUEST_SESSION_KEY = "life-mirror:guest-session:v1";

async function authRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, { credentials: "include", headers: { "content-type": "application/json", ...init?.headers }, ...init });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() as { error?: string } : null;
  if (!response.ok) throw new Error(payload?.error ?? "server_unavailable");
  return payload;
}

export function LifeMirrorGateway() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.localStorage.getItem(GUEST_SESSION_KEY) === "active") {
      router.replace("/app/home/");
      return;
    }
    authRequest("/api/v1/auth/session").then(() => router.replace("/app/home/")).catch(() => setChecking(false));
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await authRequest(`/api/v1/auth/${mode}`, { method: "POST", body: JSON.stringify({ email, password }) });
      router.replace("/app/home/");
    } catch {
      setError("个人镜像服务器尚未接通，暂时无法登录；你可以先用游客模式完整体验，记录只保存在当前设备。");
    } finally { setBusy(false); }
  }

  function enterAsGuest() {
    window.localStorage.setItem(GUEST_SESSION_KEY, "active");
    router.push("/app/home/");
  }

  if (checking) return <main className={styles.checking}><CircleNotch /><span>正在打开你的镜像…</span></main>;

  return <main className={styles.shell}>
    <header><Link href="/"><Aperture weight="thin" /><span><b>LifeMirror</b><small>拾光 · PERSONAL MIRROR</small></span></Link><span><LockKey /> 你的内容属于你</span></header>
    <section className={styles.layout}>
      <div className={styles.intro}><small><Sparkle /> STEP 02 · ENTER YOUR MIRROR</small><h1>先选择身份，<br />再和拾光开始。</h1><p>登录用于跨设备同步与长期镜像；游客也能体验聊天与四种工具，数据只保存在当前设备。</p><ol><li><b>进入拾光首页</b><span>先聊天，不先选游戏</span></li><li><b>按需要选择镜子</b><span>六爻、命盘、塔罗、占星</span></li><li><b>带着结果继续聊</b><span>追问、保存、以后再回来</span></li></ol></div>
      <form className={styles.card} onSubmit={submit}><LockKey weight="thin" /><h2>{mode === "login" ? "回到你的镜像" : "建立第一面镜子"}</h2><p>服务器登录接通前，建议先选择游客体验。</p><label>邮箱<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>密码<input type="password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 12 位" /></label>{error && <div className={styles.error} role="alert">{error}</div>}<button className={styles.primary} disabled={busy}>{busy ? <CircleNotch className={styles.spin} /> : mode === "login" ? "登录" : "创建账户"}</button><div className={styles.divider}><span>或</span></div><button className={styles.guest} type="button" onClick={enterAsGuest}>以游客身份进入拾光首页 <ArrowRight /></button><button className={styles.switcher} type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "第一次使用？创建账户" : "已有账户？直接登录"}</button></form>
    </section>
  </main>;
}
