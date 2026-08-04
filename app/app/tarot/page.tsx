import type { Metadata } from "next";
import { TarotExperience } from "@/components/app/TarotExperience";
import { SessionGuard } from "@/components/app/SessionGuard";

export const metadata: Metadata = { title:"拾光塔罗 — LifeMirror", description:"用三张牌照见此刻的内在状态。" };
export default function TarotPage(){ return <SessionGuard><TarotExperience /></SessionGuard>; }
