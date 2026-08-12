import type { Metadata } from "next";
import { ShiguangHome } from "@/components/app/ShiguangHome";

export const metadata: Metadata = {
  title: "和拾光聊聊 — LifeMirror",
  description: "拾光会记住未完的事，在后来有结果时从上次的判断接着聊。",
};

export default function ShiguangHomePage() {
  return <ShiguangHome />;
}
