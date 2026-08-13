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
    let syncing = false;
    let queuedPull = false;

    function adopt(data: AccountSnapshot) {
      const next = stable(data);
      if (stable(readLocalAccountData()) !== next) writeLocalAccountData(data);
      last = next;
    }

    async function mergeLocal() {
      const data = readLocalAccountData();
      const response = await fetch("/api/v1/account/data", {
        method: "PUT", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ data }),
      });
      if (!response.ok) throw Object.assign(new Error("account_sync_failed"), { status: response.status });
      const payload = await response.json() as { data: AccountSnapshot };
      if (active) adopt(payload.data);
    }

    async function reconcile(pullRemote = false) {
      if (!ready || !active) return;
      if (syncing) { queuedPull ||= pullRemote; return; }
      syncing = true;
      try {
        const localAtStart = stable(readLocalAccountData());
        if (localAtStart !== last) {
          await mergeLocal();
        } else if (pullRemote) {
          const response = await fetch("/api/v1/account/data", { credentials: "include", cache: "no-store" });
          if (!response.ok) throw Object.assign(new Error("account_pull_failed"), { status: response.status });
          const payload = await response.json() as { data: AccountSnapshot };
          if (!active) return;
          // It is safe to adopt a newer cloud snapshot only while this device
          // is still unchanged. If the user edited during the request, merge
          // that edit through D1 first so neither device can overwrite it.
          if (stable(readLocalAccountData()) === last) adopt(payload.data);
          else await mergeLocal();
        }
        setIssue(false);
      } catch (error) {
        if (active && Number((error as { status?: number })?.status) !== 401) setIssue(true);
      } finally {
        syncing = false;
        if (active && queuedPull) {
          queuedPull = false;
          window.setTimeout(() => { void reconcile(true); }, 0);
        }
      }
    }

    async function initialize() {
      syncing = true;
      try {
        // Merge first instead of GET-then-overwrite. This is the recovery path
        // for records that were created on a phone while cloud sync was idle.
        await mergeLocal();
        if (!active) return;
        ready = true;
        setIssue(false);
      } catch (error) {
        if (active && Number((error as { status?: number })?.status) !== 401) setIssue(true);
      } finally { syncing = false; }
    }

    const changed = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { void reconcile(false); }, 450);
    };
    const becameVisible = () => { if (document.visibilityState === "visible") void reconcile(true); };
    const interval = window.setInterval(() => { void reconcile(true); }, 12_000);
    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, changed);
    window.addEventListener("storage", changed);
    window.addEventListener("focus", becameVisible);
    document.addEventListener("visibilitychange", becameVisible);
    void initialize();

    return () => {
      active = false;
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, changed);
      window.removeEventListener("storage", changed);
      window.removeEventListener("focus", becameVisible);
      document.removeEventListener("visibilitychange", becameVisible);
    };
  }, [retryKey]);

  if (!issue) return null;
  return <aside className={styles.notice} role="status" aria-live="polite"><span><b>内容暂时还在这台设备上</b><small>网络恢复后会自动重试；你也可以现在再试一次。</small></span><button type="button" onClick={retry}>重新同步</button></aside>;
}
