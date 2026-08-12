"use client";

import { Check, DownloadSimple, ShareNetwork, Sparkle } from "@phosphor-icons/react";
import { useState } from "react";
import { safePublicShareMeta, safePublicShareText } from "@/lib/share-safety";
import { recordProductMetric } from "@/lib/product-metrics";
import styles from "./ShareQuoteCard.module.css";

type Variant = "paper" | "night" | "character";
type CardContent = { kicker?: string; title?: string; quote: string; meta: string };
type Props = { title: string; quote: string; meta: string; theme: "east" | "west"; image: string; contentByVariant?: Partial<Record<Variant, CardContent>> };
const variants: Array<{ id: Variant; label: string; note: string }> = [
  { id: "paper", label: "朋友版", note: "一句能发给懂你的人" },
  { id: "night", label: "清醒版", note: "把悬着的话说清楚" },
  { id: "character", label: "神秘版", note: "留一点想继续聊的余白" },
];

function loadImage(src: string) { return new Promise<HTMLImageElement | null>((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = src; }); }
function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) { const lines: string[] = []; let line = ""; for (const char of [...text]) { if (context.measureText(line + char).width > maxWidth && line) { lines.push(line); line = char; } else line += char; } if (line) lines.push(line); return lines.slice(0, 5); }
function compactQuote(value: string) { return [...value.replace(/\s+/g, "").replace(/^(?:翻译(?:一下|成人话)?|人话版)[：:]/, "").replace(/[。！？!?]+$/u, "")].slice(0, 32).join(""); }
function exportCanvas(canvas: HTMLCanvasElement) { return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("empty_canvas")), "image/png")); }
function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1500); }

export function ShareQuoteCard({ title, quote, meta, theme, image, contentByVariant }: Props) {
  const [variant, setVariant] = useState<Variant>("paper");
  const [status, setStatus] = useState("");
  const supplied = contentByVariant?.[variant] ?? { title, quote, meta };
  const current = {
    ...supplied,
    quote: safePublicShareText(compactQuote(supplied.quote), variant),
    meta: safePublicShareMeta(supplied.meta ?? meta, variant),
  };
  // The card must always use the active Shiguang persona supplied by the
  // experience (East for Liuyao/Bazi, West for Tarot/Astrology). A former
  // default asset here silently replaced that persona with an unrelated boy.
  const visualImage = image;

  async function createRelationshipLink() {
    try {
      const response = await fetch("/api/v1/social/shares", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ shareKind: variant === "character" ? "compare" : "relationship", mirrorKind: theme, quote: current.quote, meta: current.meta }) });
      if (response.status === 401) { setStatus("登录后即可生成让对方回应的关系链接"); return; }
      if (!response.ok) throw new Error();
      const payload = await response.json() as { path: string }; const url = new URL(payload.path, window.location.origin).toString();
      recordProductMetric("share_link_created", "share", `share-link:${Date.now()}:${variant}`);
      recordProductMetric("share_intent", "share", `share-intent:${Date.now()}:${variant}`);
      recordProductMetric("share_card_shared", "share", `share-card:${Date.now()}:${variant}`);
      if (typeof navigator.share === "function") await navigator.share({ title: "LifeMirror · 关系镜像", text: current.quote, url }); else await navigator.clipboard.writeText(url);
      setStatus(typeof navigator.share === "function" ? "已打开分享面板" : "回应链接已复制");
    } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; setStatus("暂时无法生成回应链接，请稍后再试"); }
  }

  async function createCard(action: "share" | "save") {
    try {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
      const context = canvas.getContext("2d"); if (!context) throw new Error();
      const east = theme === "east"; const dark = variant !== "character";
      const colors = east ? { deep: "#103735", mid: "#246155", accent: "#e6c56e", paper: "#e7f0e7", ink: "#173b35" } : { deep: "#251b48", mid: "#5c4788", accent: "#d2b4fa", paper: "#eee9fb", ink: "#352952" };
      const background = context.createLinearGradient(0, 0, 1080, 1350);
      if (variant === "paper") { background.addColorStop(0, colors.mid); background.addColorStop(1, colors.deep); }
      else if (variant === "night") { background.addColorStop(0, east ? "#183e48" : "#49356f"); background.addColorStop(1, east ? "#071d27" : "#151126"); }
      else { background.addColorStop(0, colors.paper); background.addColorStop(1, east ? "#83ab91" : "#998bc1"); }
      context.fillStyle = background; context.fillRect(0, 0, 1080, 1350);
      context.strokeStyle = dark ? `${colors.accent}99` : "#8c7240a6"; context.lineWidth = 2; context.strokeRect(56, 56, 968, 1238);
      context.fillStyle = dark ? `${colors.accent}22` : "#fff8"; context.beginPath(); context.arc(850, 190, 260, 0, Math.PI * 2); context.fill();
      context.fillStyle = dark ? colors.accent : colors.ink; context.font = "600 25px sans-serif"; context.fillText(current.kicker ?? "LIFE MIRROR · 拾光", 92, 120);
      context.fillStyle = dark ? "#fbf6ea" : colors.ink; context.font = "52px serif"; const lines = wrapText(context, `“${current.quote}”`, 650); let y = 268; lines.forEach((line) => { context.fillText(line, 92, y); y += 82; });
      context.fillStyle = dark ? "#f7f0dfb8" : "#283d37b8"; context.font = "25px sans-serif"; context.fillText(current.meta.slice(0, 42), 92, 1055);
      context.fillStyle = dark ? colors.accent : "#806d43"; context.font = "600 22px sans-serif"; context.fillText(variant === "paper" ? "拾光 · 一句朋友话" : variant === "night" ? "拾光 · 清醒但不刺人" : "拾光 · 留一点未说完", 92, 1220);
      const portrait = await loadImage(visualImage); if (portrait) { const ratio = portrait.width / portrait.height; const height = variant === "character" ? 680 : 640; context.drawImage(portrait, variant === "character" ? 650 : 640, 570, height * ratio, height); }
      const blob = await exportCanvas(canvas); const name = `lifemirror-${theme}-${variant}.png`;
      if (action === "share") { recordProductMetric("share_card_shared", "share", `share-card:${Date.now()}:${variant}`); recordProductMetric("share_intent", "share", `share-intent:${Date.now()}:${variant}`); }
      if (action === "share" && typeof File !== "undefined" && typeof navigator.share === "function") { const file = new File([blob], name, { type: "image/png" }); if (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "LifeMirror · 拾光", text: `${current.quote}\n${current.meta}` }); setStatus("已打开系统分享面板"); return; } catch (error) { if (error instanceof DOMException && error.name === "AbortError") { setStatus("已取消分享，卡片仍可保存"); return; } } } }
      downloadBlob(blob, name); setStatus(action === "share" ? "当前浏览器不支持直接分享，已为你保存图片" : "这款分享卡已保存");
    } catch { setStatus("暂时无法生成分享卡，请稍后再试"); }
  }

  return <section className={`${styles.card} ${styles[theme]} ${styles[variant]}`}>
    <div className={styles.content}><small><Sparkle /> {current.kicker ?? "三封来自拾光的信"}</small><blockquote>“{current.quote}”</blockquote><span>{current.meta}</span>
      <div className={styles.variants} aria-label="选择分享卡风格">{variants.map((item) => <button type="button" className={variant === item.id ? styles.selected : ""} aria-pressed={variant === item.id} onClick={() => { setVariant(item.id); setStatus(""); }} key={item.id}>{variant === item.id && <Check />}<b>{item.label}</b><em>{item.note}</em></button>)}</div>
      <div className={styles.actions}><button type="button" onClick={() => variant === "paper" ? createCard("share") : void createRelationshipLink()}><ShareNetwork />{variant === "paper" ? "分享这封信" : "生成回应链接"}</button><button type="button" onClick={() => createCard("save")}><DownloadSimple />保存卡片</button></div>{status && <p role="status">{status}</p>}</div>
    <img src={visualImage || image} alt="Q版拾光" />
  </section>;
}
