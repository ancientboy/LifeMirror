import type { Metadata } from "next";
import { AppRouteTransition } from "@/components/app/AppRouteTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Mirror Institute — Researching Human Understanding",
  description: "Life Mirror Institute 研究 AI 如何长期理解、映照并支持一个人的成长。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><AppRouteTransition />{children}</body></html>;
}
