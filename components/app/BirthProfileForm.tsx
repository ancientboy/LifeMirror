diff --git a/components/app/BirthProfileForm.tsx b/components/app/BirthProfileForm.tsx
index a88dd14..ea0c643 100644
--- a/components/app/BirthProfileForm.tsx
+++ b/components/app/BirthProfileForm.tsx
@@ -5,6 +5,7 @@ import { useEffect, useMemo, useState } from "react";
 import { CITY_COORDINATES, resolveCityCoordinate } from "../../lib/city-coordinates";
 import type { ChinaLocation } from "../../lib/china-locations";
 import { calculateBazi } from "../../server/tools/bazi/engine";
+import { buildBaziLifeDomainInsights } from "../../server/tools/bazi/interpretation";
 import { BAZI_REFERENCE, ELEMENT_MEANING, PILLAR_SCOPE, TEN_GOD_MEANING } from "../../server/tools/bazi/knowledge";
 import type { BaziResult, LuckGender } from "../../server/tools/bazi/types";
 import { calculateAstrology } from "../../server/tools/astrology/core";
@@ -205,6 +206,7 @@ function BaziChart({ result, savedReflection, historical, onReflection }: { resu
   return <section className={styles.chart} aria-live="polite">
     <header><div><small>FOUR PILLARS MIRROR</small><h2>拾光先说你的命盘</h2></div></header>
     <UnifiedMirrorResult kind="bazi" theme="east" question="我的出生命盘呈现了怎样的资源、张力与节奏？" facts={chatContext} fallback={fallback} title="我的命盘镜像" meta={known} image="/characters/shiguang/shiguang-east-chibi-v2.png" initialResult={savedReflection} historical={historical} onResolved={(reflection) => { setMirrorSummary(reflection.headline); onReflection(reflection); }} />
+    <BaziLifeDomainsReading result={result} />
     <details className={styles.professionalDetails}><summary>查看命盘依据</summary><p className={styles.detailsIntro}>这里保留四柱、五行与大运流年，方便你回看拾光的解读从哪里来。</p>
     <BaziProfessionalReading result={result} />
     <div className={styles.pillars}>{result.pillars.map((pillar, index) => pillar ? <article key={pillar.key}><small>{pillar.label}</small><strong><i>{pillar.stem}</i><i>{pillar.branch}</i></strong><dl><div><dt>十神</dt><dd>{pillar.stemTenGod}</dd></div><div><dt>藏干</dt><dd>{pillar.hiddenStems.join(" · ")}</dd></div><div><dt>藏干十神</dt><dd>{pillar.branchTenGods.join(" · ")}</dd></div><div><dt>五行</dt><dd>{pillar.fiveElements}</dd></div><div><dt>纳音</dt><dd>{pillar.naYin}</dd></div></dl></article> : <article className={styles.emptyPillar} key={index}><small>时柱</small><strong>未知</strong><p>未使用推测时间</p></article>)}</div>
@@ -217,3 +219,14 @@ function BaziChart({ result, savedReflection, historical, onReflection }: { resu
     <ShiguangChat theme="east" context={chatContext} opening={`盘面已经展开。你的日主是${profile.dayMaster}${profile.dayMasterElement}，基础五行结构与${result.interactions.length ? "刑冲合害" : "地支关系"}${result.luck ? "、大运流年" : ""}都列在上面。你可以追问某一层，我会先引用盘面，再说明解释边界。`} />
   </section>;
 }
+
+function BaziLifeDomainsReading({ result }: { result: BaziResult }) {
+  const domains = buildBaziLifeDomainInsights(result);
+  return <section className={styles.lifeDomains} aria-labelledby="bazi-life-domains-title">
+    <header><small>YOUR FOUR PILLARS MIRROR</small><h3 id="bazi-life-domains-title">从六个领域，读这张属于你的命盘</h3><p>不是把十神和五行定义念一遍。每一条都由你的日主、月令、五行、十神、地支关系与时间条件组合而来；先看它和你有什么关系，再按需要展开依据。</p></header>
+    <div className={styles.domainGrid}>{domains.map((domain, index) => <article key={domain.key}>
+      <span>0{index + 1}</span><div><small>{domain.question}</small><h4>{domain.title}</h4><p>{domain.reading}</p><details><summary>为什么这样说</summary><ul>{domain.evidence.map((fact) => <li key={fact}>{fact}</li>)}</ul></details><em>{domain.reflection}</em></div>
+    </article>)}</div>
+    <p className={styles.lifeBoundary}>这些是传统命理提供的象征性自我观察线索，不是对性格、收入、职业或关系结果的承诺。最有价值的用法，是拿它们与你的真实经历逐条核对。</p>
+  </section>;
+}
