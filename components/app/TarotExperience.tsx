"use client";

import {
  ArrowLeft,
  ArrowRight,
  CardsThree,
  CheckCircle,
  ClockCounterClockwise,
  MoonStars,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  TAROT_SPREADS,
  analyzeRelations,
  cardMeaning,
  drawSpread,
  getSpread,
  synthesizeTarotReading,
  type DrawnCard,
  type TarotSpread,
} from "../../server/tools/tarot/core";
import styles from "./TarotExperience.module.css";
import { ShareQuoteCard } from "./ShareQuoteCard";
import { ShiguangChat } from "./ShiguangChat";

type Stage = "question" | "shuffle" | "reading";
const prompts = [
  "我此刻真正需要看见什么？",
  "这段关系在提醒我什么？",
  "下一步该把能量放在哪里？",
];
const assetPath = (path: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
const orientationLabel = { upright: "正位", reversed: "逆位" } as const;

type SavedReading = {
  id: string;
  createdAt: string;
  question: string;
  spreadId: TarotSpread["id"];
  cards: DrawnCard[];
};
const HISTORY_KEY = "lifemirror.tarot.readings.v1";

function secureDraw(spread: TarotSpread) {
  const entropy = new Uint32Array(spread.positions.length * 2);
  globalThis.crypto.getRandomValues(entropy);
  return drawSpread(spread, [...entropy]);
}

export function TarotExperience() {
  const [stage, setStage] = useState<Stage>("question");
  const [question, setQuestion] = useState("");
  const [spreadId, setSpreadId] = useState<TarotSpread["id"]>("timeline");
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [history, setHistory] = useState<SavedReading[]>([]);
  const [saved, setSaved] = useState(false);
  const spread = useMemo(() => getSpread(spreadId), [spreadId]);
  const relations = useMemo(() => analyzeRelations(cards), [cards]);
  const professionalReading = useMemo(() => cards.length === spread.positions.length ? synthesizeTarotReading(question, spread, cards) : null, [cards, question, spread]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
      if (Array.isArray(stored)) setHistory(stored.slice(0, 12));
    } catch {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  function draw() {
    setCards(secureDraw(spread));
    setSaved(false);
    setStage("shuffle");
    window.setTimeout(() => setStage("reading"), 1250);
  }

  function reset() {
    setStage("question");
    setQuestion("");
    setCards([]);
    setSaved(false);
  }

  function saveReading() {
    const reading: SavedReading = {
      id: globalThis.crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      question: question.trim(),
      spreadId,
      cards,
    };
    const next = [reading, ...history].slice(0, 12);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
    setSaved(true);
  }

  return (
    <main className={styles.shell}>
      <header>
        <Link href="/app/home/">
          <ArrowLeft /> 返回拾光
        </Link>
        <span>
          <MoonStars /> WESTERN MIRROR · 拾光
        </span>
        <Link href="/mirror/">我的镜像</Link>
      </header>
      <div className={styles.stars} />
      <img
        className={styles.shiguang}
        src={assetPath("/characters/shiguang/shiguang-west.webp")}
        alt="西方拾光"
      />
      {stage === "question" && (
        <section className={styles.intro}>
          <span className={styles.eyebrow}>
            78-CARD TAROT MIRROR · 完整塔罗镜像
          </span>
          <h1>
            把问题交给牌面，
            <br />
            <em>把选择留给自己。</em>
          </h1>
          <p>
            从完整 78
            张牌中随机抽取三张，并保留正逆位。拾光会区分牌面事实、象征解释与现实反思；塔罗不替你预测确定的未来。
          </p>
          <label>
            <CardsThree />
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="写下一个具体、开放、与你有关的问题……"
              maxLength={120}
            />
            <small>{question.length}/120</small>
          </label>
          <div className={styles.prompts}>
            {prompts.map((prompt) => (
              <button key={prompt} onClick={() => setQuestion(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <div className={styles.spreads} aria-label="选择塔罗牌阵">
            {TAROT_SPREADS.map((item) => (
              <button
                className={spreadId === item.id ? styles.selectedSpread : ""}
                key={item.id}
                onClick={() => setSpreadId(item.id)}
              >
                <b>{item.name}</b>
                <span>{item.positions.length} 张 · {item.description}</span>
              </button>
            ))}
          </div>
          <button
            className={styles.primary}
            disabled={question.trim().length < 5}
            onClick={draw}
          >
            使用安全随机数洗牌 <ArrowRight />
          </button>
          <p className={styles.safety}>
            <WarningCircle />{" "}
            涉及健康、法律、财务或安全的决定，请以专业意见和现实证据为准。
          </p>
        </section>
      )}
      {stage === "shuffle" && (
        <section className={styles.shuffle}>
          <div className={styles.deck}>
            {[0, 1, 2, 3, 4].map((index) => (
              <i key={index} style={{ "--i": index } as React.CSSProperties} />
            ))}
          </div>
          <h1>让问题安静地落进牌里</h1>
          <p>正在从完整牌库中抽取不重复的 {spread.positions.length} 张牌……</p>
        </section>
      )}
      {stage === "reading" && (
        <section className={styles.reading}>
          <span className={styles.eyebrow}>
            EVIDENCE-LAYERED READING · 分层解读
          </span>
          <h1>{spread.name} · 分层解读</h1>
          <blockquote>“{question}”</blockquote>
          <div className={`${styles.cards} ${cards.length === 1 ? styles.singleCard : cards.length > 3 ? styles.wideSpread : ""}`}>
            {cards.map((card, index) => {
              const position = spread.positions.find((item) => item.id === card.position) ?? spread.positions[index];
              return (
                <article
                  key={card.id}
                  style={
                    { "--delay": `${index * 0.16}s` } as React.CSSProperties
                  }
                >
                  <div
                    className={`${styles.cardFace} ${card.orientation === "reversed" ? styles.reversed : ""}`}
                  >
                    <small>{card.roman}</small>
                    <Sparkle />
                    <b>{card.name}</b>
                    <span>{position.label}</span>
                  </div>
                  <div className={styles.tags}>
                    <span>盘面事实</span>
                    <i>
                      {card.arcana === "major"
                        ? "大阿尔卡那"
                        : `${card.element}元素`}
                    </i>
                    <i>{orientationLabel[card.orientation]}</i>
                  </div>
                  <h2>{position.prompt}</h2>
                  <p>{cardMeaning(card)}</p>
                </article>
              );
            })}
          </div>
          <div className={styles.synthesis}>
            <div>
              <small>牌间关系</small>
              <h2>{relations.headline}</h2>
              <p>
                大阿尔卡那 {relations.majorCount} 张 · 逆位{" "}
                {relations.reversedCount} 张
                {relations.repeatedElement
                  ? ` · ${relations.repeatedElement}元素重复`
                  : ""}
              </p>
            </div>
            <div>
              <small>反向信号</small>
              <p>{relations.counterSignal}</p>
            </div>
          </div>
          {professionalReading && <section className={styles.professionalReading}>
            <header><small>PROFESSIONAL READING · 专业解读</small><h2>先读整体，再看每张牌如何共同回答。</h2></header>
            <article><small>整体判断</small><p>{professionalReading.overview}</p></article>
            <div className={styles.readingGrid}>{professionalReading.cardInsights.map((item) => <article key={`${item.position}-${item.title}`}><small>{item.position} · {item.title}</small><b>{item.evidence}</b><p>{item.interpretation}</p></article>)}</div>
            <article><small>牌间关系与反向信号</small><p>{professionalReading.relationship}</p></article>
            <article className={styles.shiguangReading}><small>拾光的专属解释</small><p>{professionalReading.shiguang}</p></article>
            <div className={styles.nextStep}><article><small>可验证的下一步</small><p>{professionalReading.action}</p></article><article><small>留给你的问题</small><p>{professionalReading.reflectionQuestion}</p></article></div>
          </section>}
          <div className={styles.insight}>
            <img
              src={assetPath("/characters/shiguang/shiguang-west-chibi.png")}
              alt="Q版西方拾光"
            />
            <div>
              <small>拾光反思</small>
              <p>
                把这些牌当作不同的观察假设，而不是结论：哪一张最贴近现实证据？哪一张让你不舒服？今天能做的最小验证行动是什么？
              </p>
            </div>
          </div>
          <ShareQuoteCard
            theme="west"
            title="我的塔罗镜像"
            quote={relations.reversedCount > cards.length / 2 ? "答案不是急着向外推进，而是先看见内在尚未松开的结。" : "牌面没有替我决定未来，它只是照亮此刻最值得验证的一步。"}
            meta={`${spread.name} · ${cards.map((card) => `${card.name}${orientationLabel[card.orientation]}`).join(" · ")}`}
            image={assetPath("/characters/shiguang/shiguang-west-chibi.png")}
          />
          <ShiguangChat theme="west" context={`用户的问题是“${question}”。这次使用${spread.name}，牌面为${cards.map((card, index) => `${spread.positions[index].label}:${card.name}${orientationLabel[card.orientation]}`).join("；")}。牌间关系：${professionalReading?.relationship ?? relations.headline}。拾光初步解释：${professionalReading?.shiguang ?? "暂无"}`} opening="牌已经摊开了。你可以直接问我：为什么这样解、哪张牌最关键、这和你的现实处境怎么对应，或者下一步怎么验证。" />
          <div className={styles.actions}>
            <button onClick={reset}>换一个问题</button>
            <button onClick={saveReading} disabled={saved}>
              {saved ? <CheckCircle /> : <ClockCounterClockwise />}
              {saved ? "已保存到此设备" : "保存本次抽牌"}
            </button>
            <Link href="/mirror/">查看我的镜像 <ArrowRight /></Link>
          </div>
          {history.length > 0 && (
            <aside className={styles.history}>
              <small>本机抽牌记录 · 最近 {history.length} 条</small>
              <div>
                {history.slice(0, 4).map((item) => (
                  <article key={item.id}>
                    <time>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</time>
                    <b>{getSpread(item.spreadId).name}</b>
                    <p>{item.question}</p>
                  </article>
                ))}
              </div>
              <p>记录仅保存在当前设备，可随时通过浏览器数据清除；不会自动上传。</p>
            </aside>
          )}
        </section>
      )}
    </main>
  );
}
