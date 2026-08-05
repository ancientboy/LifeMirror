"use client";

import type { AstrologyResult } from "../../server/tools/astrology/types";
import { ShareQuoteCard } from "./ShareQuoteCard";
import { ShiguangChat } from "./ShiguangChat";
import { MirrorSaveButton } from "./MirrorSaveButton";
import styles from "./AstrologyChart.module.css";

const point = (longitude: number, radius: number) => {
  const angle = (longitude - 90) * Math.PI / 180;
  return { x: 180 + Math.cos(angle) * radius, y: 180 + Math.sin(angle) * radius };
};

function formatDegree(value: number) {
  const degree = Math.floor(value);
  const minute = Math.round((value - degree) * 60);
  return `${degree}°${String(minute === 60 ? 0 : minute).padStart(2, "0")}′`;
}

function NatalWheel({ result }: { result: AstrologyResult }) {
  const aspectPlanets = new Map(result.planets.map((planet) => [planet.name, planet]));
  const zodiacGlyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  return <div className={styles.wheelWrap}>
    <svg className={styles.wheel} viewBox="0 0 360 360" role="img" aria-labelledby="natal-wheel-title natal-wheel-desc">
      <title id="natal-wheel-title">本命星盘轮盘</title>
      <desc id="natal-wheel-desc">十二星座、十颗行星、主要相位与出生时间确定时的上升点和天顶。完整数值同时列在轮盘后的表格中。</desc>
      <circle cx="180" cy="180" r="164" className={styles.outerCircle} />
      <circle cx="180" cy="180" r="112" className={styles.innerCircle} />
      {Array.from({ length: 12 }, (_, index) => {
        const edge = point(index * 30, 164), label = point(index * 30 + 15, 143);
        return <g key={index}><line x1="180" y1="180" x2={edge.x} y2={edge.y} className={styles.zodiacLine} /><text x={label.x} y={label.y} className={styles.zodiacGlyph}>{zodiacGlyphs[index]}</text></g>;
      })}
      {result.aspects.slice(0, 16).map((aspect) => {
        const first = aspectPlanets.get(aspect.first), second = aspectPlanets.get(aspect.second);
        if (!first || !second) return null;
        const a = point(first.longitude, 98), b = point(second.longitude, 98);
        return <line key={aspect.key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={aspect.angle === 60 || aspect.angle === 120 ? styles.softAspect : styles.hardAspect} />;
      })}
      {result.planets.map((planet, index) => {
        const location = point(planet.longitude, 118 - (index % 2) * 14);
        return <g key={planet.key}><circle cx={location.x} cy={location.y} r="11" className={styles.planetDot} /><text x={location.x} y={location.y} className={styles.planetGlyph}>{planet.glyph}</text></g>;
      })}
      {result.angles.map((angle) => {
        const edge = point(angle.longitude, 164), inside = point(angle.longitude, 78), label = point(angle.longitude, 176);
        return <g key={angle.key}><line x1={inside.x} y1={inside.y} x2={edge.x} y2={edge.y} className={styles.axisLine} /><text x={label.x} y={label.y} className={styles.axisLabel}>{angle.glyph}</text></g>;
      })}
      <circle cx="180" cy="180" r="48" className={styles.coreCircle} />
      <text x="180" y="176" className={styles.coreTitle}>LIFE</text><text x="180" y="193" className={styles.coreTitle}>MIRROR</text>
    </svg>
    <p>{result.engine.zodiac} · {result.engine.houseSystem}</p>
  </div>;
}

export function AstrologyChart({ result }: { result: AstrologyResult }) {
  const sun = result.planets[0], moon = result.planets[1], asc = result.angles[0];
  const meta = `太阳 ${sun.sign.name} · 月亮 ${moon.sign.name}${asc ? ` · 上升 ${asc.sign.name}` : " · 上升未知"}`;
  return <section className={styles.chart} aria-live="polite">
    <header className={styles.header}><div><small>NATAL MIRROR · 可复算本命盘</small><h2>你的本命星盘</h2><p>{result.utcTime.replace("T", " ").replace(".000Z", " UTC")}</p></div><span>{result.engine.version}</span></header>
    <div className={styles.overview}><NatalWheel result={result} /><div className={styles.bigThree}>
      <small>核心三要素</small>
      {[sun, moon].map((planet) => <article key={planet.key}><b>{planet.glyph}</b><div><span>{planet.name}</span><strong>{planet.sign.name}</strong><em>{formatDegree(planet.degreeInSign)}{planet.house ? ` · 第 ${planet.house} 宫` : ""}</em></div></article>)}
      {asc ? <article><b>{asc.glyph}</b><div><span>{asc.name}</span><strong>{asc.sign.name}</strong><em>{formatDegree(asc.degreeInSign)}</em></div></article> : <article className={styles.unknown}><b>?</b><div><span>上升点</span><strong>出生时间未知</strong><em>未进行推测</em></div></article>}
    </div></div>
    <div className={styles.themes}>{result.themes.map((theme, index) => <article key={theme}><span>0{index + 1}</span><p>{theme}</p></article>)}</div>
    <section className={styles.dataSection}><h3>行星落座与宫位</h3><div className={styles.planetGrid}>{result.planets.map((planet) => <article key={planet.key}><b>{planet.glyph}</b><div><strong>{planet.name}</strong><span>{planet.sign.name} {formatDegree(planet.degreeInSign)}</span><em>{planet.house ? `第 ${planet.house} 宫` : "宫位未知"}{planet.retrograde ? " · 逆行" : ""}</em></div></article>)}</div></section>
    <section className={styles.dataSection}><h3>主要相位 <small>按容许度由紧到松</small></h3>{result.aspects.length ? <div className={styles.aspectGrid}>{result.aspects.map((aspect) => <article key={aspect.key}><b>{aspect.glyph}</b><span>{aspect.first} {aspect.name} {aspect.second}</span><em>容许度 {aspect.orb}°</em></article>)}</div> : <p className={styles.empty}>当前设定的容许度内没有主要相位。</p>}</section>
    <details open className={styles.evidence}><summary>计算证据、口径与边界</summary><dl><div><dt>星历模型</dt><dd>{result.engine.model}</dd></div><div><dt>黄道体系</dt><dd>{result.engine.zodiac}</dd></div><div><dt>宫制</dt><dd>{result.engine.houseSystem}</dd></div></dl><ul>{result.rules.map((item) => <li key={item}>{item}</li>)}</ul><ul className={styles.warnings}>{result.warnings.map((item) => <li key={item}>{item}</li>)}</ul></details>
    <ShareQuoteCard theme="west" title="我的星盘镜像" quote={result.headline} meta={meta} image="/characters/shiguang/shiguang-west-chibi-v2.png" />
    <MirrorSaveButton source="astrology" title="占星镜像" question="我的本命星盘" summary={result.headline} meta={meta} payload={result} />
    <ShiguangChat theme="west" context={`这次星盘的可确认事实是：${meta}。最紧密主要相位为${result.aspects[0] ? `${result.aspects[0].first}${result.aspects[0].name}${result.aspects[0].second}，容许度 ${result.aspects[0].orb}°` : "当前容许度内未识别"}。请始终区分盘面事实、象征解释和现实证据。`} opening="星盘已经展开。如果你想追问某颗行星、某个宫位或一组相位，我会先指出盘面证据，再陪你把象征放回真实生活。" />
  </section>;
}
