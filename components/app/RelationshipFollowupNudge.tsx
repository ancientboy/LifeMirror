"use client";

import { Sparkle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { dismissRelationshipFollowup, getDueRelationshipFollowup, getPrivatePeople, markRelationshipFollowupSeen, recordRelationshipEffectEvent, reportRelationshipLoop, type RelationshipLoop } from "@/lib/relationship-context";
import styles from "./RelationshipFollowupNudge.module.css";

export function RelationshipFollowupNudge() {
  const [loop, setLoop] = useState<RelationshipLoop | null>(null);
  const [outcome, setOutcome] = useState<RelationshipLoop["outcome"]>();
  const [reflection, setReflection] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/session", { credentials: "include" }).then((response) => {
      if (!response.ok || !active) return;
      const due = getDueRelationshipFollowup();
      if (!due) return;
      markRelationshipFollowupSeen(due.id);
      void recordRelationshipEffectEvent(due, "followup_seen");
      setLoop(due);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  if (!loop) return null;
  const person = getPrivatePeople().find((item) => item.id === loop.personId);
  const after72Hours = Date.now() - new Date(loop.createdAt).getTime() >= 72 * 3_600_000;
  const save = (actionTaken: boolean) => {
    reportRelationshipLoop(loop.id, { actionTaken, outcome, reflection });
    setLoop(null);
  };

  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="relationship-followup-title">
    <section className={styles.card}>
      <p className={styles.eyebrow}><Sparkle /> 现实回访</p>
      <h2 id="relationship-followup-title">和 {person?.displayName ?? "TA"} 后来怎么样了？</h2>
      <p>{after72Hours ? "拾光隔了几天再来问问。点一下就够，这只记录你这次互动，不会变成对 TA 的结论。" : "如果你已经去聊过，带回一个结果就好。下一次演练会据此调整。"}</p>
      <div className={styles.outcomes}>{([['smooth', '顺利'], ['mixed', '一般'], ['rough', '翻车']] as const).map(([value, label]) => <button type="button" className={outcome === value ? styles.selected : undefined} key={value} onClick={() => setOutcome(value)}>{label}</button>)}</div>
      <textarea value={reflection} maxLength={300} onChange={(event) => setReflection(event.target.value)} placeholder="可选：发生了什么？你有什么感受？" />
      <div className={styles.actions}><button className={styles.primary} type="button" onClick={() => save(Boolean(outcome))}>记录现实反馈</button><button className={styles.quiet} type="button" onClick={() => { dismissRelationshipFollowup(loop.id); setLoop(null); }}>晚点再说</button></div>
    </section>
  </div>;
}
