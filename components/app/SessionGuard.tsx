"use client";

import { Aperture, CircleNotch } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./SessionGuard.module.css";
import { AppBottomNav } from "./AppBottomNav";
import { AccountDataSync } from "./AccountDataSync";
import type { NavKey } from "./AppBottomNav";
import { forgetClientSession, readClientSession, rememberAuthenticatedSession, rememberGuestSession } from "@/lib/client-session";

export function SessionGuard({ children, navActive = "explore" }: { children: React.ReactNode; navActive?: NavKey }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const known = readClientSession();
    const hasGuestSession = known.status === "guest";
    let confirmedSignedOut = false;
    if (known.status !== "unknown") setAllowed(true);
    fetch("/api/v1/auth/session", { credentials: "include" })
      .then(async (response) => { if (!response.ok) { confirmedSignedOut = true; forgetClientSession(); throw new Error("signed_out"); } const session = await response.json() as { user?: { email?: string | null; provider?: string | null } }; rememberAuthenticatedSession(session.user); setAllowed(true); })
      .catch(() => { if (hasGuestSession) { rememberGuestSession(); setAllowed(true); } else if (confirmedSignedOut || known.status !== "authenticated") { setAllowed(false); router.replace("/app/"); } });
  }, [router]);

  if (!allowed) return <main className={styles.loading}><Aperture weight="thin" /><CircleNotch /><span>正在打开…</span></main>;
  return <><AccountDataSync />{children}<AppBottomNav active={navActive} /></>;
}
