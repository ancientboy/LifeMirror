"use client";

import { X } from "@phosphor-icons/react";
import type { AttachmentDraft } from "./AttachmentPicker";

export function AttachmentPreview({ items, onRemove, className }: { items: AttachmentDraft[]; onRemove: (id: string) => void; className?: string }) {
  if (!items.length) return null;
  return <div className={className} data-attachment-preview>{items.map((item, index) => <figure key={item.id}>
    <img src={item.previewUrl} alt={`聊天截图 ${index + 1}`} />
    <button type="button" onClick={() => onRemove(item.id)} aria-label={`删除截图 ${index + 1}`}><X /></button>
    <figcaption>{item.status === "uploading" ? "识别中…" : item.status === "error" ? "识别失败" : `${index + 1}`}</figcaption>
  </figure>)}</div>;
}
