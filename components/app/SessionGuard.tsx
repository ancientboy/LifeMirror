"use client";

import { Aperture, CircleNotch } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./SessionGuard.module.css";
import { AppBottomNav } from "./AppBottomNav";
import { AccountDataSync } from "./AccountDataSync";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("life-mirror:guest-session:v1") === "active") {
      setAllowed(true);
      return;
    }
    fetch("/api/v1/auth/session", { credentials: "include" })
      .then((response) => { if (!response.ok) throw new Error("signed_out"); setAllowed(true); })
      .catch(() => router.replace("/app/"));
  }, [router]);

  if (!allowed) return <main className={styles.loading}><Aperture weight="thin" /><CircleNotch /><span>正在进入你的镜像…</span></main>;
  return <><AccountDataSync />{children}<AppBottomNav active="explore" /></>;
}
