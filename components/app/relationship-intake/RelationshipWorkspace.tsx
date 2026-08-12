"use client";

import { CaretDown, ChatCircleDots, Plus, UserCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { ShiguangChat } from "../ShiguangChat";
import { getPrivatePeople, savePrivatePerson, type PrivatePerson } from "@/lib/relationship-context";
import { classifyRelationship, relationshipLabel } from "@/lib/relationships/taxonomy";
import { fetchRelationshipPersonContext, fetchRelationshipSnapshot, linkRelationshipCase, saveRelationshipPerson } from "@/lib/relationships/repository";
import type { RelationshipCase, RelationshipHomeMode, RelationshipMemoryContext, RelationshipPerson } from "@/lib/relationships/types";
import { recordProductMetric } from "@/lib/product-metrics";
import styles from "./RelationshipWorkspace.module.css";

type Props = { mode: RelationshipHomeMode };

function normalizedLocal(person: PrivatePerson): RelationshipPerson {
  const inferred = classifyRelationship(`${person.relationshipType ?? ""} ${person.userDescription ?? ""}`);
  return { id: person.id, displayName: person.displayName, relationshipLabel: person.relationshipType ?? "", domain: person.relationshipDomain ?? inferred.domain, role: person.relationshipRole ?? inferred.role, stage: person.relationshipStage ?? inferred.stage, powerPosition: person.powerPosition ?? inferred.powerPosition, confirmedByUser: person.relationshipConfirmed ?? Boolean(person.relationshipType), legacyPersonId: person.id, createdAt: person.createdAt, updatedAt: person.updatedAt };
}

export function RelationshipWorkspace({ mode }: Props) {
  const [people, setPeople] = useState<RelationshipPerson[]>([]);
  const [cases, setCases] = useState<RelationshipCase[]>([]);
  const [personId, setPersonId] = useState<string>("");
  const [personMenu, setPersonMenu] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("暧昧中");
  const [hasActivity, setHasActivity] = useState(false);
  const [personMemory, setPersonMemory] = useState<RelationshipMemoryContext>({ recentCases: [], extractedMessages: [], priorAnalyses: [], realityFeedback: [] });

  useEffect(() => {
    recordProductMetric("relationship_entry_opened", "relationship", `rel-open:${new Date().toISOString().slice(0, 10)}`);
    const local = getPrivatePeople().map(normalizedLocal);
    setPeople(local);
    void fetchRelationshipSnapshot().then((snapshot) => {
      const byId = new Map<string, RelationshipPerson>();
      const migratedLegacyIds = new Set(snapshot.people.map((person) => person.legacyPersonId).filter(Boolean));
      [...local.filter((person) => !migratedLegacyIds.has(person.id)), ...snapshot.people].forEach((person) => byId.set(person.id, person));
      const merged = [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setPeople(merged); setCases(snapshot.cases);
      const active = snapshot.cases.find((item) => item.status === "awaiting_reply" || item.status === "open");
      if (active?.personId && merged.some((person) => person.id === active.personId)) setPersonId(active.personId);
    }).catch(() => undefined);
  }, []);

  const person = people.find((item) => item.id === personId);
  const activeCase = useMemo(() => cases.find((item) => item.personId === personId && (item.status === "awaiting_reply" || item.status === "open")), [cases, personId]);
  useEffect(() => {
    if (!personId) { setPersonMemory({ recentCases: [], extractedMessages: [], priorAnalyses: [], realityFeedback: [] }); return; }
    let active = true;
    void fetchRelationshipPersonContext(personId).then((value) => { if (active) setPersonMemory(value); });
    return () => { active = false; };
  }, [personId, cases]);
  useEffect(() => { if (activeCase) recordProductMetric("relationship_case_revisited", "relationship", `rel-revisit:${activeCase.id}:${new Date().toISOString().slice(0, 10)}`); }, [activeCase]);
  const intro = mode === "first_visit"
    ? { eyebrow: "把聊天交给拾光", title: "看不懂 TA，也不知道怎么回？", body: "粘贴聊天、发截图，或者直接描述发生了什么。拾光会先判断这段互动，再给你一句真正说得出口的话。" }
    : person
      ? { eyebrow: `正在聊 · ${person.displayName}`, title: activeCase ? "TA 后来怎么回？" : `继续聊 ${person.displayName}`, body: activeCase?.summary ? `我还记得上次是“${activeCase.summary}”。把新的回应或变化发来，不用重新讲背景。` : "把最新的聊天、截图或变化发来，拾光会接着已有的情况判断。" }
      : { eyebrow: "关系分析", title: "今天想看懂哪段关系？", body: "把最近的聊天、截图或发生的事情告诉拾光。不保存人物也可以先分析当前这一次。" };

  async function savePerson() {
    const displayName = newName.trim().slice(0, 40); if (!displayName) return;
    const classification = classifyRelationship(newRelation);
    const local = savePrivatePerson({ displayName, relationshipType: newRelation, relationshipDomain: classification.domain, relationshipRole: classification.role, relationshipStage: classification.stage, powerPosition: classification.powerPosition, relationshipConfirmed: true });
    if (!local) return;
    let next = normalizedLocal(local);
    try { next = await saveRelationshipPerson({ displayName, relationshipLabel: newRelation, legacyPersonId: local.id }); } catch {}
    const orphan = cases.find((item) => !item.personId && (item.status === "open" || item.status === "awaiting_reply"));
    if (orphan) {
      const linked = await linkRelationshipCase(orphan.id, next.id).catch(() => null);
      setCases((current) => current.map((item) => item.id === orphan.id ? linked ?? { ...item, personId: next.id, updatedAt: new Date().toISOString() } : item));
    }
    setPeople((current) => [next, ...current.filter((item) => item.id !== next.id && item.id !== local.id)]); setPersonId(next.id); setSaveOpen(false); setNewName("");
    recordProductMetric("relationship_person_saved", "relationship", `rel-person:${next.id}`);
  }

  return <section className={styles.workspace} aria-label="恋爱与关系工作区">
    <div className={styles.heading}>
      <small><ChatCircleDots /> {intro.eyebrow}</small>
      <h1>{intro.title}</h1>
      <p>{intro.body}</p>
    </div>

    {(people.length > 0 || hasActivity) && <div className={styles.peopleRow}>
      <button className={styles.personTrigger} type="button" onClick={() => setPersonMenu((value) => !value)} aria-expanded={personMenu}>
        <UserCircle weight="fill" /><span>{person ? person.displayName : "暂不关联人物"}<small>{person ? person.relationshipLabel || relationshipLabel(person.role) : "这次也可以只聊当前问题"}</small></span><CaretDown />
      </button>
      <button className={styles.addPerson} type="button" onClick={() => setSaveOpen(true)}><Plus /> 保存一个 TA</button>
      {personMenu && <div className={styles.personMenu}>
        <button type="button" onClick={() => { setPersonId(""); setPersonMenu(false); }}>暂不关联人物</button>
        {people.map((item) => <button type="button" key={item.id} onClick={() => { setPersonId(item.id); setPersonMenu(false); }}>{item.displayName}<small>{item.relationshipLabel || relationshipLabel(item.role)}</small></button>)}
        <button type="button" onClick={() => { setPersonMenu(false); setSaveOpen(true); }}><Plus /> 新的人</button>
      </div>}
    </div>}

    <ShiguangChat theme="east" mode="home" onboarding={mode === "first_visit"} context={`这是 LifeMirror 的关系工作区。用户在这里持续咨询同一个或不同的重要人物。当前人物：${person ? `${person.displayName}（${person.relationshipLabel || relationshipLabel(person.role)}，私密编号 ${person.id}）` : "未关联人物"}。`} relationship={{ person, activeCase, memory: personMemory, onActivity: () => setHasActivity(true), onCaseCreated: (next) => setCases((current) => [next, ...current.filter((item) => item.id !== next.id)]) }} opening={mode === "first_visit" ? "把你们的聊天贴过来，或者直接告诉我发生了什么。我先帮你看懂，再一起定下一句话。" : person ? `我还记得 ${person.displayName}。把最新的变化发来，我们从上次那里接着看。` : "把最近那段聊天或发生的事发来。我会先给判断，也会帮你把下一句话说得自然。"} />

    {hasActivity && !person && <button className={styles.saveAfter} type="button" onClick={() => setSaveOpen(true)}><Plus /> 以后还想继续聊这个人？给 TA 一个只有你看得见的称呼</button>}

    {saveOpen && <div className={styles.savePanel}>
      <div><b>给 TA 一个只有你看得见的称呼</b><button type="button" onClick={() => setSaveOpen(false)} aria-label="关闭">×</button></div>
      <input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={40} placeholder="例如：小林" autoFocus />
      <div className={styles.relationChips}>{["暧昧中", "伴侣", "前任", "朋友", "同事", "领导", "家人"].map((label) => <button type="button" key={label} className={newRelation === label ? styles.selected : ""} onClick={() => setNewRelation(label)}>{label}</button>)}</div>
      <button className={styles.confirmSave} type="button" disabled={!newName.trim()} onClick={() => void savePerson()}>保存并继续</button>
    </div>}
  </section>;
}
