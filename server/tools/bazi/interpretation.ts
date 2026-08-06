diff --git a/server/tools/bazi/interpretation.ts b/server/tools/bazi/interpretation.ts
new file mode 100644
index 0000000..6ec7f4b
--- /dev/null
+++ b/server/tools/bazi/interpretation.ts
@@ -0,0 +1,99 @@
+import type { BaziResult } from "./types.js";
+
+export type BaziLifeDomainInsight = {
+  key: "self" | "emotions" | "relationships" | "career" | "value" | "belonging";
+  title: string;
+  question: string;
+  reading: string;
+  evidence: string[];
+  reflection: string;
+};
+
+const TEN_GOD_LABEL: Record<string, string> = {
+  比肩: "自主与并行", 劫财: "竞争与分配", 食神: "稳定表达与创造", 伤官: "突破与不愿受限的表达",
+  偏财: "机会与流动资源", 正财: "现实经营与稳定资源", 七杀: "压力、决断与挑战", 正官: "规则、责任与可信任的角色",
+  偏印: "直觉式学习与独处吸收", 正印: "支持、学习与系统资源",
+};
+
+function score(result: BaziResult, gods: string[]) {
+  return gods.reduce((total, god) => total + (result.tenGodProfile.scores[god as keyof typeof result.tenGodProfile.scores] ?? 0), 0);
+}
+
+function strongestGod(result: BaziResult, gods: string[]) {
+  return [...gods].sort((a, b) => (result.tenGodProfile.scores[b as keyof typeof result.tenGodProfile.scores] ?? 0) - (result.tenGodProfile.scores[a as keyof typeof result.tenGodProfile.scores] ?? 0))[0];
+}
+
+function relationEvidence(result: BaziResult) {
+  return result.interactions.length
+    ? `地支出现${result.interactions.map((item) => `${item.members}${item.kind}`).join("、")}：这是需要结合真实关系与处境复核的结构线索。`
+    : "当前未识别到基础六合、六冲、刑害；不以“没有关系结构”延伸为现实结论。";
+}
+
+function currentCycleEvidence(result: BaziResult) {
+  const current = result.luck?.annual.find((item) => item.year === new Date().getFullYear());
+  return current
+    ? `当前流年为${current.year}年${current.ganZhi}，相对日主为${current.tenGod}；它只标记当年被触及的主题，不预设事件结果。`
+    : "未生成大运流年，因此不把时间节奏写成确定结论。";
+}
+
+/**
+ * Product-facing, deterministic Four Pillars synthesis. It converts calculated
+ * day-master, seasonal, ten-god and branch-relationship facts into six readable
+ * life domains. It is intentionally not a pattern/useful-god verdict.
+ */
+export function buildBaziLifeDomainInsights(result: BaziResult): BaziLifeDomainInsight[] {
+  const profile = result.fiveElementProfile;
+  const month = result.pillars[1]!;
+  const day = result.pillars[2]!;
+  const resourceGod = strongestGod(result, ["偏印", "正印"]);
+  const expressionGod = strongestGod(result, ["食神", "伤官"]);
+  const peerGod = strongestGod(result, ["比肩", "劫财"]);
+  const wealthGod = strongestGod(result, ["偏财", "正财"]);
+  const authorityGod = strongestGod(result, ["七杀", "正官"]);
+  const support = score(result, ["偏印", "正印"]);
+  const expression = score(result, ["食神", "伤官"]);
+  const wealth = score(result, ["偏财", "正财"]);
+  const authority = score(result, ["七杀", "正官"]);
+  const peers = score(result, ["比肩", "劫财"]);
+  const timeKnown = Boolean(result.pillars[3]);
+  const seasonal = `${month.branch}月${result.seasonalProfile.monthElement}旺，与日主的基础关系为${result.seasonalProfile.relationToDayMaster}`;
+
+  return [
+    {
+      key: "self", title: "你的底色与用力方式", question: "你通常怎样确认“这才是我自己”？",
+      reading: `这张盘以${day.stem}${profile.dayMasterElement}日主为观察中心，初步呈${profile.strengthBand}。${seasonal}，所以你更适合把“我够不够好”的判断放回自己的节奏、边界和实际投入，而不是只凭外界反馈。${peers >= expression ? `${TEN_GOD_LABEL[peerGod]}的线索相对更显眼，你可能会在自主推进与同伴比较之间反复校准自己的位置。` : `${TEN_GOD_LABEL[expressionGod]}的线索相对更显眼，把感受和想法做成具体表达，往往比闷在心里更能帮你找回方向。`}`,
+      evidence: [`日主：${day.ganZhi}日，日主为${day.stem}${profile.dayMasterElement}。`, `月令：${seasonal}。`, `五行初步生扶占比${profile.supportiveShare}%；此为结构比例，不是人格定论。`],
+      reflection: "当你最近感到别扭时，先分清：是需要更多自主空间，还是需要把一个想法真正说出来？",
+    },
+    {
+      key: "emotions", title: "情绪与安全感", question: "压力来的时候，你最需要被怎样接住？",
+      reading: `${TEN_GOD_LABEL[resourceGod]}在盘内提供了“恢复与吸收”的观察线索。${support >= expression ? "压力累积时，你可能先需要安静、学习、被理解或重新获得支持，再决定下一步。" : "你可能更习惯先做点什么、说点什么来疏通压力；但也值得留一段不必立刻产出的恢复时间。"} ${profile.weakest.length ? `原局中${profile.weakest.join("、")}相对较少，不等于你缺少它，而是提醒你把这类能量放进日常补给，而非等到耗尽才处理。` : "五行分布需要和真实作息、关系及身体感受一起核对。"}`,
+      evidence: [`十神结构：${resourceGod}（${TEN_GOD_LABEL[resourceGod]}）基础权重${result.tenGodProfile.scores[resourceGod as keyof typeof result.tenGodProfile.scores]}%。`, `五行相对较少：${profile.weakest.join("、")}。`, `时柱${timeKnown ? "已按出生时间生成，可作为后期节奏的辅助参考" : "未提供，因此不补造后期或隐私性结论"}。`],
+      reflection: "下一次累的时候，试着先命名你要的是空间、回应、秩序还是休息，而不是马上要求自己振作。",
+    },
+    {
+      key: "relationships", title: "关系与边界", question: "你怎样靠近别人，又怎样保留自己？",
+      reading: `命理里，关系不是只由一个“配偶星”决定；更适合从比劫、财、官杀与日支的互动一起观察。你的盘中${TEN_GOD_LABEL[peerGod]}、${TEN_GOD_LABEL[wealthGod]}与${TEN_GOD_LABEL[authorityGod]}构成了关于相处、交换和规则感的三条线。${peers >= authority ? "在关系里，你可能更在意是否平等、是否能保有自己的决定权；清楚说出需求会比靠对方猜更有效。" : "在关系里，你可能会很认真对待承诺、标准与可依靠性；也要留意别把所有安全感都交给“关系是否够稳定”。"} ${result.interactions.length ? "盘内的地支互动提示，关系中的拉近、摩擦或误会值得放回具体事件里慢慢辨认。" : "当前没有基础刑冲合害标记，仍需用真实互动而非单一标签理解关系。"}`,
+      evidence: [`日支：${day.branch}，日柱为${day.ganZhi}；日支是亲密关系阅读的一项传统观察点，不单独断事。`, `比劫${peers}%、财星${wealth}%、官杀${authority}%：为相对结构分布。`, relationEvidence(result)],
+      reflection: "最近一段重要关系里，你有没有把“希望被理解”换成一句更清楚、可回应的请求？",
+    },
+    {
+      key: "career", title: "事业与可用天赋", question: "什么样的投入会让你越做越稳？",
+      reading: `事业不是靠命盘指定一种职业，而是看你更容易在哪类工作方式里积累能力。月柱${month.ganZhi}提供了成长环境与社会角色的背景；${TEN_GOD_LABEL[expressionGod]}和${TEN_GOD_LABEL[authorityGod]}分别提示你如何输出、又如何面对标准与责任。${expression >= authority ? "你更值得把表达、方法、创意或解决问题的能力做成可复用成果，再让成果承担评价。" : "你可能会在责任、规则或需要被信任的位置上成长；关键是把压力转成长期方法，而不是只靠硬扛。"}`,
+      evidence: [`月柱：${month.ganZhi}；月令为${seasonal}。`, `${expressionGod}权重${result.tenGodProfile.scores[expressionGod as keyof typeof result.tenGodProfile.scores]}%，${authorityGod}权重${result.tenGodProfile.scores[authorityGod as keyof typeof result.tenGodProfile.scores]}%。`, currentCycleEvidence(result)],
+      reflection: "有没有一件事，即使没人立刻看见，你仍愿意把它练成一项更稳定、更可交付的能力？",
+    },
+    {
+      key: "value", title: "金钱与价值感", question: "你怎样建立资源感，也怎样不被资源定义？",
+      reading: `财星在传统十神中关乎资源、经营与现实交换，而不等于收入预言。你的${wealthGod}线索提示：${wealth >= support ? "把价值落到具体选择、预算、合作与长期积累，会比单纯追逐外部认可更有安全感。" : "资源议题更适合先建立知识、支持与稳定节奏，再转化为实际的交换和积累。"} 五行分布中${profile.strongest.join("、")}相对突出，说明你可以观察自己是否过度依赖熟悉的用力方式；相对弱的部分未必是短板，也可能是需要有意识配置的资源。`,
+      evidence: [`${wealthGod}：${TEN_GOD_LABEL[wealthGod]}，基础权重${result.tenGodProfile.scores[wealthGod as keyof typeof result.tenGodProfile.scores]}%。`, `五行相对突出：${profile.strongest.join("、")}；相对较少：${profile.weakest.join("、")}。`, "五行与十神只说明结构分布，不用于预测收入、投资结果或财富水平。"],
+      reflection: "下次想用消费、忙碌或比较来证明自己时，先问：我真正想补的是资源、认可，还是安全感？",
+    },
+    {
+      key: "belonging", title: "家庭、成长与时间节奏", question: "你从哪里获得根基，又怎样走向新的阶段？",
+      reading: `年柱${result.pillars[0]!.ganZhi}与月柱${month.ganZhi}是传统上阅读早年环境、成长背景和社会角色的两个入口，不把它们等同于对家庭成员的定论。${timeKnown ? "时柱已生成，因此可以把后期发展、作品或内在愿望作为辅助观察，但仍不替你预设人生走向。" : "出生时间未知，因此这里不延伸到时柱、起运和大运。"} ${result.luck ? `当前已有${result.luck.direction}的大运序列；它更适合帮助你回看阶段主题如何变换，而不是替你宣告哪一年必然发生什么。` : "若你希望查看时间节奏，需在准确出生时间基础上选择传统排运参数；缺少条件时系统不会补造。"}`,
+      evidence: [`年柱：${result.pillars[0]!.ganZhi}；月柱：${month.ganZhi}。`, `时柱：${timeKnown ? result.pillars[3]!.ganZhi : "未知，未生成"}。`, currentCycleEvidence(result)],
+      reflection: "最近的你更需要回到熟悉的支持里，还是需要主动去一个能打开新经验的环境？",
+    },
+  ];
+}
