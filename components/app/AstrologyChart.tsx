"use client";

import type { AstrologyResult } from "../../server/tools/astrology/types";
import { buildAspectInsights, buildLifeDomainInsights, buildPlanetInsights } from "../../server/tools/astrology/interpretation";
import { useState } from "react";
import { ShiguangChat } from "./ShiguangChat";
import { UnifiedMirrorResult, type MirrorResult } from "./UnifiedMirrorResult";
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
    <p>现代西方占星 · 热带黄道 · 整宫制</p>
  </div>;
}

const signStyle: Record<string, string> = {
  白羊座: "直接启动、先行动再校准", 金牛座: "重视稳定、身体感受与可持续价值", 双子座: "通过比较、交流与信息流动来理解",
  巨蟹座: "先确认情感安全与归属", 狮子座: "需要真诚表达、创造与被看见", 处女座: "通过辨析、修正与具体服务来落实",
  天秤座: "会先衡量关系、平衡与彼此立场", 天蝎座: "倾向深度投入，重视信任与真实", 射手座: "从更大的意义、自由与方向出发",
  摩羯座: "以责任、成果与长期结构来判断", 水瓶座: "强调独立思考、原则与不同可能", 双鱼座: "以感受、想象与共情来感知世界",
};
const houseThemes = ["自我呈现与身体感", "金钱、价值与安全感", "学习、表达与日常沟通", "家庭、根基与私人空间", "创造、恋爱与玩心", "工作、健康习惯与服务", "亲密关系、合作与契约", "共享资源、信任与深层变化", "信念、远方与高等学习", "事业、公众角色与方向", "朋友、社群与未来愿景", "休息、潜意识与退场空间"];

function AstrologyProfessionalReading({ result }: { result: AstrologyResult }) {
  const elements = Object.entries(result.elementBalance).sort((a, b) => b[1] - a[1]);
  const modalities = Object.entries(result.modalityBalance).sort((a, b) => b[1] - a[1]);
  // Keep the displayed evidence and its wording on the same planet object.  This
  // deliberately avoids index-based template lookup, which previously allowed a
  // correct heading to be paired with another planet's explanation.
  const planetInsights = buildPlanetInsights(result.planets);
  const aspectInsights = buildAspectInsights(result.aspects);
  return <section className={styles.professionalReading}>
    <header><small>PROFESSIONAL INTERPRETATION</small><h3>完整专业解读</h3><p>先解释每个结构，再说明它们如何共同作用；盘面事实与象征解释分开呈现。</p></header>
    <section className={styles.readingSection}><h4>一、行星落座与宫位</h4><p className={styles.readingIntro}>行星回答“什么心理功能”，星座回答“它以什么风格表达”，宫位回答“它更常在哪个生活领域发生”。以下为固定的占星知识库判读，不由拾光或 LLM 临时生成。</p><div className={styles.interpretationGrid}>{planetInsights.map((insight) => <article key={insight.key}><small>盘面事实 · {insight.evidence}</small><h5>{insight.title}</h5><p><b>本义：</b>{insight.principle}</p><p><b>落座：</b>{insight.signReading}</p><p><b>宫位：</b>{insight.houseReading}</p><p><b>组合判断：</b>{insight.synthesis}</p>{insight.retrogradeNote && <p><b>逆行：</b>{insight.retrogradeNote}</p>}</article>)}</div></section>
    <section className={styles.readingSection}><h4>二、主要相位：哪些心理功能会彼此配合或拉扯</h4>{aspectInsights.length ? <div className={styles.interpretationGrid}>{aspectInsights.map((aspect) => <article key={aspect.key}><small>盘面事实 · {aspect.evidence}</small><h5>{aspect.title}</h5><p>{aspect.interpretation}</p><p><b>阅读重点：</b>{aspect.practice}</p></article>)}</div> : <p className={styles.readingIntro}>当前容许度内没有识别主要相位。本报告不会因此补造隐藏结论，而会以行星落座与宫位作为主要阅读线索。</p>}</section>
    <section className={styles.readingSection}><h4>三、元素与模式：你的能量从哪里来、怎样推进</h4><div className={styles.interpretationGrid}><article><small>盘面事实 · 元素分布</small><h5>{elements[0][0]}元素相对突出（{elements[0][1]}/10）</h5><p>火偏向行动与热情，土偏向现实与稳定，风偏向思考与沟通，水偏向感受与联结。突出不等于更好；最少的{elements.at(-1)?.[0]}元素也不是缺陷，而是需要有意识补足的观察角度。</p></article><article><small>盘面事实 · 行动模式</small><h5>{modalities[0][0]}型相对突出（{modalities[0][1]}/10）</h5><p>基本型擅长启动，固定型擅长坚持，变动型擅长调整。留意它在压力下是否走向过度推动、过度坚持或反复变动；这是把星盘翻回现实最有用的方式。</p></article></div></section>
    {result.angles.length > 0 && <section className={styles.readingSection}><h4>四、四轴：你如何进入世界、走向公众方向</h4><div className={styles.interpretationGrid}>{result.angles.map((angle) => <article key={angle.key}><small>盘面事实 · {angle.name} {angle.sign.name} {formatDegree(angle.degreeInSign)}</small><h5>{angle.key === "asc" ? "上升点：初见方式与人生起点" : "天顶：公众角色与长期方向"}</h5><p>{signStyle[angle.sign.name]}。{angle.key === "asc" ? "它也是整宫制第一宫的起点，因此会影响所有宫位主题的分配。" : "天顶会补充你希望在外部世界承担或被看见的方向，但不单独替代第十宫的完整判断。"}</p></article>)}</div></section>}
    <p className={styles.readingBoundary}>解读边界：占星是象征性阅读。单一落座、相位或宫位都不是人格诊断；完整判断需要优先看太阳、月亮、上升、紧密相位与重复主题的组合，并由你的实际经验验证。</p>
  </section>;
}

function LifeDomainsReading({ result }: { result: AstrologyResult }) {
  const domains = buildLifeDomainInsights(result);
  return <section className={styles.lifeDomains} aria-labelledby="life-domains-title">
    <header><small>YOUR LIFE MIRROR</small><h3 id="life-domains-title">从六个领域，读这张属于你的盘</h3><p>不是把宫位定义念一遍。每一条都由你的行星落座、宫位、四轴与紧密相位组合而来；先看和你有关的结论，再按需要展开专业依据。</p></header>
    <div className={styles.domainGrid}>{domains.map((domain, index) => <article key={domain.key}>
      <span>0{index + 1}</span><div><small>{domain.question}</small><h4>{domain.title}</h4><p>{domain.reading}</p><details><summary>为什么这样说</summary><ul>{domain.evidence.map((fact) => <li key={fact}>{fact}</li>)}</ul></details><em>{domain.reflection}</em></div>
    </article>)}</div>
    <p className={styles.lifeBoundary}>这些是用于理解自己的象征线索，不是收入、职业或关系结果的承诺。最有价值的用法，是拿它们与自己的真实经历逐条核对。</p>
  </section>;
}

export function AstrologyChart({ result, savedReflection, historical, onReflection }: { result: AstrologyResult; savedReflection?: MirrorResult; historical: boolean; onReflection: (reflection: MirrorResult) => void }) {
  const sun = result.planets[0], moon = result.planets[1], asc = result.angles[0];
  const meta = `太阳 ${sun.sign.name} · 月亮 ${moon.sign.name}${asc ? ` · 上升 ${asc.sign.name}` : " · 上升未知"}`;
  const facts = `可确认盘面：${meta}。主题线索：${result.themes.join("；")}。主要相位：${result.aspects.slice(0, 5).map((aspect) => `${aspect.first}${aspect.name}${aspect.second}，容许度${aspect.orb}°`).join("；") || "当前容许度内未识别主要相位"}。${asc ? "出生时间已知，可以使用宫位与上升点。" : "出生时间未知，禁止生成宫位或上升相关结论。"}`;
  const fallback: MirrorResult = {
    headline: result.headline,
    interpretation: `${result.themes[0] ?? "太阳与月亮提供了两种互相补充的观察角度。"} 这是一条等待现实经历核对的象征线索，不是固定人格标签。`,
    action: "选一个最近反复出现的情境，分别记录你外在怎么做、内在真正需要什么。",
    reflectionQuestion: "最近哪一次选择，最明显地让你的外在行动和内在需要发生了拉扯？",
    shareCards: {
      warm: "我看起来在往前走，心里其实还在等一个确定的回应。",
      roast: "我不是要你猜懂我，只想知道你愿不愿意认真回应。",
      witty: "也生成你的星盘镜像，看看我们为何总在不同频道。",
    },
  };
  return <section className={styles.chart} aria-live="polite">
    <header className={styles.header}><div><small>NATAL MIRROR</small><h2>拾光先说你的星盘</h2><p>{meta}</p></div></header>
    <UnifiedMirrorResult kind="astrology" theme="west" question="我的本命星盘呈现了怎样的内在动力与现实张力？" facts={facts} fallback={fallback} title="我的星盘镜像" meta={meta} image="/characters/shiguang/shiguang-west-chibi-v2.png" initialResult={savedReflection} historical={historical} onResolved={onReflection} />
    <LifeDomainsReading result={result} />
    <details className={styles.professionalDetails}><summary>查看星盘依据</summary><p className={styles.detailsIntro}>这里保留盘面位置、宫位与相位，方便你回看拾光的解读从哪里来。</p>
    <AstrologyProfessionalReading result={result} />
    <div className={styles.overview}><NatalWheel result={result} /><div className={styles.bigThree}>
      <small>核心三要素</small>
      {[sun, moon].map((planet) => <article key={planet.key}><b>{planet.glyph}</b><div><span>{planet.name}</span><strong>{planet.sign.name}</strong><em>{formatDegree(planet.degreeInSign)}{planet.house ? ` · 第 ${planet.house} 宫` : ""}</em></div></article>)}
      {asc ? <article><b>{asc.glyph}</b><div><span>{asc.name}</span><strong>{asc.sign.name}</strong><em>{formatDegree(asc.degreeInSign)}</em></div></article> : <article className={styles.unknown}><b>?</b><div><span>上升点</span><strong>出生时间未知</strong><em>未进行推测</em></div></article>}
    </div></div>
    <div className={styles.themes}>{result.themes.map((theme, index) => <article key={theme}><span>0{index + 1}</span><p>{theme}</p></article>)}</div>
    <section className={styles.dataSection}><h3>行星落座与宫位</h3><div className={styles.planetGrid}>{result.planets.map((planet) => <article key={planet.key}><b>{planet.glyph}</b><div><strong>{planet.name}</strong><span>{planet.sign.name} {formatDegree(planet.degreeInSign)}</span><em>{planet.house ? `第 ${planet.house} 宫` : "宫位未知"}{planet.retrograde ? " · 逆行" : ""}</em></div></article>)}</div></section>
    <section className={styles.dataSection}><h3>主要相位</h3>{result.aspects.length ? <div className={styles.aspectGrid}>{result.aspects.map((aspect) => <article key={aspect.key}><b>{aspect.glyph}</b><span>{aspect.first} {aspect.name} {aspect.second}</span></article>)}</div> : <p className={styles.empty}>当前没有识别到主要相位。</p>}</section>
    {result.timing && <section className={styles.dataSection}><h3>{result.timing.calculatedFor} · 行运与次限推运</h3><p className={styles.readingIntro}>以下只描述当期天空与本命、次限盘与本命之间的结构，和本命性格描述分开；它们不是事件预告。</p><div className={styles.aspectGrid}>{result.timing.transits.contacts.slice(0, 4).map((contact) => <article key={`transit-${contact.key}`}><b>行</b><span>{contact.transit}{contact.name}本命{contact.natal} · {contact.window}</span></article>)}{result.timing.progressions.contacts.slice(0, 4).map((contact) => <article key={`progressed-${contact.key}`}><b>次</b><span>次限{contact.transit}{contact.name}本命{contact.natal}</span></article>)}</div><p className={styles.reliabilityNote}>{result.timing.transits.method} {result.timing.progressions.method}</p></section>}
    <div className={styles.evidence}><dl><div><dt>解读体系</dt><dd>现代西方占星</dd></div><div><dt>星盘口径</dt><dd>热带黄道 · 整宫制</dd></div><div><dt>出生时间</dt><dd>{result.timeKnown ? "已用于上升点与宫位" : "未提供，不显示宫位结论"}</dd></div></dl><p className={styles.reliabilityNote}>请确认出生地当日的时区选择无误；它会影响上升点和宫位的位置。</p></div>
    </details>
    <ShiguangChat theme="west" context={`这次星盘的可确认事实是：${meta}。最紧密主要相位为${result.aspects[0] ? `${result.aspects[0].first}${result.aspects[0].name}${result.aspects[0].second}，容许度 ${result.aspects[0].orb}°` : "当前容许度内未识别"}。请始终区分盘面事实、象征解释和现实证据。`} opening="星盘已经展开。如果你想追问某颗行星、某个宫位或一组相位，我会先指出盘面证据，再陪你把象征放回真实生活。" />
  </section>;
}
