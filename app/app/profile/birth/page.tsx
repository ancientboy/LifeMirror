import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { BirthProfileForm } from "@/components/app/BirthProfileForm";
import { SessionGuard } from "@/components/app/SessionGuard";

export const metadata: Metadata = { title: "出生资料 — LifeMirror", description: "管理命盘与占星共用的出生日期、时间和地点。" };

export default function BirthProfilePage() {
  return <SessionGuard navActive="profile"><main className="birth-tool east-birth"><nav><Link href="/app/profile/"><ArrowLeft /> 返回我的</Link></nav><section><small>ONE BIRTH PROFILE · 唯一出生资料</small><h1>填写一次，命盘与占星自动使用。</h1><p>生日、出生时间、地点和坐标只维护一份。之后进入命盘或占星时会自动载入；你仍可在生成前临时修改。</p></section><BirthProfileForm tradition="west" profileOnly /></main></SessionGuard>;
}
