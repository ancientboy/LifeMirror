"use client";

import { Check, DownloadSimple, ShareNetwork, Sparkle } from "@phosphor-icons/react";
import { useState } from "react";
import styles from "./ShareQuoteCard.module.css";

type Variant = "paper" | "night" | "character";
type CardContent = { kicker?: string; title: string; quote: string; meta: string };
type Props = {
  title: string;
  quote: string;
  meta: string;
  theme: "east" | "west";
  image: string;
  contentByVariant?: Partial<Record<Variant, CardContent>>;
};

const variants: Array<{ id: Variant; label: string; note: string }> = [
  { id: "paper", label: "发自己", note: "像我，所以想留下" },
  { id: "night", label: "发给 TA", note: "让对方回应关系" },
  { id: "character", label: "邀请对照", note: "看看彼此哪里不同" },
];

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const char of [...text]) {
    if (context.measureText(line + char).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else line += char;
  }
  if (line) lines.push(line);
  return lines.slice(0, 7);
}

function exportCanvas(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("empty_canvas")), "image/png");
      return;
    }
    try {
      const [header, bytes] = canvas.toDataURL("image/png").split(",");
      const binary = atob(bytes);
      const array = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) array[index] = binary.charCodeAt(index);
      resolve(new Blob([array], { type: header.match(/data:(.*?);/)?.[1] ?? "image/png" }));
    } catch (error) {
      reject(error);
    }
  });
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function ShareQuoteCard({ title, quote, meta, theme, image, contentByVariant }: Props) {
  const [variant, setVariant] = useState<Variant>("paper");
  const [status, setStatus] = useState("");

  const current = contentByVariant?.[variant] ?? { title, quote, meta };

  async function createCard(action: "share" | "save") {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const context = canvas.getContext("2d");
      if (!context) throw new Error();

      const east = theme === "east";
      if (variant === "paper") {
        context.fillStyle = east ? "#f1eee4" : "#eeeaf5";
        context.fillRect(0, 0, 1080, 1350);
        context.strokeStyle = east ? "#315f57" : "#594b82";
        context.lineWidth = 2;
        context.strokeRect(58, 58, 964, 1234);
      } else {
        const gradient = context.createLinearGradient(0, 0, 1080, 1350);
        gradient.addColorStop(0, east ? "#214f47" : "#47356f");
        gradient.addColorStop(1, east ? "#071d1c" : "#111126");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1080, 1350);
        context.strokeStyle = east ? "rgba(218,196,129,.34)" : "rgba(203,184,255,.34)";
        context.lineWidth = 2;
        if (variant === "night") {
          [150, 230, 315].forEach((radius) => {
            context.beginPath();
            context.arc(540, 650, radius, 0, Math.PI * 2);
            context.stroke();
          });
        }
      }

      const light = variant !== "paper";
      const ink = light ? "#f7f3e9" : east ? "#173b35" : "#2e2548";
      const accent = east ? "#cbb576" : "#bba7e8";
      context.fillStyle = accent;
      context.font = "28px serif";
      context.fillText(current.kicker ?? "LIFE MIRROR · 拾光", 90, 110);
      context.fillStyle = ink;
      context.font = "52px serif";
      context.fillText(current.title, 90, 210);

      const portrait = variant === "character" ? await loadImage(image) : null;
      const textWidth = portrait ? 650 : 880;
      context.font = "46px serif";
      const lines = wrapText(context, `“${current.quote}”`, textWidth);
      let y = 382;
      lines.forEach((line) => {
        context.fillText(line, 90, y);
        y += 78;
      });

      if (portrait) {
        context.save();
        context.globalAlpha = .9;
        const ratio = portrait.width / portrait.height;
        const height = 520;
        context.drawImage(portrait, 680, 720, height * ratio, height);
        context.restore();
      }

      context.fillStyle = light ? "rgba(247,243,233,.62)" : east ? "rgba(23,59,53,.62)" : "rgba(46,37,72,.62)";
      context.font = "25px sans-serif";
      context.fillText(current.meta.slice(0, 64), 90, 1190);
      context.font = "22px sans-serif";
      context.fillText(variant === "paper" ? "LIFE MIRROR · 拾光" : "打开 LifeMirror，回应这张镜像", 90, 1250);

      const blob = await exportCanvas(canvas);
      const name = `lifemirror-${theme}-${variant}.png`;
      if (action === "share" && typeof File !== "undefined" && typeof navigator.share === "function") {
        const file = new File([blob], name, { type: "image/png" });
        let canShare = true;
        try {
          canShare = typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] });
        } catch {
          canShare = false;
        }
        if (canShare) {
          try {
            await navigator.share({ files: [file], title: current.title, text: `${current.quote}\n${current.meta}` });
            setStatus("已打开系统分享面板");
            return;
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
              setStatus("已取消分享，卡片仍可保存");
              return;
            }
          }
        }
      }
      downloadBlob(blob, name);
      setStatus(action === "share" ? "当前浏览器不支持直接分享，已为你保存图片" : "这款分享卡已保存");
    } catch {
      setStatus("暂时无法生成分享卡，请稍后再试");
    }
  }

  return <section className={`${styles.card} ${styles[theme]} ${styles[variant]}`}>
    <div className={styles.content}>
      <small><Sparkle /> {current.kicker ?? "三款镜像卡片"}</small>
      <h3>{current.title}</h3>
      <blockquote>“{current.quote}”</blockquote>
      <span>{current.meta}</span>
      <div className={styles.variants} aria-label="选择分享卡风格">
        {variants.map((item) => <button type="button" className={variant === item.id ? styles.selected : ""} aria-pressed={variant === item.id} onClick={() => { setVariant(item.id); setStatus(""); }} key={item.id}>
          {variant === item.id && <Check />}
          <b>{item.label}</b><em>{item.note}</em>
        </button>)}
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => createCard("share")}><ShareNetwork />分享当前款</button>
        <button type="button" onClick={() => createCard("save")}><DownloadSimple />保存当前款</button>
      </div>
      {status && <p role="status">{status}</p>}
    </div>
    <img src={image} alt="" />
  </section>;
}
