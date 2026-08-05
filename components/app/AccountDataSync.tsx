"use client";

import { useEffect } from "react";
import { ACCOUNT_DATA_CHANGED_EVENT, readLocalAccountData, writeLocalAccountData, type AccountSnapshot } from "@/lib/account-data";

function stable(value: unknown) {
  return JSON.stringify(value);
}

export function AccountDataSync() {
  useEffect(() => {
    let active = true;
    let ready = false;
    let last = "";
    let timer = 0;

    async function push() {
      if (!ready || !active) return;
      const data = readLocalAccountData();
      const next = stable(data);
      if (next === last) return;
      const response = await fetch("/api/v1/account/data", {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (response.ok) last = next;
    }

    async function initialize() {
      const response = await fetch("/api/v1/account/data", { credentials: "include" });
      if (!response.ok || !active) return;
      const payload = await response.json() as { data: AccountSnapshot };
      writeLocalAccountData(payload.data);
      last = stable(readLocalAccountData());
      ready = true;
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
  }, []);

  return null;
}
