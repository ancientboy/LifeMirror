import type { Metadata } from "next";
import { DailyMirrorExperience } from "@/components/app/DailyMirrorExperience";

export const metadata: Metadata = {
  title: "Daily Mirror — Life Mirror",
  description: "通过象征探索与 AI Reflection，看见此刻的自己。",
};

export default function DailyMirrorPage() {
  return <DailyMirrorExperience />;
}
