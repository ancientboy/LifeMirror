"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleNotch, Copy, Key, ShieldCheck, Sparkle, WarningCircle } from "@phosphor-icons/react";
import styles from "./OperationsConsole.module.css";

type Acceptance = { result: "passed" | "failed"; sourceCommit: string; schemaVersion: number; createdAt: string; checks: Record<string, boolean> };
type CoreExperience = { sampleUsers: number; invitedUsers?: number; onboardingPromptUseRate?: number; helpfulReplyRate?: number; retryRate?: number; firstConversationContinuationRate: number; eventCreationRate: number; dayOneRetention: number; daySevenRetention: number; realityFeedbackRate: number; memoryAccuracyRate: number; toolContinuationRate: number; shareIntentRate: number; monetizationGate: { minimumSampleReached: boolean; observationWindowDays: number; ready: boolean } };
type Summary = { windowHours: number; llm: Array<Record<string, unknown>>; tasks: Array<{ status: string; total: number }>; moderation: Array<{ status: string; total: number }>; deliveries: Array<{ state: string; total: number }>; shareFunnel: Array<{ eventType: string; total: number }>; feedback: Array<{ feedback: string; total: number }>; coreExperience: CoreExperience; acceptance: Acceptance | null; alerts: Array<{ kind: string; operation: string; value: number }>; privacy: string };
type Report = { id: string; reasonCode: string; status: string; resolutionCode?: string | null; createdAt: string };
type Invite = { id: string; label: string; batch: string; maxUses: number; useCount: number; participants: number; boundAccounts: number; expiresAt: string; revokedAt?: string | null };

export function OperationsConsole() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [newInviteCode, setNewInviteCode] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "error">("loading");
  const [acceptanceState, setAcceptanceState] = useState<"idle" | "running" | "passed" | "failed">("idle");

  async function load() {
    setState("loading");
    try {
      const [summaryResponse, moderationResponse, invitesResponse] = await Promise.all([
        fetch("/api/v1/ops/summary", { credentials: "include" }),
        fetch("/api/v1/ops/moderation", { credentials: "include" }),
        fetch("/api/v1/ops/invites", { credentials: "include" }),
      ]);
      if (summaryResponse.status === 401 || moderationResponse.status === 401 || invitesResponse.status === 401) { setState("forbidden"); return; }
      if (!summaryResponse.ok || !moderationResponse.ok || !invitesResponse.ok) throw new Error("ops_unavailable");
      setSummary(await summaryResponse.json());
      setReports((await moderationResponse.json()).reports ?? []);
      setInvites((await invitesResponse.json()).invites ?? []);
      setState("ready");
    } catch { setState("error"); }
  }

  useEffect(() => { void load(); }, []);

  async function resolve(reportId: string, resolutionCode: "confirmed" | "no_action" | "duplicate") {
    const response = await fetch("/api/v1/ops/moderation", { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ reportId, resolutionCode }) });
    if (response.ok) await load();
  }

  async function runAcceptance() {
    setAcceptanceState("running");
    try {
      const response = await fetch("/api/v1/ops/acceptance/run", { method: "POST", credentials: "include" });
      setAcceptanceState(response.ok ? "passed" : "failed");
      await load();
    } catch { setAcceptanceState("failed"); }
  }

  async function createInvite() {
    const code = inviteCode.trim().toUpperCase() || `LM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const response = await fetch("/api/v1/ops/invites", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, label: "首轮体验测试", batch: "beta-01", maxUses: 10 }) });
    const value = await response.json().catch(() => null) as { invite?: { code?: string } } | null;
    if (!response.ok || !value?.invite?.code) return;
    setNewInviteCode(value.invite.code); setInviteCode(""); await load();
  }

  async function revokeInvite(inviteId: string, revoked: boolean) {
    const response = await fetch("/api/v1/ops/invites", { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ inviteId, revoked }) });
    if (response.ok) await load();
  }

  return <main className={styles.shell}>
    <header><Link href="/app/profile/"><ArrowLeft /> 返回我的</Link><small>PRIVATE OPERATIONS</small><h1>LifeMirror 运行与安全</h1><p>只显示无正文汇总、固定原因代码与运行状态，不展示聊天、分享内容或人物资料。</p></header>
    {state === "loading" && <section className={styles.state}><CircleNotch />正在载入运行状态…</section>}
    {state === "forbidden" && <section className={styles.state}><ShieldCheck /><b>当前账户没有运营权限</b><p>这个页面只对明确列入生产运营名单的账户开放。</p></section>}
    {state === "error" && <section className={styles.state}><WarningCircle /><b>暂时无法读取运行状态</b><button type="button" onClick={() => void load()}>重新加载</button></section>}
    {state === "ready" && summary && <>
      <section className={styles.grid}>
        <article><small>后台任务</small><h2>{summary.tasks.reduce((sum, item) => sum + Number(item.total), 0)}</h2><p>{summary.tasks.map((item) => `${item.status} ${item.total}`).join(" · ") || "无待处理任务"}</p></article>
        <article><small>邮件投递</small><h2>{summary.deliveries.reduce((sum, item) => sum + Number(item.total), 0)}</h2><p>{summary.deliveries.map((item) => `${item.state} ${item.total}`).join(" · ") || "无投递记录"}</p></article>
        <article><small>分享漏斗</small><h2>{summary.shareFunnel.reduce((sum, item) => sum + Number(item.total), 0)}</h2><p>{summary.shareFunnel.map((item) => `${item.eventType} ${item.total}`).join(" · ") || "暂无事件"}</p></article>
        <article className={summary.alerts.length ? styles.alert : ""}><small>24 小时告警</small><h2>{summary.alerts.length}</h2><p>{summary.alerts.length ? summary.alerts.map((item) => `${item.kind} · ${item.operation}`).join("；") : "当前没有达到阈值的异常"}</p></article>
        <article><small>用户反馈</small><h2>{summary.feedback.reduce((sum, item) => sum + Number(item.total), 0)}</h2><p>{summary.feedback.map((item) => `${item.feedback} ${item.total}`).join(" · ") || "24 小时内暂无反馈"}</p></article>
      </section>
      <section className={styles.validation}><header><Sparkle /><div><small>S7 · CORE EXPERIENCE</small><h2>真实用户验证门禁</h2></div><span className={summary.coreExperience.monetizationGate.ready ? styles.passed : styles.waiting}>{summary.coreExperience.monetizationGate.ready ? "已满足收费实验前置条件" : "继续验证，暂不开启收费"}</span></header><p>过去 {summary.coreExperience.monetizationGate.observationWindowDays} 天仅统计无正文行为信号。样本不足时不把波动解释成结论。</p><div className={styles.metricGrid}>{[["目标用户样本", summary.coreExperience.sampleUsers, "30–50"],["首次继续对话率", summary.coreExperience.firstConversationContinuationRate, "≥60%"],["有效事件创建率", summary.coreExperience.eventCreationRate, "≥40%"],["次日回访率", summary.coreExperience.dayOneRetention, "≥30%"],["7 日留存", summary.coreExperience.daySevenRetention, "≥15%"],["现实反馈率", summary.coreExperience.realityFeedbackRate, "≥25%"],["记忆正确率", summary.coreExperience.memoryAccuracyRate, "≥90%"],["工具后续聊率", summary.coreExperience.toolContinuationRate, "≥35%"],["主动分享意向", summary.coreExperience.shareIntentRate, "≥5%"]].map(([label, value, target]) => <article key={String(label)}><small>{label}</small><b>{label === "目标用户样本" ? String(value) : `${Math.round(Number(value) * 100)}%`}</b><span>目标 {target}</span></article>)}</div></section>
      <section className={styles.invites}><header><Key /><div><small>BETA ACCESS</small><h2>邀请测试账户</h2></div></header><p>邀请码只在创建时显示一次。可设置每批人数、到期时间并随时撤销；用户先获得匿名测试账户，体验后再绑定邮箱。</p><div className={styles.inviteCreator}><input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="留空自动生成，或输入 6–32 位邀请码" /><button type="button" onClick={() => void createInvite()}>创建 10 人邀请码</button></div>{newInviteCode && <div className={styles.newInvite}><span><b>{newInviteCode}</b><small>请现在复制，刷新后不再显示</small></span><button type="button" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/app/?invite=${newInviteCode}`)}><Copy /> 复制邀请链接</button></div>}<div className={styles.inviteList}>{invites.map((invite) => <article key={invite.id}><span><b>{invite.label}</b><small>{invite.batch} · {invite.useCount}/{invite.maxUses} 人 · {invite.boundAccounts || 0} 已绑定邮箱</small></span><em className={invite.revokedAt ? styles.failed : styles.passed}>{invite.revokedAt ? "已撤销" : new Date(invite.expiresAt) < new Date() ? "已过期" : "使用中"}</em><button type="button" onClick={() => void revokeInvite(invite.id, !invite.revokedAt)}>{invite.revokedAt ? "重新启用" : "撤销"}</button></article>)}</div></section>
      <section className={styles.acceptance}><header><ShieldCheck /><div><small>RELEASE ACCEPTANCE</small><h2>生产数据链路验收</h2></div></header><p>使用两名临时合成账户验证双设备合并、删除防复活、游客迁移幂等、逻辑备份恢复与关系屏蔽。测试账户会在写入结果前删除。</p><div><button type="button" disabled={acceptanceState === "running"} onClick={() => void runAcceptance()}>{acceptanceState === "running" ? "正在验收…" : "运行生产验收"}</button>{summary.acceptance && <span className={summary.acceptance.result === "passed" ? styles.passed : styles.failed}>{summary.acceptance.result === "passed" ? <Check /> : <WarningCircle />}{summary.acceptance.result === "passed" ? "通过" : "失败"} · schema {summary.acceptance.schemaVersion} · {new Date(summary.acceptance.createdAt).toLocaleString("zh-CN")}</span>}</div>{summary.acceptance && <ul>{Object.entries(summary.acceptance.checks).map(([key, passed]) => <li key={key}>{passed ? <Check /> : <WarningCircle />}{key}</li>)}</ul>}</section>
      <section className={styles.moderation}><header><ShieldCheck /><div><small>MODERATION</small><h2>关系举报处置</h2></div></header>{reports.length ? reports.map((report) => <article key={report.id}><div><b>{report.reasonCode}</b><small>{new Date(report.createdAt).toLocaleString("zh-CN")} · {report.status}</small></div>{report.status === "open" ? <nav><button onClick={() => void resolve(report.id, "confirmed")}>确认违规</button><button onClick={() => void resolve(report.id, "no_action")}>无需处置</button><button onClick={() => void resolve(report.id, "duplicate")}>重复举报</button></nav> : <span><Check /> {report.resolutionCode}</span>}</article>) : <p>当前没有举报记录。</p>}</section>
    </>}
  </main>;
}
