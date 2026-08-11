"use client";

import { useCallback, useEffect, useState } from "react";
import { ACCOUNT_DATA_CHANGED_EVENT, readLocalAccountData, writeLocalAccountData, type AccountSnapshot } from "@/lib/account-data";
import styles from "./AccountDataSync.module.css";

function stable(value: unknown) {
  return JSON.stringify(value);
}

export function AccountDataSync() {
  const [issue, setIssue] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const retry = useCallback(() => setRetryKey((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    let ready = false;
    let last = "";
    let timer = 0;

    async function push() {
      if (!ready || !active) return;
      try {
        const data = readLocalAccountData();
        const next = stable(data);
        if (next === last) return;
        const response = await fetch("/api/v1/account/data", {
          method: "PUT", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ data }),
        });
        if (!response.ok) { if (response.status !== 401 && active) setIssue(true); return; }
        const payload = await response.json() as { data: AccountSnapshot };
        if (!active) return;
        // The server may have merged a newer device's changes or filtered a
        // tombstoned record.  Always adopt that authority response locally.
        writeLocalAccountData(payload.data);
        last = stable(payload.data);
        setIssue(false);
      } catch { if (active) setIssue(true); }
    }

    async function initialize() {
      try {
        const response = await fetch("/api/v1/account/data", { credentials: "include" });
        if (!response.ok || !active) { if (response.status !== 401 && active) setIssue(true); return; }
        const payload = await response.json() as { data: AccountSnapshot };
        writeLocalAccountData(payload.data);
        last = stable(readLocalAccountData());
        ready = true;
        setIssue(false);
      } catch { if (active) setIssue(true); }
    }

    const changed = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { void push(); }, 450);
    };
    const interval = window.setInterval(() => { void push(); }, 2500);
    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, changed);
    window.addEventListener("storage", changed);
    document.addEventListener("visibilitychange", changed);
    void initialize();

    return () => {
      active = false;
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, changed);
      window.removeEventListener("storage", changed);
      document.removeEventListener("visibilitychange", changed);
    };
  }, [retryKey]);

  if (!issue) return null;
  return <aside className={styles.notice} role="status" aria-live="polite"><span><b>内容暂时还在这台设备上</b><small>网络恢复后会自动重试；你也可以现在再试一次。</small></span><button type="button" onClick={retry}>重新同步</button></aside>;
}
