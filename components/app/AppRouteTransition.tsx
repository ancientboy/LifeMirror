"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./AppRouteTransition.module.css";

export function AppRouteTransition() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [targetPath, setTargetPath] = useState("");

  useEffect(() => {
    const normalize = (value: string) => value.length > 1 ? value.replace(/\/+$/, "") : value;
    if (!pending || normalize(pathname) !== normalize(targetPath)) return;
    const timer = window.setTimeout(() => setPending(false), 140);
    return () => window.clearTimeout(timer);
  }, [pathname, pending, targetPath]);

  useEffect(() => {
    if (!pending) return;
    const fallback = window.setTimeout(() => setPending(false), 5000);
    return () => window.clearTimeout(fallback);
  }, [pending]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!url.pathname.startsWith("/app/") && url.pathname !== "/mirror/") return;
      setTargetPath(url.pathname);
      setPending(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!pending) return null;
  return <div className={styles.overlay} role="status" aria-live="polite"><img src="/characters/shiguang/mini/shiguang-mini-arrival.webp" alt="" /><span>拾光带你过去…</span></div>;
}
