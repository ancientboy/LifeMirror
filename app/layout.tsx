import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Mirror Theory",
  description: "帮助每一个人，看见自己，理解自己，成为自己。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
