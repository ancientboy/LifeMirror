"use client";

import {
  ArrowLeft,
  ArrowRight,
  CardsThree,
  MoonStars,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  THREE_CARD_POSITIONS,
  analyzeRelations,
  cardMeaning,
  drawThree,
  type DrawnCard,
} from "../../server/tools/tarot/core";
import styles from "./TarotExperience.module.css";

type Stage = "question" | "shuffle" | "reading";
const prompts = [
  "我此刻真正需要看见什么？",
  "这段关系在提醒我什么？",
  "下一步该把能量放在哪里？",
];
const assetPath = (path: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
const orientationLabel = { upright: "正位", reversed: "逆位" } as const;

function secureDraw() {
  const entropy = new Uint32Array(6);
  globalThis.crypto.getRandomValues(entropy);
  return drawThree([...entropy]);
}

export function TarotExperience() {
  const [stage, setStage] = useState<Stage>("question");
  const [question, setQuestion] = useState("");
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const relations = useMemo(() => analyzeRelations(cards), [cards]);

  function draw() {
    setCards(secureDraw());
    setStage("shuffle");
    window.setTimeout(() => setStage("reading"), 1250);
  }

  function reset() {
    setStage("question");
    setQuestion("");
    setCards([]);
  }

  return (
    <main className={styles.shell}>
      <header>
        <Link href="/">
          <ArrowLeft /> 双镜域
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
          <p>正在从完整牌库中抽取不重复的三张牌……</p>
        </section>
      )}
      {stage === "reading" && (
        <section className={styles.reading}>
          <span className={styles.eyebrow}>
            EVIDENCE-LAYERED READING · 分层解读
          </span>
          <h1>三张牌，不止三段牌义</h1>
          <blockquote>“{question}”</blockquote>
          <div className={styles.cards}>
            {cards.map((card, index) => {
              const position = THREE_CARD_POSITIONS[card.position];
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
          <div className={styles.insight}>
            <img
              src={assetPath("/characters/shiguang/shiguang-west-chibi.png")}
              alt="Q版西方拾光"
            />
            <div>
              <small>拾光反思</small>
              <p>
                把三张牌当作三种假设，而不是结论：哪一张最贴近现实证据？哪一张让你不舒服？今天能做的最小验证行动是什么？
              </p>
            </div>
          </div>
          <div className={styles.actions}>
            <button onClick={reset}>换一个问题</button>
            <Link href="/mirror/">
              保存到我的镜像 <ArrowRight />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
