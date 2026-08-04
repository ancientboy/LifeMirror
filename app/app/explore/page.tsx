import type { Metadata } from "next";
import { ExploreMirrors } from "@/components/app/ExploreMirrors";
import { SessionGuard } from "@/components/app/SessionGuard";

export const metadata: Metadata = {
  title: "探索双镜 — LifeMirror",
  description: "在东方时间镜与西方象征镜之间，选择适合此刻问题的观察方式。",
};

export default function ExplorePage() {
  return <SessionGuard><ExploreMirrors /></SessionGuard>;
}
