import type { Metadata } from "next";
import { ReviewExperience } from "@/components/app/ReviewExperience";

export const metadata: Metadata = {
  title: "周期回顾 — LifeMirror",
  description: "带证据链的周度与月度镜像回顾。",
};

export default function ReviewPage() {
  return <ReviewExperience />;
}
