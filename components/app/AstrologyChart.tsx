"use client";

import type { AstrologyResult } from "../../server/tools/astrology/types";
import { useState } from "react";
import { ShiguangChat } from "./ShiguangChat";
import { MirrorSaveButton } from "./MirrorSaveButton";
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

const planetMeaning: Record<string, string> = {
  太阳: "自我认同、意志与想活成什么样的人", 月亮: "情绪安全感、习惯反应与被触发时的需要", 水星: "理解信息、组织语言与做判断的方式",
  金星: "喜欢什么、如何靠近、关系中的价值与交换", 火星: "行动、欲望、边界与面对冲突的方式", 木星: "信念、成长、扩张与容易看见机会的地方",
  土星: "责任、限制、长期练习与需要建立边界的课题", 天王星: "独立、变化、突破旧规则的需要", 海王星: "想象、共情、理想与容易模糊的边界", 冥王星: "深层控制感、失去与重建的转化主题",
};
const signStyle: Record<string, string> = {
  白羊座: "直接启动、先行动再校准", 金牛座: "重视稳定、身体感受与可持续价值", 双子座: "通过比较、交流与信息流动来理解",
  巨蟹座: "先确认情感安全与归属", 狮子座: "需要真诚表达、创造与被看见", 处女座: "通过辨析、修正与具体服务来落实",
  天秤座: "会先衡量关系、平衡与彼此立场", 天蝎座: "倾向深度投入，重视信任与真实", 射手座: "从更大的意义、自由与方向出发",
  摩羯座: "以责任、成果与长期结构来判断", 水瓶座: "强调独立思考、原则与不同可能", 双鱼座: "以感受、想象与共情来感知世界",
};
const houseThemes = ["自我呈现与身体感", "金钱、价值与安全感", "学习、表达与日常沟通", "家庭、根基与私人空间", "创造、恋爱与玩心", "工作、健康习惯与服务", "亲密关系、合作与契约", "共享资源、信任与深层变化", "信念、远方与高等学习", "事业、公众角色与方向", "朋友、社群与未来愿景", "休息、潜意识与退场空间"];
const aspectReading: Record<string, string> = {
  合相: "两种功能紧紧绑定：它既可能成为强项，也会在压力下被一起放大。", 六分相: "这是可被主动练习和调用的协作资源；不使用时不会自动兑现。",
  三分相: "两种功能较容易自然配合；留意舒适感不会替代成长。", 四分相: "这里有持续摩擦，需要在两种需要之间发展新的做法。", 对分相: "这是一条两端都重要的轴线，常在关系或选择中显影，不能只站一边。",
};

function AstrologyProfessionalReading({ result }: { result: AstrologyResult }) {
  const elements = Object.entries(result.elementBalance).sort((a, b) => b[1] - a[1]);
  const modalities = Object.entries(result.modalityBalance).sort((a, b) => b[1] - a[1]);
  return <section className={styles.professionalReading}>
    <header><small>PROFESSIONAL INTERPRETATION</small><h3>完整专业解读</h3><p>先解释每个结构，再说明它们如何共同作用；盘面事实与象征解释分开呈现。</p></header>
    <section className={styles.readingSection}><h4>一、行星落座与宫位</h4><p className={styles.readingIntro}>行星回答“什么心理功能”，星座回答“它以什么风格表达”，宫位回答“它更常在哪个生活领域发生”。</p><div className={styles.interpretationGrid}>{result.planets.map((planet) => <article key={planet.key}><small>盘面事实 · {planet.name} {planet.sign.name} {formatDegree(planet.degreeInSign)}{planet.house ? ` · 第 ${planet.house} 宫` : ""}</small><h5>{planet.name}：{planetMeaning[planet.name]}</h5><p>{signStyle[planet.sign.name]}。{planet.house ? `落在第 ${planet.house} 宫，这使它尤其容易通过「${houseThemes[planet.house - 1]}」被经验到。` : "出生时间未知，因此这里只解释落座，不把它延伸到具体宫位。"}{planet.retrograde ? "逆行提示这项功能更容易先在内在反复推敲，再形成外在表达；它不代表好或坏。" : ""}</p></article>)}</div></section>
    <section className={styles.readingSection}><h4>二、主要相位：哪些心理功能会彼此配合或拉扯</h4>{result.aspects.length ? <div className={styles.interpretationGrid}>{result.aspects.map((aspect) => <article key={aspect.key}><small>盘面事实 · {aspect.first}{aspect.name}{aspect.second} · 容许度 {aspect.orb}°</small><h5>{aspectReading[aspect.name]}</h5><p>{planetMeaning[aspect.first] ?? aspect.first}与{planetMeaning[aspect.second] ?? aspect.second}在同一张盘里相遇。容许度 {aspect.orb}° 表示它与精确相位的距离；数值越小，越值得优先用现实经历核对。</p></article>)}</div> : <p className={styles.readingIntro}>当前容许度内没有识别主要相位。本报告不会因此补造隐藏结论，而会以行星落座与宫位作为主要阅读线索。</p>}</section>
    <section className={styles.readingSection}><h4>三、元素与模式：你的能量从哪里来、怎样推进</h4><div className={styles.interpretationGrid}><article><small>盘面事实 · 元素分布</small><h5>{elements[0][0]}元素相对突出（{elements[0][1]}/10）</h5><p>火偏向行动与热情，土偏向现实与稳定，风偏向思考与沟通，水偏向感受与联结。突出不等于更好；最少的{elements.at(-1)?.[0]}元素也不是缺陷，而是需要有意识补足的观察角度。</p></article><article><small>盘面事实 · 行动模式</small><h5>{modalities[0][0]}型相对突出（{modalities[0][1]}/10）</h5><p>基本型擅长启动，固定型擅长坚持，变动型擅长调整。留意它在压力下是否走向过度推动、过度坚持或反复变动；这是把星盘翻回现实最有用的方式。</p></article></div></section>
    {result.angles.length > 0 && <section className={styles.readingSection}><h4>四、四轴：你如何进入世界、走向公众方向</h4><div className={styles.interpretationGrid}>{result.angles.map((angle) => <article key={angle.key}><small>盘面事实 · {angle.name} {angle.sign.name} {formatDegree(angle.degreeInSign)}</small><h5>{angle.key === "asc" ? "上升点：初见方式与人生起点" : "天顶：公众角色与长期方向"}</h5><p>{signStyle[angle.sign.name]}。{angle.key === "asc" ? "它也是整宫制第一宫的起点，因此会影响所有宫位主题的分配。" : "天顶会补充你希望在外部世界承担或被看见的方向，但不单独替代第十宫的完整判断。"}</p></article>)}</div></section>}
    <p className={styles.readingBoundary}>解读边界：占星是象征性阅读。单一落座、相位或宫位都不是人格诊断；完整判断需要优先看太阳、月亮、上升、紧密相位与重复主题的组合，并由你的实际经验验证。</p>
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
  const [mirrorSummary, setMirrorSummary] = useState(fallback.headline);
  return <section className={styles.chart} aria-live="polite">
    <header className={styles.header}><div><small>NATAL MIRROR</small><h2>拾光先说你的星盘</h2><p>{meta}</p></div></header>
    <UnifiedMirrorResult kind="astrology" theme="west" question="我的本命星盘呈现了怎样的内在动力与现实张力？" facts={facts} fallback={fallback} title="我的星盘镜像" meta={meta} image="/characters/shiguang/shiguang-west-chibi-v2.png" initialResult={savedReflection} historical={historical} onResolved={(reflection) => { setMirrorSummary(reflection.headline); onReflection(reflection); }} />
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
    <div className={styles.evidence}><dl><div><dt>解读体系</dt><dd>现代西方占星</dd></div><div><dt>星盘口径</dt><dd>热带黄道 · 整宫制</dd></div><div><dt>出生时间</dt><dd>{result.timeKnown ? "已用于上升点与宫位" : "未提供，不显示宫位结论"}</dd></div></dl><p className={styles.reliabilityNote}>请确认出生地当日的时区选择无误；它会影响上升点和宫位的位置。</p></div>
    </details>
    <MirrorSaveButton source="astrology" title="占星镜像" question="我的本命星盘" summary={mirrorSummary} meta={meta} payload={result} />
    <ShiguangChat theme="west" context={`这次星盘的可确认事实是：${meta}。最紧密主要相位为${result.aspects[0] ? `${result.aspects[0].first}${result.aspects[0].name}${result.aspects[0].second}，容许度 ${result.aspects[0].orb}°` : "当前容许度内未识别"}。请始终区分盘面事实、象征解释和现实证据。`} opening="星盘已经展开。如果你想追问某颗行星、某个宫位或一组相位，我会先指出盘面证据，再陪你把象征放回真实生活。" />
  </section>;
}
