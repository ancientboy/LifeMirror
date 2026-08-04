import type { Metadata } from "next";
import { TwinRealmHome } from "@/components/site/TwinRealmHome";

export const metadata: Metadata = {
  title: "LifeMirror — 同一束光，两种凝视",
  description: "与拾光一起，从东方六爻与命盘，或西方塔罗与占星，看见此刻的自己。",
};

export default function HomePage() {
  return <TwinRealmHome />;
}
