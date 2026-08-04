import type { Metadata } from "next";
import { DailyMirrorExperience } from "@/components/app/DailyMirrorExperience";
import { SessionGuard } from "@/components/app/SessionGuard";

export const metadata: Metadata = {
  title: "六爻镜像 — LifeMirror",
  description: "以确定性六爻盘面与拾光解释，看清此刻的问题。",
};

export default function LiuyaoPage() {
  return <SessionGuard><DailyMirrorExperience initialStage="question" /></SessionGuard>;
}
