"use client";

import { ArrowLeft, ArrowRight, CardsThree, MoonStars, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./TarotExperience.module.css";

type Stage="question"|"shuffle"|"reading";
const deck=[
  {name:"隐者",roman:"IX",light:"答案正在安静处成形",meaning:"你需要的不是更多外界意见，而是一小段不被打扰的诚实。"},
  {name:"星星",roman:"XVII",light:"希望值得被重新相信",meaning:"你正在恢复与未来的连接。先保护那一点微弱但真实的愿望。"},
  {name:"力量",roman:"VIII",light:"柔软也是一种掌控",meaning:"此刻最有效的力量不是压过情绪，而是允许它被看见、被安放。"},
  {name:"女祭司",roman:"II",light:"有些答案先以直觉抵达",meaning:"你已经感受到某件事，只是理性还没有为它找到语言。"},
  {name:"节制",roman:"XIV",light:"让两种需要重新调和",meaning:"不必在两个极端之间立刻选边，新的比例正在出现。"},
  {name:"愚者",roman:"0",light:"轻一点，路才会出现",meaning:"你不需要准备到万无一失，下一步只需要足够真实。"},
];
const prompts=["我此刻真正需要看见什么？","这段关系在提醒我什么？","下一步该把能量放在哪里？"];
const assetPath=(path:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH??""}${path}`;

export function TarotExperience(){
  const [stage,setStage]=useState<Stage>("question"); const [question,setQuestion]=useState(""); const [seed,setSeed]=useState(0);
  const cards=useMemo(()=>[0,1,2].map((i)=>deck[(seed+i*2)%deck.length]),[seed]);
  function draw(){ setSeed(Math.floor(Math.random()*deck.length)); setStage("shuffle"); window.setTimeout(()=>setStage("reading"),1250); }
  function reset(){setStage("question");setQuestion("");}
  return <main className={styles.shell}>
    <header><Link href="/"><ArrowLeft/> 双镜域</Link><span><MoonStars/> WESTERN MIRROR · 拾光</span><Link href="/mirror/">我的镜像</Link></header>
    <div className={styles.stars}/><img className={styles.shiguang} src={assetPath("/characters/shiguang/shiguang-west.webp")} alt="西方拾光"/>
    {stage==="question"&&<section className={styles.intro}>
      <span className={styles.eyebrow}>THREE-CARD MIRROR · 三张牌镜像</span><h1>把问题交给牌面，<br/><em>把答案留给自己。</em></h1>
      <p>塔罗不是替你决定未来。拾光会用三张牌，陪你看见「正在离开、此刻核心、正在靠近」。</p>
      <label><CardsThree/><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="写下此刻萦绕在心里的问题……" maxLength={120}/><small>{question.length}/120</small></label>
      <div className={styles.prompts}>{prompts.map(p=><button key={p} onClick={()=>setQuestion(p)}>{p}</button>)}</div>
      <button className={styles.primary} disabled={question.trim().length<5} onClick={draw}>让拾光为我洗牌 <ArrowRight/></button>
    </section>}
    {stage==="shuffle"&&<section className={styles.shuffle}><div className={styles.deck}>{[0,1,2,3,4].map(i=><i key={i} style={{"--i":i} as React.CSSProperties}/>)}</div><h1>让问题安静地落进牌里</h1><p>拾光正在为你整理象征的线索……</p></section>}
    {stage==="reading"&&<section className={styles.reading}>
      <span className={styles.eyebrow}>SHIGUANG READING · 拾光解读</span><h1>三束光，落在同一个问题上</h1><blockquote>“{question}”</blockquote>
      <div className={styles.cards}>{cards.map((card,i)=><article key={card.name} style={{"--delay":`${i*.16}s`} as React.CSSProperties}><div className={styles.cardFace}><small>{card.roman}</small><Sparkle/><b>{card.name}</b><span>{["正在离开","此刻核心","正在靠近"][i]}</span></div><h2>{card.light}</h2><p>{card.meaning}</p></article>)}</div>
      <div className={styles.insight}><img src={assetPath("/characters/shiguang/shiguang-west-avatar.webp")} alt=""/><div><small>拾光看见</small><p>{cards[1].meaning} 先别急着把牌面变成结论，今天只做一件能让你更靠近真实感受的小事。</p></div></div>
      <div className={styles.actions}><button onClick={reset}>换一个问题</button><Link href="/mirror/">保存到我的镜像 <ArrowRight/></Link></div>
    </section>}
  </main>;
}
