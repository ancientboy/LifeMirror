import type { Metadata } from "next";
import { ShiguangHome } from "@/components/app/ShiguangHome";

export const metadata: Metadata = {
  title: "和拾光聊聊 — LifeMirror",
  description: "LifeMirror 的常规聊天首页，从对话进入六爻、命盘、塔罗与占星。",
};

export default function ShiguangHomePage() {
  return <ShiguangHome />;
}
