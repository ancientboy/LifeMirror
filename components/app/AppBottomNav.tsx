"use client";

import { Compass, House, Sparkle, UserCircle, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import navStyles from "./ShiguangBottomNav.module.css";

export type NavKey = "home" | "explore" | "mirror" | "relationships" | "profile";

const items = [
  { key: "home", href: "/app/home/", label: "拾光", icon: House },
  { key: "explore", href: "/app/explore/", label: "探索", icon: Compass },
  { key: "mirror", href: "/mirror/", label: "镜像", icon: Sparkle },
  { key: "relationships", href: "/app/relationships/", label: "关系", icon: UsersThree },
  { key: "profile", href: "/app/profile/", label: "我的", icon: UserCircle },
] as const;

export function AppBottomNav({ active }: { active: NavKey }) {
  return <nav className={navStyles.bottomNav} aria-label="LifeMirror 主导航">
    {items.map((item) => {
      const Icon = item.icon;
      return <Link className={active === item.key ? navStyles.current : undefined} href={item.href} key={item.key} aria-current={active === item.key ? "page" : undefined}>
        <Icon weight={active === item.key ? "fill" : "regular"} />
        <span>{item.label}</span>
      </Link>;
    })}
  </nav>;
}
