"use client";

import { Check, ChatCenteredText, ShieldCheck, Sparkle, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { coachRehearsalReply, createRelationshipRehearsal, type RehearsalPath } from "@/lib/relationship-rehearsal";
import type { PrivatePerson } from "@/lib/relationship-context";
import styles from "./RelationshipSandbox.module.css";

export function RelationshipSandbox({ person, onClose }: { person: PrivatePerson; onClose: () => void }) {
  const [situation, setSituation] = useState(""); const [need, setNeed] = useState(""); const [started, setStarted] = useState(false); const [path, setPath] = useState<RehearsalPath | null>(null); const [reply, setReply] = useState("");
  const rehearsal = useMemo(() => createRelationshipRehearsal(person, situation, need), [person, situation, need]);
  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="sandbox-title"><section className={styles.sheet}>
    <header><span><Sparkle /> RELATIONSHIP SANDBOX</span><button onClick={onClose} aria-label="关闭关系演练"><X /></button></header><h2 id="sandbox-title">和 {person.displayName} 练习怎么说</h2><p className={styles.intro}>这是一次私密的沟通排练，不是 {person.displayName} 的数字分身。所有“回应”都只是依据你目前资料给出的可能路径。</p>
    {!started ? <form onSubmit={(event) => { event.preventDefault(); setStarted(true); }} className={styles.setup}><label>这次想谈什么？<textarea autoFocus required maxLength={180} value={situation} onChange={(event) => setSituation(event.target.value)} placeholder="例如：我不喜欢对方经常突然消失，又不知道怎么提" /></label><label>你希望这次谈话带来什么？<textarea maxLength={180} value={need} onChange={(event) => setNeed(event.target.value)} placeholder="例如：希望我们能约好忙时怎么说一声" /></label><button type="submit"><ChatCenteredText />开始演练</button></form> : <div className={styles.rehearsal}>
      <div className={styles.provenance}><ShieldCheck />{rehearsal.perspective}</div><article className={styles.opening}><small>你可以这样开场</small><p>“{rehearsal.opening}”</p></article><div className={styles.checkpoints}><b>说之前，先过这三关</b><ul>{rehearsal.checkpoints.map((item) => <li key={item}><Check />{item}</li>)}</ul></div><div className={styles.paths}><b>如果 TA 这样回应……</b>{rehearsal.paths.map((item) => <button type="button" key={item.id} className={path?.id === item.id ? styles.activePath : ""} onClick={() => setPath(item)}><strong>{item.label}</strong><span>{item.response}</span></button>)}</div>{path && <article className={styles.nextMove}><small>你可以接着说</small><p>“{path.nextMove}”</p></article>}<label className={styles.reply}>换成你的话试一句<textarea maxLength={240} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="写下你真实会说的话……" /></label><p className={styles.coach}><Sparkle />{coachRehearsalReply(reply)}</p><p className={styles.temporary}>这段演练不会自动写入长期记忆或作为对 TA 的事实。谈完以后，只有你主动记录的现实进展才会留下。</p>
    </div>}
  </section></div>;
}
