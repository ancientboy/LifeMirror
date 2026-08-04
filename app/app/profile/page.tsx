import type { Metadata } from "next";
import { ProfileHub } from "@/components/app/ProfileHub";

export const metadata: Metadata = { title: "我的 — LifeMirror", description: "查看当前身份、个人镜像与隐私设置。" };

export default function ProfilePage() { return <ProfileHub />; }
