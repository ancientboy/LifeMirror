import type { Metadata } from "next";
import { LifeMirrorGateway } from "@/components/app/LifeMirrorGateway";

export const metadata: Metadata = {
  title: "进入 LifeMirror — 登录或游客体验",
  description: "选择登录或游客身份，再进入拾光的日常对话与四种镜像工具。",
};

export default function DailyMirrorPage() {
  return <LifeMirrorGateway />;
}
