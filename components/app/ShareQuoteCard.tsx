"use client";
import { DownloadSimple, ShareNetwork, Sparkle } from "@phosphor-icons/react";
import { useState } from "react";
import styles from "./ShareQuoteCard.module.css";

type Props = { title: string; quote: string; meta: string; theme: "east" | "west"; image: string };
export function ShareQuoteCard({ title, quote, meta, theme, image }: Props) {
  const [status, setStatus] = useState("");
  async function createCard(action: "share" | "save") {
    try {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
      const context = canvas.getContext("2d"); if (!context) throw new Error();
      const gradient = context.createLinearGradient(0, 0, 1080, 1350);
      if (theme === "east") { gradient.addColorStop(0, "#173f39"); gradient.addColorStop(1, "#081f20"); } else { gradient.addColorStop(0, "#332657"); gradient.addColorStop(1, "#15152d"); }
      context.fillStyle = gradient; context.fillRect(0, 0, 1080, 1350);
      context.fillStyle = theme === "east" ? "#d9c481" : "#cbb8ff"; context.font = "28px serif"; context.fillText("LIFE MIRROR · 拾光", 90, 110);
      context.fillStyle = "#f7f3e9"; context.font = "52px serif"; context.fillText(title, 90, 210); context.font = "46px serif";
      const chars = [...`“${quote}”`]; let line = "", y = 390;
      for (const char of chars) { const test = line + char; if (context.measureText(test).width > 830) { context.fillText(line, 90, y); line = char; y += 82; } else line = test; }
      context.fillText(line, 90, y); context.fillStyle = "rgba(247,243,233,.62)"; context.font = "25px sans-serif"; context.fillText(meta, 90, 1190); context.font = "22px sans-serif"; context.fillText("象征性自我探索 · 不替代专业建议", 90, 1250);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png")); if (!blob) throw new Error();
      const file = new File([blob], "lifemirror-share.png", { type: "image/png" });
      if (action === "share" && navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title, text: quote }); setStatus("已打开系统分享面板"); return; }
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = file.name; anchor.click(); URL.revokeObjectURL(url); setStatus(action === "share" ? "当前浏览器不支持直接分享，已为你保存图片" : "分享卡已保存");
    } catch { setStatus("暂时无法生成分享卡，请稍后再试"); }
  }
  return <section className={`${styles.card} ${styles[theme]}`}><div><small><Sparkle /> 一句话镜像</small><h3>{title}</h3><blockquote>“{quote}”</blockquote><span>{meta}</span><div className={styles.actions}><button type="button" onClick={() => createCard("share")}><ShareNetwork />分享</button><button type="button" onClick={() => createCard("save")}><DownloadSimple />保存卡片</button></div>{status&&<p role="status">{status}</p>}</div><img src={image} alt="" /></section>;
}
