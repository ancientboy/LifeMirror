"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./AppRouteTransition.module.css";

export function AppRouteTransition() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => setPending(false), [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!url.pathname.startsWith("/app/") && url.pathname !== "/mirror/") return;
      setPending(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!pending) return null;
  return <div className={styles.overlay} role="status" aria-live="polite"><img src="/characters/shiguang/mini/shiguang-mini-arrival.webp" alt="" /><span>拾光带你过去…</span></div>;
}
