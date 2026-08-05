"use client";

import { CheckCircle, FloppyDisk } from "@phosphor-icons/react";
import { useState } from "react";
import styles from "./MirrorSaveButton.module.css";
import { markAccountDataChanged } from "@/lib/account-data";

const HISTORY_KEY = "life-mirror:guest-history:v1";

export type MirrorSource = "tarot" | "bazi" | "astrology";

type Props = {
  source: MirrorSource;
  question: string;
  title: string;
  summary: string;
  meta: string;
  payload?: unknown;
};

export function MirrorSaveButton({ source, question, title, summary, meta, payload }: Props) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function save() {
    try {
      const previous = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]");
      const events = Array.isArray(previous) ? previous : [];
      const record = {
        id: globalThis.crypto.randomUUID(),
        source,
        sourceLabel: title,
        question,
        meta,
        payload,
        reflection: {
          shareableReflection: summary,
          shiguangInterpretation: summary,
        },
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...events].slice(0, 50)));
      markAccountDataChanged();
      setSaved(true);
      setError("");
    } catch {
      setError("暂时无法保存，请检查浏览器是否允许本地存储。");
    }
  }

  return <div className={styles.wrap}>
    <button type="button" onClick={save} disabled={saved}>
      {saved ? <CheckCircle weight="fill" /> : <FloppyDisk />}
      {saved ? "已保存" : "保存"}
    </button>
    <small>{saved ? "已保存到“我的镜像”。" : "保存后可在“我的镜像”里再次查看。"}</small>
    {error && <p role="alert">{error}</p>}
  </div>;
}
