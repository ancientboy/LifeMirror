import type { Metadata } from "next";
import { PersonalMirrorDashboard } from "@/components/app/PersonalMirrorDashboard";

export const metadata: Metadata = {
  title: "我的镜像 — Life Mirror",
  description: "观察反思、长期模式与正在形成的 Mirror DNA。",
};

export default function PersonalMirrorPage() {
  return <PersonalMirrorDashboard />;
}
