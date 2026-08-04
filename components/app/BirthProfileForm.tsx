"use client";
import { CalendarBlank, Check, Clock, MapPin } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import styles from "./BirthProfileForm.module.css";
type Props={tradition:"east"|"west"};
const currentYear=new Date().getFullYear();
const years=Array.from({length:121},(_,i)=>currentYear-i);
export function BirthProfileForm({tradition}:Props){
 const [year,setYear]=useState(1990),[month,setMonth]=useState(1),[day,setDay]=useState(1),[hour,setHour]=useState(12),[minute,setMinute]=useState(0); const [unknownTime,setUnknownTime]=useState(false),[place,setPlace]=useState(""),[saved,setSaved]=useState(false); const maxDay=useMemo(()=>new Date(year,month,0).getDate(),[year,month]); const validDay=Math.min(day,maxDay);
 return <form className={`${styles.form} ${styles[tradition]}`} onSubmit={e=>{e.preventDefault();setSaved(true)}}>
  <div className={styles.notice}><CalendarBlank/><p><b>先建立出生资料</b><span>年份支持直接输入与长列表滚动；资料只用于排盘，你可以随时修改。</span></p></div>
  <fieldset><legend>出生日期 <em>必填</em></legend><div className={styles.dateGrid}>
   <label><span>年</span><input list="birth-years" inputMode="numeric" value={year} min={1900} max={currentYear} onChange={e=>setYear(Number(e.target.value))} aria-label="出生年份"/><datalist id="birth-years">{years.map(v=><option value={v} key={v}/>)}</datalist></label>
   <label><span>月</span><select value={month} onChange={e=>setMonth(Number(e.target.value))}>{Array.from({length:12},(_,i)=>i+1).map(v=><option value={v} key={v}>{v} 月</option>)}</select></label>
   <label><span>日</span><select value={validDay} onChange={e=>setDay(Number(e.target.value))}>{Array.from({length:maxDay},(_,i)=>i+1).map(v=><option value={v} key={v}>{v} 日</option>)}</select></label>
  </div><div className={styles.yearShortcuts}>{[1980,1990,2000,2010].map(v=><button type="button" onClick={()=>setYear(v)} key={v}>{v}年代</button>)}</div></fieldset>
  <fieldset><legend>出生时间 <em>建议填写</em></legend><div className={styles.timeRow}><Clock/><select value={hour} disabled={unknownTime} onChange={e=>setHour(Number(e.target.value))}>{Array.from({length:24},(_,i)=><option value={i} key={i}>{String(i).padStart(2,"0")} 时</option>)}</select><select value={minute} disabled={unknownTime} onChange={e=>setMinute(Number(e.target.value))}>{[0,15,30,45].map(i=><option value={i} key={i}>{String(i).padStart(2,"0")} 分</option>)}</select><label className={styles.unknown}><input type="checkbox" checked={unknownTime} onChange={e=>setUnknownTime(e.target.checked)}/>不知道具体时间</label></div><small>{tradition==="east"?"时辰会影响时柱；未知时将只生成不含时柱的有限命盘。":"出生时间影响上升点与宫位；未知时将不展示宫位结论。"}</small></fieldset>
  <fieldset><legend>出生地点 <em>必填</em></legend><label className={styles.place}><MapPin/><input value={place} onChange={e=>setPlace(e.target.value)} placeholder="输入城市，例如：杭州 / New York"/><span>用于确定时区与真太阳时边界</span></label></fieldset>
  <label className={styles.consent}><input required type="checkbox"/>我理解这是一种象征性自我探索工具，不替代医疗、法律或财务建议。</label><button className={styles.submit} disabled={!place.trim()}>{saved?<><Check/>出生资料已保存</>:tradition==="east"?"生成专业命盘":"生成本命星盘"}</button>
 </form>;
}
