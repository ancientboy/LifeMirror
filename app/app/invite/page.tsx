import type { Metadata } from "next";
import { ExperienceInvites } from "@/components/app/ExperienceInvites";

export const metadata: Metadata = { title: "邀请朋友体验 — LifeMirror", description: "把拾光分享给你真正想邀请的人。" };

export default function InvitePage() { return <ExperienceInvites />; }
