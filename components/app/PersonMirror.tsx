"use client";

import { ArrowLeft, CalendarBlank, ChartPolar, Check, ChatCenteredText, Plus, Sparkle, Star, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { buildPersonContext, personMirrorInsight } from "@/lib/person-context";
import { coachRehearsalReply, createPersonSimulationReply } from "@/lib/relationship-rehearsal";
import { createRelationshipLoop, deletePersonObservation, getPrivatePeople, getRelationshipLoopsForPerson, savePersonObservation, savePrivatePerson, saveSimulationAssessment, type PrivatePerson } from "@/lib/relationship-context";
import { calculateBazi } from "@/server/tools/bazi/engine";
import type { BaziResult } from "@/server/tools/bazi/types";
import { calculateAstrology } from "@/server/tools/astrology/core";
import type { AstrologyResult } from "@/server/tools/astrology/types";
import { LocationPicker } from "./LocationPicker";
import styles from "./PersonMirror.module.css";
import profileStyles from "./PersonMirrorProfile.module.css";

type Message = { role: "user" | "simulation"; text: string; id: string };

export function PersonMirror({ person, onClose, onPractice }: { person: PrivatePerson; onClose: () => void; onPractice: (person: PrivatePerson) => void }) {
  const [observation, setObservation] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [correction, setCorrection] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [birthDetailsOpen, setBirthDetailsOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState<"bazi" | "astrology" | null>(null);
  const [profileNotice, setProfileNotice] = useState("");
  const [birthPlace, setBirthPlace] = useState(person.birthProfile?.place ?? "");
  const [birthOffset, setBirthOffset] = useState(person.birthProfile?.utcOffsetMinutes?.toString() ?? "");
  const [birthLatitude, setBirthLatitude] = useState(person.birthProfile?.latitude?.toString() ?? "");
  const [birthLongitude, setBirthLongitude] = useState(person.birthProfile?.longitude?.toString() ?? "");
  const [loopCreated, setLoopCreated] = useState(false);
  const [, refresh] = useState(0);
  const currentPerson = getPrivatePeople().find((item) => item.id === person.id) ?? person;
  const loops = getRelationshipLoopsForPerson(person.id);
  const evidence = currentPerson.observations ?? [];
  const context = buildPersonContext(currentPerson, loops);
  const baziReference = currentPerson.stableReferences?.bazi.payload as Partial<BaziResult> | undefined;
  const astrologyReference = currentPerson.stableReferences?.astrology.payload as Partial<AstrologyResult> | undefined;
  const baziPillars = baziReference?.pillars?.filter(Boolean).map((item) => item!.ganZhi).join(" · ");
  const astrologyPlanets = astrologyReference?.planets?.slice(0, 5);

  function openBirthProfile() {
    setProfileOpen(true);
    setBirthDetailsOpen(true);
    setProfileNotice("");
    window.setTimeout(() => document.getElementById("person-birth-details")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  function addObservation() { if (!savePersonObservation(person.id, observation)) return; setObservation(""); refresh((value) => value + 1); }
  function send() {
    const text = draft.trim(); if (!text) return;
    const reply = createPersonSimulationReply(currentPerson, text, context);
    setMessages((value) => [...value, { role: "user", text, id: crypto.randomUUID() }, { role: "simulation", text: reply, id: crypto.randomUUID() }]); setDraft("");
  }
  function saveCorrection() { if (!correctionText.trim()) return; savePersonObservation(person.id, correctionText, "owner_correction"); setCorrection(null); setCorrectionText(""); refresh((value) => value + 1); }
  function assessSimulation(assessment: "close" | "partial") { saveSimulationAssessment(person.id, assessment); refresh((value) => value + 1); }
  function prepareReality() {
    if (!messages.length || loopCreated) return;
    const situation = messages.filter((item) => item.role === "user").map((item) => item.text).join(" / ").slice(0, 180);
    createRelationshipLoop({ personId: person.id, situation, need: "把这次练习带回现实" }); setLoopCreated(true); refresh((value) => value + 1);
  }
  async function updateProfile(form: FormData) {
    const date = String(form.get("birthDate") ?? ""); const time = String(form.get("birthTime") ?? ""); const place = String(form.get("birthPlace") ?? "").trim();
    const offsetValue = String(form.get("utcOffsetMinutes") ?? "").trim(); const latitudeValue = String(form.get("latitude") ?? "").trim(); const longitudeValue = String(form.get("longitude") ?? "").trim();
    const utcOffsetMinutes = Number(offsetValue); const latitude = Number(latitudeValue); const longitude = Number(longitudeValue);
    const hasCoordinates = Boolean(offsetValue && latitudeValue && longitudeValue) && Number.isFinite(utcOffsetMinutes) && Number.isFinite(latitude) && Number.isFinite(longitude);
    const birthProfile = date ? { date, time: time || undefined, place: place || undefined, utcOffsetMinutes: hasCoordinates ? utcOffsetMinutes : undefined, latitude: hasCoordinates ? latitude : undefined, longitude: hasCoordinates ? longitude : undefined, timeKnown: Boolean(time), profileKey: `${date}|${time || "unknown"}|${place}|${hasCoordinates ? `${utcOffsetMinutes}|${latitude.toFixed(4)}|${longitude.toFixed(4)}` : "location-pending"}` } : undefined;
    let stableReferences = currentPerson.stableReferences?.profileKey === birthProfile?.profileKey ? currentPerson.stableReferences : undefined;
    if (birthProfile && hasCoordinates && !stableReferences) {
      const [year, month, day] = birthProfile.date.split("-").map(Number);
      const [hour, minute] = birthProfile.time ? birthProfile.time.split(":").map(Number) : [null, 0];
      const bazi = calculateBazi({ year, month, day, hour, minute, utcOffsetMinutes, timeZone: null, dayBoundary: "midnight", useTrueSolarTime: false, longitude: null, luckGender: null });
      const astrology = calculateAstrology({ year, month, day, hour, minute, utcOffsetMinutes, timeZone: null, latitude, longitude });
      const sun = astrology.planets.find((item) => item.key === "sun");
      const ascendant = astrology.angles.find((item) => item.key === "asc");
      stableReferences = {
        profileKey: birthProfile.profileKey,
        calculatedAt: new Date().toISOString(),
        bazi: { summary: `${bazi.pillars.filter(Boolean).map((item) => item!.ganZhi).join(" · ")}；${bazi.fiveElementProfile.dayMaster}${bazi.fiveElementProfile.dayMasterElement}日主`, payload: bazi },
        astrology: { summary: `${sun ? `太阳${sun.sign.name}` : "太阳位置已计算"}${ascendant ? ` · 上升${ascendant.sign.name}` : " · 出生时间未知，未生成上升"}`, payload: astrology },
      };
    }
    savePrivatePerson({ id: person.id, displayName: String(form.get("displayName") ?? ""), relationshipType: String(form.get("relationshipType") ?? ""), userDescription: String(form.get("description") ?? ""), communicationNotes: String(form.get("communicationNotes") ?? ""), birthProfile, stableReferences, isMinor: form.get("isMinor") === "on" });
    setProfileOpen(false); setBirthDetailsOpen(false); setReferenceOpen(stableReferences ? "bazi" : null);
    setProfileNotice(stableReferences ? "出生资料已保存，TA 的命盘与星盘底图已重新生成。" : birthProfile ? "出生资料已保存；选择出生地后会自动补全坐标并生成命盘与星盘底图。" : "人物资料已保存。");
    refresh((value) => value + 1);
  }

  return <div className={styles.backdrop}><main className={styles.page}>
    <header><button type="button" onClick={onClose}><ArrowLeft />返回</button><small>你的视角 · 私密保存</small></header>
    <section className={styles.hero}><p>{currentPerson.relationshipType || "我在意的人"}</p><h1>{currentPerson.displayName}</h1><span>这是你目前视角下的 TA 镜像；真实互动会比模拟更重要。</span><div><button type="button" onClick={() => onPractice(currentPerson)}><Sparkle />快速演练</button><button type="button" onClick={() => document.getElementById("person-observation")?.focus()}><Plus />记录刚刚发生的事</button></div></section>
    <section className={styles.grid}><article><small>拾光目前看到的线索</small><h2>{personMirrorInsight(context)}</h2><p>来自你的 {context.ownerObservations.length} 条观察、{context.realInteractions.length} 次真实反馈、{context.simulationCorrections.length} 条模拟纠正和 {context.simulationAssessments.length} 次轻量校正。它们不是对 TA 的人格结论。</p></article><article><small>未结束的事</small><h2>{context.openLoops.length ? `有 ${context.openLoops.length} 次沟通正等你带回结果` : "暂时没有等待中的沟通"}</h2><p>现实里的回应会成为下一次练习最优先的线索。</p></article></section>
    <section className={styles.timeline}><header><span><small>TA 的镜像资料</small><h2>只保留你的视角</h2></span><button type="button" onClick={() => setProfileOpen((value) => !value)}>{profileOpen ? "收起" : "编辑基本资料"}</button></header><p>{currentPerson.userDescription || "目前还没有你的观察。可以从一件最近发生的具体事开始。"}</p>{currentPerson.communicationNotes && <p>沟通时你想留意：{currentPerson.communicationNotes}</p>}{currentPerson.birthProfile && <p>出生底图：{currentPerson.birthProfile.date}{currentPerson.birthProfile.timeKnown ? ` · ${currentPerson.birthProfile.time}` : " · 时间未知"}{currentPerson.birthProfile.place ? ` · ${currentPerson.birthProfile.place}` : ""}。它只作为待现实验证的象征参考，不会成为人格结论。</p>}{currentPerson.isMinor && <p>未成年人保护已启用：此镜像仅作为你的私密沟通准备，不提供邀请或共享入口。</p>}
      <div className={profileStyles.birthGateway}><span><CalendarBlank /><span><b>生日与出生资料</b><small>{currentPerson.birthProfile ? `${currentPerson.birthProfile.date}${currentPerson.birthProfile.place ? ` · ${currentPerson.birthProfile.place}` : ""}` : "填写后自动生成 TA 的命盘与星盘底图"}</small></span></span><button type="button" onClick={openBirthProfile}>{currentPerson.birthProfile ? "编辑并重新生成" : "添加生日"}</button></div>
      {profileNotice && <p className={profileStyles.profileNotice}><Check />{profileNotice}</p>}
      {currentPerson.stableReferences && <div className={profileStyles.referenceGrid}>
        <article><span><ChartPolar /><b>TA 的命盘底图</b></span><p>{currentPerson.stableReferences.bazi.summary}</p><button type="button" onClick={() => setReferenceOpen((value) => value === "bazi" ? null : "bazi")}>{referenceOpen === "bazi" ? "收起" : "查看命盘"}</button>{referenceOpen === "bazi" && <div className={profileStyles.referenceDetails}><strong>{baziPillars || currentPerson.stableReferences.bazi.summary}</strong>{baziReference?.fiveElementProfile && <p>日主：{baziReference.fiveElementProfile.dayMaster}{baziReference.fiveElementProfile.dayMasterElement}</p>}</div>}</article>
        <article><span><Star /><b>TA 的星盘底图</b></span><p>{currentPerson.stableReferences.astrology.summary}</p><button type="button" onClick={() => setReferenceOpen((value) => value === "astrology" ? null : "astrology")}>{referenceOpen === "astrology" ? "收起" : "查看星盘"}</button>{referenceOpen === "astrology" && <div className={profileStyles.referenceDetails}><strong>{astrologyReference?.headline || currentPerson.stableReferences.astrology.summary}</strong>{astrologyPlanets?.map((planet) => <p key={planet.key}>{planet.name} · {planet.sign.name} {planet.degreeInSign.toFixed(1)}°</p>)}</div>}</article>
      </div>}
      {profileOpen && <form className={profileStyles.profileForm} onSubmit={(event) => { event.preventDefault(); void updateProfile(new FormData(event.currentTarget)); }}>
      <div className={profileStyles.profileFields}>
        <label><span>TA 的昵称</span><input name="displayName" defaultValue={currentPerson.displayName} required maxLength={40}/></label>
        <label><span>和你的关系</span><input name="relationshipType" defaultValue={currentPerson.relationshipType} maxLength={40} placeholder="例如：女儿、朋友、同事"/></label>
        <label className={profileStyles.wideField}><span>你的观察</span><textarea name="description" defaultValue={currentPerson.userDescription} maxLength={300} placeholder="TA 在你心里是什么样的人？"/></label>
        <label className={profileStyles.wideField}><span>沟通时想留意</span><textarea name="communicationNotes" defaultValue={currentPerson.communicationNotes} maxLength={300} placeholder="什么事最容易让 TA 防御或卡住？"/></label>
      </div>
      <details id="person-birth-details" className={profileStyles.birthDetails} open={birthDetailsOpen} onToggle={(event) => setBirthDetailsOpen(event.currentTarget.open)}><summary>出生资料与自动底图 <em>可选</em></summary><p>选择出生地会自动补全坐标；不知道出生时间可以留空。</p>
        <div className={profileStyles.profileFields}>
          <label><span>出生日期</span><input name="birthDate" type="date" defaultValue={currentPerson.birthProfile?.date}/></label>
          <label><span>出生时间</span><input name="birthTime" type="time" defaultValue={currentPerson.birthProfile?.time}/></label>
          <div className={profileStyles.locationPicker}><LocationPicker onSelect={(location, displayName) => { setBirthPlace(displayName); setBirthOffset("480"); setBirthLatitude(location.latitude.toFixed(4)); setBirthLongitude(location.longitude.toFixed(4)); }} /></div>
          <label className={profileStyles.wideField}><span>出生地</span><input name="birthPlace" value={birthPlace} onChange={(event) => setBirthPlace(event.target.value)} maxLength={80} placeholder="城市或地区"/></label>
          <label><span>UTC 偏移（分钟）</span><input name="utcOffsetMinutes" type="number" value={birthOffset} onChange={(event) => setBirthOffset(event.target.value)} placeholder="中国大陆一般为 480"/></label>
          <label><span>纬度</span><input name="latitude" type="number" step="0.0001" value={birthLatitude} onChange={(event) => setBirthLatitude(event.target.value)}/></label>
          <label><span>经度</span><input name="longitude" type="number" step="0.0001" value={birthLongitude} onChange={(event) => setBirthLongitude(event.target.value)}/></label>
        </div>
      </details>
      <label className={profileStyles.minorCheck}><input name="isMinor" type="checkbox" defaultChecked={currentPerson.isMinor}/><span>TA 是未成年人 <small>仅限私密沟通准备</small></span></label>
      <button className={profileStyles.saveProfile}>保存资料</button>
    </form>}</section>
    <section className={styles.chat}><header><div><small>和 {currentPerson.displayName} 练习一下</small><h2>说一句你真的可能会说的话</h2></div><ChatCenteredText /></header><p>这里是一种可纠正的可能回应，不是现实中的 TA，也不会被自动写成事实。</p><div className={styles.messages}>{messages.map((message) => <article className={message.role === "user" ? styles.user : styles.simulation} key={message.id}><b>{message.role === "user" ? "你" : `${currentPerson.displayName} · 模拟`}</b><p>{message.text}</p>{message.role === "simulation" && <div><button onClick={() => assessSimulation("close")}>像 TA</button><button onClick={() => assessSimulation("partial")}>有一点像</button><button onClick={() => setCorrection(message.id)}>不像 TA</button></div>}{correction === message.id && <aside><input autoFocus value={correctionText} onChange={(event) => setCorrectionText(event.target.value)} placeholder="TA 更可能怎么说？"/><button onClick={saveCorrection}>保存这条纠正</button></aside>}</article>)}</div><div className={styles.compose}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`例如：${currentPerson.displayName}，我想聊聊昨天那件事……`} maxLength={240}/><button onClick={send}>发送</button></div>{messages.length > 0 && <><p className={styles.coach}><Sparkle />{coachRehearsalReply(messages.filter((item) => item.role === "user").at(-1)?.text ?? "")}</p><button className={styles.reality} onClick={prepareReality} disabled={loopCreated}><Check />{loopCreated ? "已准备，之后回来告诉拾光结果" : "我准备这么说，之后回来告诉拾光结果"}</button></>}</section>
    <section className={styles.timeline}><header><small>你们最近发生的事</small><h2>关系时间线</h2></header><form onSubmit={(event) => { event.preventDefault(); addObservation(); }}><textarea id="person-observation" value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="记录一件具体发生的事，不需要替 TA 下结论" maxLength={300}/><button>保存观察</button></form>{[...evidence, ...loops.map((loop) => ({ id: loop.id, text: loop.reflection || loop.situation, source: loop.status === "reported" ? "real_world_feedback" : "planned_action", createdAt: loop.reportedAt ?? loop.createdAt }))].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((item) => <article key={item.id}><small>{item.source === "owner_correction" ? "模拟纠正" : item.source === "simulation_assessment" ? "模拟反馈" : item.source === "real_world_feedback" ? "真实互动" : item.source === "planned_action" ? "准备行动" : "你的观察"}</small><p>{item.text}</p>{"updatedAt" in item && <button aria-label="删除这条观察" onClick={() => { deletePersonObservation(person.id, item.id); refresh((value) => value + 1); }}><Trash /></button>}</article>)}</section>
  </main></div>;
}
