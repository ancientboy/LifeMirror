"use client";

import { ArrowLeft, ArrowRight, CheckCircle, Compass, ShieldCheck } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { getSunSign, getYearPillar, type KnowledgePack } from "@/lib/knowledge-packs";
import styles from "./KnowledgePackExperience.module.css";

const dimensionLabels = ["很少", "较少", "一般", "较多", "非常明显"];

function buildResult(pack: KnowledgePack, date: string, focus: string, scores: number[]) {
  if (pack.id === "astrology") {
    const sign = getSunSign(date);
    return { title: `太阳星座 · ${sign}`, body: `${sign}提供的是一种象征视角：留意你在“${focus}”中如何表达意愿、建立边界并回应变化。最重要的不是描述是否悦耳，而是它能否帮你发现一条可验证的现实线索。` };
  }
  if (pack.id === "bazi") {
    const year = Number(date.slice(0, 4));
    const pillar = getYearPillar(year);
    return { title: `年柱基础镜像 · ${pillar.label}（${pillar.element}${pillar.animal}）`, body: `先把“${pillar.element}”当作一种文化象征，观察你在“${focus}”中如何启动、维持或调整力量。这只是年柱入口；完整命盘仍需节气、时辰与四柱计算，因此这里不做命运结论。` };
  }
  const names = pack.id === "personality" ? ["开放探索", "秩序推进", "社交能量", "情绪敏感"] : ["压力负荷", "恢复资源", "关系连接", "行动掌控"];
  const strongest = scores.reduce((best, value, index) => value > scores[best] ? index : best, 0);
  const weakest = scores.reduce((best, value, index) => value < scores[best] ? index : best, 0);
  return {
    title: `此刻最显著 · ${names[strongest]}`,
    body: `你在“${focus}”中对「${names[strongest]}」的感受最强，而「${names[weakest]}」相对较弱。把它当作一次状态快照：接下来七天，记录一个支持它的例子和一个反例，再决定是否需要调整。`,
  };
}

export function KnowledgePackExperience({ pack }: { pack: KnowledgePack }) {
  const [date, setDate] = useState("");
  const [focus, setFocus] = useState("");
  const [scores, setScores] = useState([3, 3, 3, 3]);
  const [result, setResult] = useState<{ title: string; body: string } | null>(null);
  const symbolic = pack.id === "astrology" || pack.id === "bazi";
  const dimensions = pack.id === "personality" ? ["我愿意尝试新角度", "我会建立计划并推进", "互动通常给我能量", "我容易察觉情绪变化"] : ["近期压力占据很多注意力", "我有稳定的恢复方式", "我能感到关系支持", "我能推动重要的小行动"];

  return <main className={styles.shell}>
    <header className={styles.topbar}><Link href="/app/"><ArrowLeft /> 返回探索大厅</Link><Link href="/mirror/">我的镜像</Link></header>
    <section className={styles.hero}>
      <span className={styles.symbol}>{pack.symbol}</span>
      <div><p>{pack.eyebrow}</p><h1>{pack.name}</h1><strong>{pack.summary}</strong></div>
    </section>
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const submittedDate = String(form.get("birthDate") ?? "");
        const submittedFocus = String(form.get("focus") ?? "").trim();
        setDate(submittedDate);
        setFocus(submittedFocus);
        setResult(buildResult(pack, submittedDate, submittedFocus, scores));
      }}>
        <header><Compass /><div><small>KNOWLEDGE ROUTER</small><h2>建立这次观察的语境</h2></div></header>
        {symbolic && <label>出生日期<input name="birthDate" type="date" required value={date} onChange={(event) => { setDate(event.target.value); setResult(null); }} /></label>}
        <label>这次最想理解的生活领域<input name="focus" required minLength={2} maxLength={80} value={focus} onChange={(event) => { setFocus(event.target.value); setResult(null); }} placeholder="例如：工作选择、关系边界、最近的压力" /></label>
        {!symbolic && <fieldset><legend>按最近两周的真实感受选择</legend>{dimensions.map((label, index) => <label className={styles.scale} key={label}><span>{label}<b>{dimensionLabels[scores[index] - 1]}</b></span><input type="range" min="1" max="5" value={scores[index]} onChange={(event) => { const next = [...scores]; next[index] = Number(event.target.value); setScores(next); setResult(null); }} /></label>)}</fieldset>}
        <button type="submit">生成结构化镜像 <ArrowRight /></button>
      </form>
      <aside className={styles.context}>
        <small>KNOWLEDGE CONTEXT</small><h2>系统会如何使用它</h2>
        <dl><div><dt>视角</dt><dd>{pack.perspective}</dd></div><div><dt>来源</dt><dd>{pack.source}</dd></div><div><dt>证据属性</dt><dd>{pack.evidence === "research" ? "研究启发" : pack.evidence === "cultural" ? "文化象征" : "混合视角"}</dd></div></dl>
        <p><ShieldCheck />{pack.boundary}</p>
      </aside>
    </div>
    {result && <section className={styles.result} aria-live="polite"><header><CheckCircle /><small>YOUR MIRROR · 可验证，不定义你</small></header><h2>{result.title}</h2><p>{result.body}</p><div>{pack.prompts.map((prompt, index) => <article key={prompt}><span>0{index + 1}</span><p>{prompt}</p></article>)}</div><Link href="/mirror/">带着这次观察查看个人镜像 <ArrowRight /></Link></section>}
  </main>;
}
