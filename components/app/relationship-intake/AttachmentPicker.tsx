"use client";

import { ImageSquare } from "@phosphor-icons/react";
import { useRef } from "react";

export type AttachmentDraft = { id: string; file: File; previewUrl: string; width: number; height: number; status: "ready" | "uploading" | "parsed" | "error" };

async function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("image_encode_failed")), type, quality));
}

export async function prepareImage(file: File): Promise<AttachmentDraft> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("unsupported_image_type");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d"); if (!context) throw new Error("canvas_unavailable");
  context.drawImage(bitmap, 0, 0, width, height); bitmap.close();
  let blob = await canvasBlob(canvas, "image/webp", .86);
  if (blob.size > 1_200_000) blob = await canvasBlob(canvas, "image/jpeg", .72);
  if (blob.size > 1_200_000) throw new Error("image_too_large");
  const clean = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: blob.type, lastModified: Date.now() });
  return { id: crypto.randomUUID(), file: clean, previewUrl: URL.createObjectURL(clean), width, height, status: "ready" };
}

export function AttachmentPicker({ disabled, remaining, onPrepared, onError }: { disabled?: boolean; remaining: number; onPrepared: (items: AttachmentDraft[]) => void; onError: (message: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <>
    <button type="button" disabled={disabled || remaining <= 0} onClick={() => inputRef.current?.click()} aria-label="上传聊天截图"><ImageSquare /></button>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => {
      const files = [...(event.target.files ?? [])].slice(0, remaining);
      event.currentTarget.value = "";
      void Promise.all(files.map(prepareImage)).then(onPrepared).catch((error) => onError(error instanceof Error && error.message === "image_too_large" ? "图片压缩后仍超过 1.2MB，请换一张更清晰但尺寸更小的截图。" : "暂时只支持 JPG、PNG 和 WebP 图片。"));
    }} />
  </>;
}

