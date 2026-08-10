"use client";

import { CalendarBlank, Check, Clock, Compass, MapPin, SpinnerGap } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { CITY_COORDINATES, resolveCityCoordinate } from "../../lib/city-coordinates";
import type { ChinaLocation } from "../../lib/china-locations";
import { calculateBazi } from "../../server/tools/bazi/engine";
import { buildBaziLifeDomainInsights } from "../../server/tools/bazi/interpretation";
import type { BaziResult, LuckGender } from "../../server/tools/bazi/types";
import { calculateAstrology } from "../../server/tools/astrology/core";
import type { AstrologyResult } from "../../server/tools/astrology/types";
import { AstrologyChart } from "./AstrologyChart";
import { LocationPicker } from "./LocationPicker";
import { ShiguangChat } from "./ShiguangChat";
import { UnifiedMirrorResult, type MirrorResult } from "./UnifiedMirrorResult";
import styles from "./BirthProfileForm.module.css";
import { formatSavedBirthProfile, getSavedBirthProfile, saveBirthProfile } from "../../lib/birth-profile";
import { getSavedNatalMirror, saveNatalMirror, saveNatalMirrorReflection, type SavedNatalMirror } from "../../lib/natal-mirror-history";

type Props = { tradition: "east" | "west"; profileOnly?: boolean };
const currentYear = new Date().getFullYear();
const years = Array.from({ length: Math.min(currentYear, 2100) - 1899 }, (_, index) => Math.min(currentYear, 2100) - index);
const offsets = [-720, -660, -600, -540, -480, -420, -360, -300, -240, -180, -120, -60, 0, 60, 120, 180, 210, 240, 270, 300, 330, 345, 360, 390, 420, 480, 540, 570, 600, 660, 720, 780, 840];
const formatOffset = (minutes: number) => `UTC${minutes >= 0 ? "+" : "-"}${String(Math.floor(Math.abs(minutes) / 60)).padStart(2, "0")}:${String(Math.abs(minutes) % 60).padStart(2, "0")}`;
const formatCoordinate = (value: number) => Number.isFinite(value) ? Number(value.toFixed(4)).toString() : "";

export function BirthProfileForm({ tradition, profileOnly = false }: Props) {
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [unknownTime, setUnknownTime] = useState(false);
  const [place, setPlace] = useState("");
  const [utcOffsetMinutes, setUtcOffsetMinutes] = useState(480);
  const [dayBoundary, setDayBoundary] = useState<"midnight" | "late-zi">("midnight");
  const [luckGender, setLuckGender] = useState<LuckGender | null>(null);
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(false);
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [coordinateStatus, setCoordinateStatus] = useState("");
  const [saved, setSaved] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bazi, setBazi] = useState<BaziResult | null>(null);
  const [astrology, setAstrology] = useState<AstrologyResult | null>(null);
  const [savedProfile, setSavedProfile] = useState<ReturnType<typeof getSavedBirthProfile>>(null);
  const [savedMirror, setSavedMirror] = useState<SavedNatalMirror | null>(null);
  const maxDay = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const validDay = Math.min(day, maxDay);

  useEffect(() => {
    const profile = getSavedBirthProfile();
    if (!profile) return;
    setYear(profile.year);
    setMonth(profile.month);
    setDay(profile.day);
    setHour(profile.hour);
    setMinute(profile.minute);
    setUnknownTime(profile.unknownTime);
    setPlace(profile.place);
    setUtcOffsetMinutes(profile.utcOffsetMinutes);
    setLongitude(profile.longitude);
    setLatitude(profile.latitude);
    setDayBoundary(profile.dayBoundary);
    setLuckGender(profile.luckGender);
    setUseTrueSolarTime(profile.useTrueSolarTime);
    setCoordinateStatus(`已从你的出生资料载入：${formatSavedBirthProfile(profile)}`);
    setProfileLoaded(true);
    setSavedProfile(profile);
    const prior = tradition === "east" ? getSavedNatalMirror<BaziResult>("bazi", profile) : getSavedNatalMirror<AstrologyResult>("astrology", profile);
    if (prior) {
      setSavedMirror(prior);
      if (tradition === "east") setBazi(prior.result as BaziResult);
      else setAstrology(prior.result as AstrologyResult);
    }
  }, []);

  useEffect(() => {
    if (!bazi && !astrology) return;
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }, [bazi, astrology]);

  function applyPlace(value: string) {
    setPlace(value);
    const city = resolveCityCoordinate(value);
    if (city) {
      const nextLongitude = formatCoordinate(city.longitude);
      const nextLatitude = formatCoordinate(city.latitude);
      setLongitude(nextLongitude);
      setLatitude(nextLatitude);
      setCoordinateStatus(`已匹配 ${city.name}：${nextLatitude}, ${nextLongitude}`);
    } else if (value.trim()) {
      setCoordinateStatus("请选择候选城市、中国省市区县，或手动填写坐标");
    }
  }

  function applyChinaRegion(selection: ChinaLocation, name: string) {
    setPlace(name);
    const nextLongitude = formatCoordinate(selection.longitude);
    const nextLatitude = formatCoordinate(selection.latitude);
    setLongitude(nextLongitude);
    setLatitude(nextLatitude);
    setUtcOffsetMinutes(480);
    const precision = selection.level === "district" ? "区县中心" : selection.level === "city" ? "城市中心" : "省级中心";
    setCoordinateStatus(`已匹配${precision}：${nextLatitude}, ${nextLongitude}。如出生地靠近时辰边界，可手动微调。`);
  }

  function toggleSolar(checked: boolean) {
    setUseTrueSolarTime(checked);
    if (checked) applyPlace(place);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      let nextResult: BaziResult | AstrologyResult | null = null;
      if (profileOnly) {
        // The profile editor owns one canonical birth record. Calculations happen only inside a mirror tool.
      } else if (tradition === "west") {
        nextResult = calculateAstrology({ year, month, day: validDay, hour: unknownTime ? null : hour, minute: unknownTime ? 0 : minute, utcOffsetMinutes, latitude: Number(formatCoordinate(Number(latitude))), longitude: Number(formatCoordinate(Number(longitude))) });
        setAstrology(nextResult);
      } else {
        nextResult = calculateBazi({ year, month, day: validDay, hour: unknownTime ? null : hour, minute: unknownTime ? 0 : minute, utcOffsetMinutes, dayBoundary, useTrueSolarTime, longitude: useTrueSolarTime ? Number(formatCoordinate(Number(longitude))) : null, luckGender });
        setBazi(nextResult);
      }
      const profile = saveBirthProfile({ year, month, day: validDay, hour, minute, unknownTime, place: place.trim(), utcOffsetMinutes, longitude, latitude, dayBoundary, luckGender, useTrueSolarTime });
      setSavedProfile(profile);
      if (nextResult) saveNatalMirror(tradition === "east" ? "bazi" : "astrology", profile, nextResult);
      setSavedMirror(null);
      setProfileLoaded(true);
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `${tradition === "west" ? "星盘" : "命盘"}计算失败，请检查日期、时区与坐标`);
    } finally {
      setLoading(false);
    }
  }

  return <>
    <form className={`${styles.form} ${styles[tradition]}`} onSubmit={submit}>
      <div className={`${styles.notice} ${profileLoaded ? styles.profileLoaded : ""}`}><CalendarBlank /><p><b>{profileLoaded ? "已载入你的出生资料" : "先建立出生资料"}</b><span>{profileOnly ? "这是命盘与占星共用的唯一资料；保存后两个玩法都会自动载入。" : profileLoaded ? "命盘和占星会共用这份资料；修改并重新生成后会自动更新。" : "填写一次后会保存在你的设备；登录后可跨设备同步，并自动用于命盘与占星。"}</span></p>{profileLoaded && <Check weight="bold" />}</div>
      <fieldset><legend>出生日期 <em>必填</em></legend><div className={styles.dateGrid}>
        <label><span>年</span><input list="birth-years" inputMode="numeric" value={year} min={1900} max={currentYear} onChange={(event) => setYear(Number(event.target.value))} aria-label="出生年份" /><datalist id="birth-years">{years.map((value) => <option value={value} key={value} />)}</datalist></label>
        <label><span>月</span><select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option value={value} key={value}>{value} 月</option>)}</select></label>
        <label><span>日</span><select value={validDay} onChange={(event) => setDay(Number(event.target.value))}>{Array.from({ length: maxDay }, (_, index) => index + 1).map((value) => <option value={value} key={value}>{value} 日</option>)}</select></label>
      </div></fieldset>
      <fieldset><legend>出生时间 <em>建议填写</em></legend><div className={styles.timeRow}><Clock /><select value={hour} disabled={unknownTime} onChange={(event) => setHour(Number(event.target.value))}>{Array.from({ length: 24 }, (_, index) => <option value={index} key={index}>{String(index).padStart(2, "0")} 时</option>)}</select><select value={minute} disabled={unknownTime} onChange={(event) => setMinute(Number(event.target.value))}>{[0, 15, 30, 45].map((value) => <option value={value} key={value}>{String(value).padStart(2, "0")} 分</option>)}</select><label className={styles.unknown}><input type="checkbox" checked={unknownTime} onChange={(event) => setUnknownTime(event.target.checked)} />不知道具体时间</label></div><small>{tradition === "east" ? "时辰影响时柱与起运时间；未知时只生成三柱，不伪造大运起点。" : "出生时间影响上升点与宫位；未知时将不展示宫位结论。"}</small></fieldset>
      <fieldset><legend>出生地点与时区 <em>必填</em></legend>
        <LocationPicker onSelect={applyChinaRegion} />
        <div className={styles.locationDivider}><span>或输入海外 / 常用城市</span></div>
        <label className={styles.place}><MapPin /><input list="birth-cities" value={place} onChange={(event) => applyPlace(event.target.value)} placeholder="输入并选择城市，例如：杭州 / New York" /><datalist id="birth-cities">{CITY_COORDINATES.map((city) => <option value={city.name} key={city.name} />)}</datalist><span>中国地区请选择上方省市区县；其他地点可手动输入经纬度。</span></label>
        {(tradition === "west" || useTrueSolarTime) && <div className={styles.fullLabel}><div className={styles.ruleGrid}><label><span>纬度（北纬为正）</span><input required type="number" step="0.0001" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} onBlur={() => latitude && setLatitude(formatCoordinate(Number(latitude)))} /></label><label><span>经度（东经为正）</span><input required type="number" step="0.0001" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} onBlur={() => longitude && setLongitude(formatCoordinate(Number(longitude)))} /></label></div><small>{coordinateStatus || "选择地区后自动填写坐标，也可以手动修正。"}</small></div>}
        <label className={styles.fullLabel}><span>出生地当日时区</span><select value={utcOffsetMinutes} onChange={(event) => setUtcOffsetMinutes(Number(event.target.value))}>{offsets.map((value) => <option value={value} key={value}>{formatOffset(value)}</option>)}</select><small>中国大陆通常选择 UTC+08:00；若出生地当年实行夏令时，请按当年的当地时间选择。</small></label>
      </fieldset>
      {!profileOnly && tradition === "east" && <fieldset><legend>排盘口径 <em>可展开复核</em></legend><div className={styles.ruleGrid}><label><span>换日规则</span><select value={dayBoundary} onChange={(event) => setDayBoundary(event.target.value as "midnight" | "late-zi")}><option value="midnight">午夜 00:00 换日</option><option value="late-zi">子初 23:00 换日</option></select></label><label><span>传统排运参数</span><select value={luckGender ?? ""} onChange={(event) => setLuckGender((event.target.value || null) as LuckGender | null)}><option value="">暂不计算大运</option><option value="male">男命排运</option><option value="female">女命排运</option></select></label><label className={styles.toggle}><input type="checkbox" checked={useTrueSolarTime} onChange={(event) => toggleSolar(event.target.checked)} /><Compass />启用真太阳时校正</label></div><small>排运性别仅作为传统顺逆算法参数，不用于身份判断。用神、格局和具体断语仍需流派与专家复核。</small></fieldset>}
      {!profileOnly && <label className={styles.consent}><input required type="checkbox" />我理解这是一种象征性自我探索工具，不替代医疗、法律或财务建议。</label>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.submit} disabled={!place.trim() || loading || ((tradition === "west" || useTrueSolarTime) && (!longitude || !latitude))}>{loading ? <><SpinnerGap className={styles.spin} />正在保存…</> : profileOnly ? saved ? <><Check />出生资料已保存</> : "保存出生资料" : (saved || savedMirror) ? <><Check />重新测算{tradition === "west" ? "星盘" : "命盘"}</> : tradition === "east" ? "生成完整基础命盘" : "生成本命星盘"}</button>
    </form>
    {!profileOnly && savedMirror && <p className={styles.resultNotice}>已展示上次测算结果。若出生资料或排盘口径有变化，再选择“重新测算”即可。</p>}
    {!profileOnly && tradition === "east" && bazi && <BaziChart result={bazi} savedReflection={savedMirror?.reflection} historical={Boolean(savedMirror)} onReflection={(reflection) => savedProfile && saveNatalMirrorReflection("bazi", savedProfile, reflection)} />}
    {!profileOnly && tradition === "west" && astrology && <AstrologyChart result={astrology} savedReflection={savedMirror?.reflection} historical={Boolean(savedMirror)} onReflection={(reflection) => savedProfile && saveNatalMirrorReflection("astrology", savedProfile, reflection)} />}
  </>;
}

function BaziChart({ result, savedReflection, historical, onReflection }: { result: BaziResult; savedReflection?: MirrorResult; historical: boolean; onReflection: (reflection: MirrorResult) => void }) {
  const known = result.pillars.filter(Boolean).map((item) => item!.ganZhi).join(" · ");
  const profile = result.fiveElementProfile;
  const currentAnnual = result.luck?.annual.find((item) => item.year === currentYear);
  const chatContext = `本次四柱为${known}。日主${profile.dayMaster}${profile.dayMasterElement}，基础旺衰区间为${profile.strengthBand}；五行占比为${Object.entries(profile.scores).map(([key, value]) => `${key}${value}%`).join("、")}。${result.interactions.length ? `地支结构包含${result.interactions.map((item) => `${item.members}${item.kind}`).join("、")}。` : "未识别到基础六合、六冲、刑害结构。"}${currentAnnual ? `当前流年${currentAnnual.year}年${currentAnnual.ganZhi}，相对日主十神为${currentAnnual.tenGod}。` : "未生成当前流年。"}请区分确定性盘面、传统解释与现实证据。`;
  const fallback: MirrorResult = {
    headline: `${profile.dayMaster}${profile.dayMasterElement}日主，${profile.strengthBand}是一种结构线索，不是命运结论。`,
    interpretation: `五行结构显示生扶占比为 ${profile.supportiveShare}%。它更适合用来观察你如何调配资源与节奏，再用长期经历验证，而不是给自己贴固定标签。`,
    action: "回看最近一件消耗明显的事，分清它需要补充资源，还是需要减少无效用力。",
    reflectionQuestion: "过去半年里，什么情境最容易让你感到资源充足，什么情境最容易耗尽？",
    shareCards: {
      warm: "这张盘说的是我习惯怎么用力，不是我只能成为什么人。",
      roast: "我们节奏不同没关系，别再把沉默误会成不在乎。",
      witty: "也排一次你的盘，看看我们到底是互补还是互相为难。",
    },
  };
  return <section className={styles.chart} aria-live="polite">
    <header><div><small>FOUR PILLARS MIRROR</small><h2>拾光先说你的命盘</h2></div></header>
    <UnifiedMirrorResult kind="bazi" theme="east" question="我的出生命盘呈现了怎样的资源、张力与节奏？" facts={chatContext} fallback={fallback} title="我的命盘镜像" meta={known} image="/characters/shiguang/shiguang-east-chibi-v2.png" initialResult={savedReflection} historical={historical} onResolved={onReflection} />
    <BaziLifeDomainsReading result={result} />
    <details className={styles.professionalDetails}><summary>查看命盘依据</summary><p className={styles.detailsIntro}>这里保留四柱、五行与大运流年，方便你回看拾光的解读从哪里来。</p>
    <div className={styles.pillars}>{result.pillars.map((pillar, index) => pillar ? <article key={pillar.key}><small>{pillar.label}</small><strong><i>{pillar.stem}</i><i>{pillar.branch}</i></strong><dl><div><dt>十神</dt><dd>{pillar.stemTenGod}</dd></div><div><dt>藏干</dt><dd>{pillar.hiddenStems.join(" · ")}</dd></div><div><dt>藏干十神</dt><dd>{pillar.branchTenGods.join(" · ")}</dd></div><div><dt>五行</dt><dd>{pillar.fiveElements}</dd></div><div><dt>纳音</dt><dd>{pillar.naYin}</dd></div></dl></article> : <article className={styles.emptyPillar} key={index}><small>时柱</small><strong>未知</strong><p>未使用推测时间</p></article>)}</div>
    <section className={styles.analysisSection}><div className={styles.sectionHeading}><div><small>FIVE ELEMENTS · 五行结构</small><h3>{profile.dayMaster}日主 · {profile.dayMasterElement} · 初步{profile.strengthBand}</h3></div><span>生扶占比 {profile.supportiveShare}%</span></div><div className={styles.elementBars}>{Object.entries(profile.scores).map(([element, score]) => <div key={element}><b>{element}</b><i><span style={{ width: `${score}%` }} /></i><em>{score}%</em></div>)}</div><p className={styles.methodNote}>{profile.method}</p></section>
    <section className={styles.analysisSection}><div className={styles.sectionHeading}><div><small>RELATIONS · 刑冲合害</small><h3>地支关系结构</h3></div></div>{result.interactions.length ? <div className={styles.interactions}>{result.interactions.map((item, index) => <article key={`${item.kind}-${item.members}-${index}`}><b>{item.members} · {item.kind}</b><p>{item.note}</p></article>)}</div> : <p className={styles.emptyAnalysis}>当前四柱未识别到基础六合、六冲、刑害；这不代表命盘“没有关系”，三合、天干合化与流派条件仍需进一步复核。</p>}</section>
    <section className={styles.analysisSection}><div className={styles.sectionHeading}><div><small>LUCK CYCLES · 大运流年</small><h3>{result.luck ? `${result.luck.direction} · 起运约 ${result.luck.startsAfter}` : "尚未生成排运序列"}</h3></div></div>{result.luck ? <><div className={styles.luckCycles}>{result.luck.cycles.map((cycle) => <article key={`${cycle.ganZhi}-${cycle.startYear}`}><strong>{cycle.ganZhi}</strong><span>{cycle.startYear}–{cycle.endYear}</span><small>{cycle.startAge}–{cycle.endAge} 岁</small></article>)}</div><div className={styles.annuals}>{result.luck.annual.map((item) => <article className={item.year === currentYear ? styles.currentAnnual : ""} key={item.year}><b>{item.year}</b><strong>{item.ganZhi}</strong><span>{item.tenGod} · {item.age} 岁</span></article>)}</div><p className={styles.methodNote}>{result.luck.method} 流年只展示干支与十神关系，不直接生成吉凶结论。</p></> : <p className={styles.emptyAnalysis}>请选择传统排运参数并提供准确出生时间，系统才会计算起运、大运与流年；缺少条件时不会猜测。</p>}</section>
    <div className={styles.evidence}><article><h3>计算时间</h3><p>{result.effectiveLocalTime}{result.trueSolarAdjustmentMinutes !== null && `（真太阳时修正 ${result.trueSolarAdjustmentMinutes >= 0 ? "+" : ""}${result.trueSolarAdjustmentMinutes} 分钟）`}</p><p>引擎 {result.engine.version} · 支持历法范围：{result.engine.calendarRange}</p></article><article><h3>相邻节气</h3><p>{result.solarTerms.previous} · {result.solarTerms.previousAt}</p><p>{result.solarTerms.next} · {result.solarTerms.nextAt}</p></article></div><ul>{result.rules.map((item) => <li key={item}>{item}</li>)}</ul><ul className={styles.warnings}>{result.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
    </details>
    <ShiguangChat theme="east" context={chatContext} opening={`盘面已经展开。你的日主是${profile.dayMaster}${profile.dayMasterElement}，基础五行结构与${result.interactions.length ? "刑冲合害" : "地支关系"}${result.luck ? "、大运流年" : ""}都列在上面。你可以追问某一层，我会先引用盘面，再说明解释边界。`} />
  </section>;
}

function BaziLifeDomainsReading({ result }: { result: BaziResult }) {
  const domains = buildBaziLifeDomainInsights(result);
  return <section className={styles.lifeDomains} aria-labelledby="bazi-life-domains-title">
    <header><small>YOUR FOUR PILLARS MIRROR</small><h3 id="bazi-life-domains-title">从六个领域，读这张属于你的命盘</h3><p>不是把十神和五行定义念一遍。每一条都由你的日主、月令、五行、十神、地支关系与时间条件组合而来；先看它和你有什么关系，再按需要展开依据。</p></header>
    <div className={styles.domainGrid}>{domains.map((domain, index) => <article key={domain.key}>
      <span>0{index + 1}</span><div><small>{domain.question}</small><h4>{domain.title}</h4><p>{domain.reading}</p><details><summary>为什么这样说</summary><ul>{domain.evidence.map((fact) => <li key={fact}>{fact}</li>)}</ul></details><em>{domain.reflection}</em></div>
    </article>)}</div>
    <p className={styles.lifeBoundary}>这些是传统命理提供的象征性自我观察线索，不是对性格、收入、职业或关系结果的承诺。最有价值的用法，是拿它们与你的真实经历逐条核对。</p>
  </section>;
}
