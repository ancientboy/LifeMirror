"use client";

import { Aperture, ArrowRight, CardsThree, ChartPolar, DotsThree, Hexagon, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import styles from "./TwinRealmHome.module.css";

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export function TwinRealmHome() {
  const [realm, setRealm] = useState<"east" | "west">("east");

  return (
    <main className={`${styles.shell} ${styles[realm]}`}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="LifeMirror 首页">
          <Aperture weight="thin" />
          <span><b>LifeMirror</b><small>拾光 · PERSONAL MIRROR</small></span>
        </Link>
        <nav aria-label="主导航">
          <Link href="/mirror/">我的镜像</Link>
          <Link href="/theory/">镜像志</Link>
          <button aria-label="更多"><DotsThree weight="bold" /></button>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="twin-title">
        <div className={`${styles.realm} ${styles.eastRealm}`} onMouseEnter={() => setRealm("east")}>
          <div className={styles.orbit} aria-hidden="true" />
          <img src={assetPath("/characters/shiguang/shiguang-east.webp")} className={styles.character} alt="东方皮肤的拾光" />
          <div className={styles.realmCopy}>
            <span className={styles.kicker}>EASTERN MIRROR · 观象</span>
            <h2>东方镜域</h2>
            <p>从变化的象里，照见此刻的处境。</p>
            <div className={styles.tools}>
              <Link href="/app/"><Hexagon weight="thin" /><span><b>六爻</b><small>以变化观当下</small></span></Link>
              <span className={styles.coming}><ChartPolar weight="thin" /><span><b>命盘</b><small>即将开放</small></span></span>
            </div>
            <Link className={styles.realmCta} href="/app/">进入东方镜域 <ArrowRight /></Link>
          </div>
        </div>

        <div className={styles.axis}>
          <div className={styles.axisMark}><span>拾<br />光</span></div>
          <p id="twin-title">同一束光<br /><b>两种凝视</b></p>
          <div className={styles.skinSwitch} role="group" aria-label="拾光皮肤预览">
            <button className={realm === "east" ? styles.active : ""} onClick={() => setRealm("east")} aria-label="预览东方拾光">
              <img src={assetPath("/characters/shiguang/shiguang-east-avatar.webp")} alt="" />
            </button>
            <button className={realm === "west" ? styles.active : ""} onClick={() => setRealm("west")} aria-label="预览西方拾光">
              <img src={assetPath("/characters/shiguang/shiguang-west-avatar.webp")} alt="" />
            </button>
          </div>
        </div>

        <div className={`${styles.realm} ${styles.westRealm}`} onMouseEnter={() => setRealm("west")}>
          <div className={styles.orbit} aria-hidden="true" />
          <img src={assetPath("/characters/shiguang/shiguang-west.webp")} className={styles.character} alt="西方皮肤的拾光" />
          <div className={styles.realmCopy}>
            <span className={styles.kicker}>WESTERN MIRROR · 读星</span>
            <h2>西方镜域</h2>
            <p>从象征与星轨里，读出内心的语言。</p>
            <div className={styles.tools}>
              <Link href="/app/tarot/"><CardsThree weight="thin" /><span><b>塔罗</b><small>三张牌镜像</small></span></Link>
              <span className={styles.coming}><Sparkle weight="thin" /><span><b>占星</b><small>即将开放</small></span></span>
            </div>
            <Link className={styles.realmCta} href="/app/tarot/">进入西方镜域 <ArrowRight /></Link>
          </div>
        </div>
      </section>

      <footer className={styles.identity}>
        <span>01 / SHIGUANG</span><p>她不替你预言答案，只陪你把问题看得更清楚。</p><span>YOUR LIGHT, YOUR MIRROR</span>
      </footer>
    </main>
  );
}
