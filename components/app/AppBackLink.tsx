import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import styles from "./AppBackLink.module.css";

export function AppBackLink({ href, label }: { href: string; label: string }) {
  return <nav className={styles.wrap} aria-label="返回上级页面"><Link href={href}><ArrowLeft />{label}</Link></nav>;
}
