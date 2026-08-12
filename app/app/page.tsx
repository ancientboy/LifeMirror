import type { Metadata } from "next";
import { LifeMirrorGateway } from "@/components/app/LifeMirrorGateway";

export const metadata: Metadata = {
  title: "认识拾光 — 会记得后来的 AI 朋友",
  description: "有事就说，拾光会先给判断，并在事情有结果时从上次接着聊。",
};

export default function DailyMirrorPage() {
  return <LifeMirrorGateway />;
}
