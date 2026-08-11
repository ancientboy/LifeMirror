"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleNotch, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import styles from "./OperationsConsole.module.css";

type Acceptance = { result: "passed" | "failed"; sourceCommit: string; schemaVersion: number; createdAt: string; checks: Record<string, boolean> };
type Summary = { windowHours: number; llm: Array<Record<string, unknown>>; tasks: Array<{ status: string; total: number }>; moderation: Array<{ status: string; total: number }>; deliveries: Array<{ state: string; total: number }>; shareFunnel: Array<{ eventType: string; total: number }>; feedback: Array<{ feedback: string; total: number }>; acceptance: Acceptance | null; alerts: Array<{ kind: string; operation: string; value: number }>; privacy: string };
type Report = { id: string; reasonCode: string; status: string; resolutionCode?: string | null; createdAt: string };

export function OperationsConsole() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "error">("loading");
  const [acceptanceState, setAcceptanceState] = useState<"idle" | "running" | "passed" | "failed">("idle");

  async function load() {
    setState("loading");
    try {
      const [summaryResponse, moderationResponse] = await Promise.all([
        fetch("/api/v1/ops/summary", { credentials: "include" }),
        fetch("/api/v1/ops/moderation", { credentials: "include" }),
      ]);
      if (summaryResponse.status === 401 || moderationResponse.status === 401) { setState("forbidden"); return; }
      if (!summaryResponse.ok || !moderationResponse.ok) throw new Error("ops_unavailable");
      setSummary(await summaryResponse.json());
      setReports((await moderationResponse.json()).reports ?? []);
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
      <section className={styles.acceptance}><header><ShieldCheck /><div><small>RELEASE ACCEPTANCE</small><h2>生产数据链路验收</h2></div></header><p>使用两名临时合成账户验证双设备合并、删除防复活、游客迁移幂等、逻辑备份恢复与关系屏蔽。测试账户会在写入结果前删除。</p><div><button type="button" disabled={acceptanceState === "running"} onClick={() => void runAcceptance()}>{acceptanceState === "running" ? "正在验收…" : "运行生产验收"}</button>{summary.acceptance && <span className={summary.acceptance.result === "passed" ? styles.passed : styles.failed}>{summary.acceptance.result === "passed" ? <Check /> : <WarningCircle />}{summary.acceptance.result === "passed" ? "通过" : "失败"} · schema {summary.acceptance.schemaVersion} · {new Date(summary.acceptance.createdAt).toLocaleString("zh-CN")}</span>}</div>{summary.acceptance && <ul>{Object.entries(summary.acceptance.checks).map(([key, passed]) => <li key={key}>{passed ? <Check /> : <WarningCircle />}{key}</li>)}</ul>}</section>
      <section className={styles.moderation}><header><ShieldCheck /><div><small>MODERATION</small><h2>关系举报处置</h2></div></header>{reports.length ? reports.map((report) => <article key={report.id}><div><b>{report.reasonCode}</b><small>{new Date(report.createdAt).toLocaleString("zh-CN")} · {report.status}</small></div>{report.status === "open" ? <nav><button onClick={() => void resolve(report.id, "confirmed")}>确认违规</button><button onClick={() => void resolve(report.id, "no_action")}>无需处置</button><button onClick={() => void resolve(report.id, "duplicate")}>重复举报</button></nav> : <span><Check /> {report.resolutionCode}</span>}</article>) : <p>当前没有举报记录。</p>}</section>
    </>}
  </main>;
}
