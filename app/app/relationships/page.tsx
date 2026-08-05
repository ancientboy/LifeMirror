import type { Metadata } from "next";
import { RelationshipsHub } from "@/components/app/RelationshipsHub";

export const metadata: Metadata = { title: "关系镜像 — LifeMirror", description: "邀请朋友、回应分享并生成双方关系镜像。" };

export default function RelationshipsPage() { return <RelationshipsHub />; }
