import assert from "node:assert/strict";
import test from "node:test";
import { calculateLiuyao } from "./engine.js";
import { dayTombFor, transformationDirection } from "./traditional-analysis.js";
import type { CoinToss } from "./types.js";

test("six old-yang lines deterministically change Qian into Kun", () => {
  const toss: CoinToss = [3, 3, 3];
  const result = calculateLiuyao([toss, toss, toss, toss, toss, toss]);

  assert.equal(result.originalHexagram.number, 1);
  assert.equal(result.originalHexagram.name, "乾");
  assert.equal(result.changedHexagram.number, 2);
  assert.equal(result.changedHexagram.name, "坤");
  assert.deepEqual(result.movingLines, [1, 2, 3, 4, 5, 6]);
  assert.equal(result.lines.every((line) => line.value === 9 && line.moving), true);
});

test("line order is bottom-up and maps lower Zhen under upper Kan to Zhun", () => {
  const yang: CoinToss = [3, 2, 2];
  const yin: CoinToss = [2, 3, 3];
  const result = calculateLiuyao([yang, yin, yin, yin, yang, yin]);

  assert.equal(result.originalHexagram.number, 3);
  assert.equal(result.originalHexagram.name, "屯");
  assert.equal(result.originalHexagram.lowerTrigram.name, "震");
  assert.equal(result.originalHexagram.upperTrigram.name, "坎");
  assert.deepEqual(result.movingLines, []);
});

test("calculation rejects anything other than six valid three-coin tosses", () => {
  assert.throws(() => calculateLiuyao([]), /six coin tosses/);
  assert.throws(
    () => calculateLiuyao(Array.from({ length: 6 }, () => [2, 2, 4] as unknown as CoinToss)),
    /three coin values/,
  );
});

test("all 64 yin-yang structures map to 64 unique King Wen hexagrams", () => {
  const identities = new Set<number>();
  for (let mask = 0; mask < 64; mask += 1) {
    const tosses = Array.from({ length: 6 }, (_, position) =>
      ((mask >> position) & 1 ? [3, 2, 2] : [2, 3, 3]) as CoinToss,
    );
    identities.add(calculateLiuyao(tosses).originalHexagram.number);
  }
  assert.equal(identities.size, 64);
});

test("existing tool now deterministically assembles palace, Shi/Ying, Najia, relations, spirits and void", () => {
  const toss: CoinToss = [3, 2, 2];
  const result = calculateLiuyao([toss, toss, toss, toss, toss, toss], {
    topic: "career", monthBranch: "wei", dayStem: "jia", dayBranch: "zi",
  });

  assert.equal(result.structure.palace, "qian");
  assert.equal(result.structure.palaceElement, "metal");
  assert.equal(result.structure.shi, 6);
  assert.equal(result.structure.ying, 3);
  assert.deepEqual(result.structure.sixRelations, ["offspring", "wealth", "parents", "officials", "siblings", "parents"]);
  assert.deepEqual(result.lines.map((line) => line.branch), ["zi", "yin", "chen", "wu", "shen", "xu"]);
  assert.equal(result.lines[0].spirit, "azure_dragon");
  assert.equal(result.lines[5].void, true);
  assert.deepEqual(result.structure.voidBranches, ["xu", "hai"]);
});

test("traditional analysis selects useful god and emits traceable evidence without an LLM", () => {
  const toss: CoinToss = [3, 2, 2];
  const result = calculateLiuyao([toss, toss, toss, toss, toss, toss], {
    topic: "career", monthBranch: "wei", dayStem: "jia", dayBranch: "zi",
  });

  assert.equal(result.analysis.status, "complete");
  assert.deepEqual(result.analysis.usefulGod, { relation: "officials", line: 4, hidden: false, flyingLine: null });
  assert.equal(result.analysis.strength?.level, "resting");
  assert.ok(result.analysis.timing?.candidates.length);
  assert.ok(result.evidence.some((item) => item.rule === "month_strength" && item.line === 4));
});

test("missing calendar/topic context never invites inferred traditional analysis", () => {
  const toss: CoinToss = [3, 2, 2];
  const result = calculateLiuyao([toss, toss, toss, toss, toss, toss]);
  assert.equal(result.analysis.status, "context_required");
  assert.equal(result.analysis.usefulGod, null);
  assert.deepEqual(result.analysis.missingContext, ["topic", "monthBranch", "dayStem", "dayBranch"]);
  assert.equal(result.lines.every((line) => line.spirit === null && line.void === null), true);
});

test("multi-intent judgment separates entertainment from winnings and exposes vivid rule evidence", () => {
  const oldYang: CoinToss = [3, 3, 3];
  const result = calculateLiuyao(Array(6).fill(oldYang), {
    topic: "travel",
    monthBranch: "wei",
    dayStem: "wu",
    dayBranch: "shen",
    tone: "playful",
    intents: [
      { id: "travel-1", label: "邀约与放松", topic: "travel", priority: 1 },
      { id: "wealth-2", label: "收入与得财", topic: "wealth", priority: 2 },
    ],
  });

  assert.deepEqual(result.judgment.verdicts.map((verdict) => verdict.topic), ["travel", "wealth"]);
  assert.equal(result.judgment.tone, "playful");
  assert.ok(result.judgment.keyEvidence.some((item) => item.rule === "return_control"));
  assert.ok(result.judgment.keyEvidence.some((item) => item.rule === "siblings_divide_wealth"));
  assert.ok(result.judgment.keyEvidence.every((item) => item.plainMeaning));
});

test("six-combine and six-clash are exposed as structural tendencies rather than automatic good or bad", () => {
  const oldYin: CoinToss = [2, 3, 3];
  const oldYang: CoinToss = [3, 3, 3];
  const context = { topic: "career" as const, monthBranch: "yin" as const, dayStem: "jia" as const, dayBranch: "xu" as const };
  const kun = calculateLiuyao(Array(6).fill(oldYin), context);
  const fu = calculateLiuyao([oldYang, oldYin, oldYin, oldYin, oldYin, oldYin], context);

  assert.ok(kun.evidence.some((item) => item.rule === "six_clash_structure" && item.effect === "mixed"));
  assert.ok(fu.evidence.some((item) => item.rule === "six_combine_structure" && item.effect === "mixed"));
});

test("day tomb and a moving line bound by day-combination produce qualified evidence and timing triggers", () => {
  const oldYin: CoinToss = [2, 3, 3];
  const oldYang: CoinToss = [3, 3, 3];
  const context = { topic: "career" as const, monthBranch: "yin" as const, dayStem: "jia" as const, dayBranch: "xu" as const };
  const qian = calculateLiuyao([oldYin, oldYin, oldYang, oldYin, oldYin, oldYin], context);
  const lin = calculateLiuyao([oldYang, oldYang, oldYin, oldYin, oldYin, oldYin], context);

  assert.ok(qian.evidence.some((item) => item.rule === "day_tomb" && item.line === 2));
  assert.ok(qian.analysis.timing?.details.some((item) => item.trigger === "clash_open" && item.reason.includes("临墓")));
  assert.ok(lin.evidence.some((item) => item.rule === "moving_line_bound_by_combine" && item.effect === "obstruct"));
  assert.ok(lin.analysis.timing?.details.some((item) => item.trigger === "release_combine"));
});

test("an active three-harmony bureau states its actual relation to the useful god", () => {
  const oldYin: CoinToss = [2, 3, 3];
  const oldYang: CoinToss = [3, 3, 3];
  const result = calculateLiuyao([oldYin, oldYin, oldYin, oldYang, oldYin, oldYin], {
    topic: "career", monthBranch: "yin", dayStem: "jia", dayBranch: "xu",
  });

  const harmony = result.evidence.find((item) => item.rule === "three_harmony_drains_or_controls_useful");
  assert.match(harmony?.technicalText ?? "", /寅、午、戌三支齐见/);
  assert.equal(harmony?.effect, "obstruct");
});

test("an explicit topic target can select Ying as the partnership useful god", () => {
  const staticYang: CoinToss = [3, 2, 2];
  const result = calculateLiuyao(Array(6).fill(staticYang), {
    topic: "partnership", usefulGod: "ying", monthBranch: "wei", dayStem: "jia", dayBranch: "zi",
  });

  assert.deepEqual(result.analysis.usefulGod, { relation: "ying", line: 3, hidden: false, flyingLine: null });
});

test("partnership analysis states whether the other side supports or constrains Shi", () => {
  const oldYin: CoinToss = [2, 3, 3];
  const oldYang: CoinToss = [3, 3, 3];
  const result = calculateLiuyao([oldYang, oldYin, oldYin, oldYin, oldYin, oldYin], {
    topic: "partnership", monthBranch: "yin", dayStem: "jia", dayBranch: "zi",
  });

  assert.ok(result.evidence.some((item) => item.rule === "ying_controls_shi" && item.effect === "obstruct"));
});

test("health analysis separates Shi, illness pressure and relief while preserving a medical boundary", () => {
  const oldYin: CoinToss = [2, 3, 3];
  const oldYang: CoinToss = [3, 3, 3];
  const illness = calculateLiuyao([oldYang, oldYin, oldYin, oldYin, oldYin, oldYin], {
    topic: "health", monthBranch: "yin", dayStem: "jia", dayBranch: "zi",
  });
  const relief = calculateLiuyao([oldYang, oldYin, oldYang, oldYin, oldYin, oldYin], {
    topic: "health", monthBranch: "yin", dayStem: "jia", dayBranch: "zi",
  });

  assert.equal(illness.analysis.usefulGod?.relation, "shi");
  assert.ok(illness.evidence.some((item) => item.rule === "health_illness_factor_active"));
  assert.ok(relief.evidence.some((item) => item.rule === "health_relief_controls_illness"));
  assert.ok(relief.judgment.limitations.some((item) => item.includes("不能替代")));
});

test("multiple useful-god candidates expose their full score and select the stronger line", () => {
  const oldYin: CoinToss = [2, 2, 2];
  const staticYang: CoinToss = [3, 2, 2];
  const result = calculateLiuyao([staticYang, oldYin, oldYin, oldYin, oldYin, oldYin], {
    topic: "wealth", monthBranch: "zi", dayStem: "jia", dayBranch: "zi",
  });

  assert.equal(result.analysis.usefulGod?.line, 1);
  const selection = result.evidence.find((item) => item.rule === "useful_god_multiple_candidates");
  assert.match(selection?.technicalText ?? "", /第1爻 9分/);
  assert.match(selection?.technicalText ?? "", /第5爻 6分/);
});

test("a static line clashed by the day distinguishes hidden movement from day break", () => {
  const oldYin: CoinToss = [2, 2, 2];
  const staticYang: CoinToss = [3, 2, 2];
  const tosses = [staticYang, staticYang, oldYin, oldYin, oldYin, oldYin] as CoinToss[];
  const hiddenMovement = calculateLiuyao(tosses, { topic: "career", monthBranch: "zi", dayStem: "jia", dayBranch: "you" });
  const dayBreak = calculateLiuyao([staticYang, oldYin, oldYin, oldYin, oldYin, oldYin], { topic: "wealth", monthBranch: "si", dayStem: "jia", dayBranch: "wu" });

  assert.ok(hiddenMovement.evidence.some((item) => item.rule === "hidden_movement" && item.effect === "support"));
  assert.ok(dayBreak.evidence.some((item) => item.rule === "day_break" && item.effect === "obstruct"));
});

test("branch punishment and harm remain qualified friction evidence", () => {
  const oldYin: CoinToss = [2, 2, 2];
  const result = calculateLiuyao(Array(6).fill(oldYin), { topic: "career", monthBranch: "zi", dayStem: "jia", dayBranch: "zi" });

  assert.ok(result.evidence.some((item) => item.rule === "branch_harm_on_useful" && item.effect === "mixed"));
  assert.ok(result.evidence.some((item) => item.rule === "branch_punishment_on_useful" && item.effect === "mixed"));
});

test("the complete progress and retreat table applies to useful, source and avoid gods", () => {
  const progressPairs = [["hai", "zi"], ["yin", "mao"], ["si", "wu"], ["shen", "you"], ["chou", "chen"], ["chen", "wei"], ["wei", "xu"], ["xu", "chou"]] as const;
  for (const [from, to] of progressPairs) {
    assert.equal(transformationDirection(from, to), "progress");
    assert.equal(transformationDirection(to, from), "retreat");
  }
  const oldYin: CoinToss = [2, 2, 2];
  const oldYang: CoinToss = [3, 3, 3];
  const staticYang: CoinToss = [3, 2, 2];
  const sourceProgress = calculateLiuyao([oldYin, oldYang, oldYin, oldYin, oldYin, oldYin], { topic: "wealth", monthBranch: "zi", dayStem: "jia", dayBranch: "zi" });
  const sourceRetreat = calculateLiuyao([oldYin, oldYang, oldYin, oldYin, oldYin, oldYin], { topic: "study", monthBranch: "zi", dayStem: "jia", dayBranch: "zi" });
  const avoidProgress = calculateLiuyao([staticYang, staticYang, oldYin, oldYin, oldYin, oldYin], { topic: "wealth", monthBranch: "zi", dayStem: "jia", dayBranch: "zi" });
  const avoidRetreat = calculateLiuyao([oldYang, oldYin, oldYang, oldYin, oldYin, oldYin], { topic: "career", monthBranch: "zi", dayStem: "jia", dayBranch: "zi" });

  assert.ok(sourceProgress.evidence.some((item) => item.rule === "source_god_transforms_progress"));
  assert.ok(sourceRetreat.evidence.some((item) => item.rule === "source_god_transforms_retreat"));
  assert.ok(avoidProgress.evidence.some((item) => item.rule === "avoid_god_transforms_progress"));
  assert.ok(avoidRetreat.evidence.some((item) => item.rule === "avoid_god_transforms_retreat"));
  assert.equal(transformationDirection("zi", "chou"), null);
});

test("timing candidates include timezone-stable branch-day windows when casting time is available", () => {
  const staticYang: CoinToss = [3, 2, 2];
  const result = calculateLiuyao(Array(6).fill(staticYang), {
    topic: "career", monthBranch: "chou", dayStem: "jia", dayBranch: "zi",
    occurredAt: "2019-01-27T12:00:00.000Z", timezone: "UTC",
  });

  const ziDay = result.analysis.timing?.details.find((item) => item.branch === "zi");
  assert.deepEqual(ziDay?.dateWindows?.map((window) => window.startDate), ["2019-01-27", "2019-02-08"]);
  const wuDay = result.analysis.timing?.details.find((item) => item.branch === "wu");
  assert.deepEqual(wuDay?.dateWindows?.map((window) => window.startDate), ["2019-02-02", "2019-02-14"]);
});

test("moving branches expose qualified Fu Yin repetition and Fan Yin reversal evidence", () => {
  const oldYin: CoinToss = [2, 2, 2];
  const staticYang: CoinToss = [3, 2, 2];
  const staticYin: CoinToss = [2, 3, 3];
  const context = { topic: "career" as const, monthBranch: "zi" as const, dayStem: "jia" as const, dayBranch: "zi" as const };
  const repeated = calculateLiuyao([staticYang, oldYin, oldYin, oldYin, oldYin, oldYin], context);
  const reversed = calculateLiuyao([staticYin, oldYin, oldYin, oldYin, oldYin, oldYin], context);

  assert.ok(repeated.evidence.some((item) => item.rule === "moving_lines_repeat_fuyin" && item.effect === "mixed"));
  assert.ok(reversed.evidence.some((item) => item.rule === "moving_lines_reverse_fanyin" && item.effect === "obstruct"));
});

test("hidden spirits include strength, void, month-break and moving flying-spirit pressure", () => {
  const oldYin: CoinToss = [2, 2, 2];
  const staticYang: CoinToss = [3, 2, 2];
  const oldYang: CoinToss = [3, 3, 3];
  const voidResult = calculateLiuyao([oldYin, staticYang, oldYin, staticYang, oldYin, staticYang], {
    topic: "career", monthBranch: "zi", dayStem: "jia", dayBranch: "zi",
  });
  const pressured = calculateLiuyao([staticYang, oldYin, oldYang, oldYin, oldYin, oldYin], {
    topic: "wealth", monthBranch: "zi", dayStem: "jia", dayBranch: "zi",
  });

  assert.equal(voidResult.analysis.hiddenSpirit?.void, true);
  assert.ok(voidResult.evidence.some((item) => item.rule === "hidden_spirit_void"));
  assert.ok(voidResult.analysis.timing?.details.some((item) => item.reason.includes("伏神旬空")));
  assert.equal(pressured.analysis.hiddenSpirit?.flyingMoving, true);
  assert.ok(pressured.evidence.some((item) => item.rule === "hidden_spirit_month_break"));
  assert.ok(pressured.evidence.some((item) => item.rule === "moving_flying_controls_hidden"));
});

test("long-horizon timing uses solar-term month ranges while preserving day-scale compatibility", () => {
  const staticYang: CoinToss = [3, 2, 2];
  const result = calculateLiuyao(Array(6).fill(staticYang), {
    topic: "career", monthBranch: "chou", dayStem: "jia", dayBranch: "zi",
    occurredAt: "2019-01-27T12:00:00.000Z", timezone: "UTC", timingScale: "month",
  });

  const candidate = result.analysis.timing?.details.find((item) => item.dateWindows?.length);
  assert.equal(candidate?.scale, "month");
  assert.notEqual(candidate?.dateWindows?.[0].startDate, candidate?.dateWindows?.[0].endDate);
  assert.match(candidate?.dateWindows?.[0].label ?? "", /月候选/);
});

test("topic-specific analysis keeps the primary useful god and adds auditable auxiliary factors", () => {
  const staticYang: CoinToss = [3, 2, 2];
  const oldYin: CoinToss = [2, 3, 3];
  const oldYang: CoinToss = [3, 3, 3];
  const career = calculateLiuyao(Array(6).fill(staticYang), {
    topic: "career", monthBranch: "xu", dayStem: "jia", dayBranch: "zi",
  });
  const relationship = calculateLiuyao([oldYang, oldYin, oldYin, oldYin, oldYin, oldYin], {
    topic: "relationship_female", monthBranch: "yin", dayStem: "jia", dayBranch: "zi",
  });

  assert.equal(career.analysis.usefulGod?.relation, "officials");
  assert.ok(career.evidence.some((item) => item.rule === "topic_auxiliary_career" && item.conclusion.includes("父母爻")));
  assert.ok(relationship.evidence.some((item) => item.rule === "relationship_ying_controls_shi"));
});

test("hexagram body, wandering soul and returning soul remain structural evidence rather than verdict shortcuts", () => {
  const yin: CoinToss = [2, 3, 3];
  const yang: CoinToss = [3, 2, 2];
  const context = { topic: "career" as const, monthBranch: "zi" as const, dayStem: "jia" as const, dayBranch: "zi" as const };
  const wandering = calculateLiuyao([yang, yin, yang, yin, yin, yin], context);
  const returning = calculateLiuyao([yin, yang, yin, yin, yin, yin], context);

  assert.equal(wandering.structure.palaceStage, "wandering_soul");
  assert.deepEqual(wandering.structure.hexagramBody, { branch: "you", polarity: "yin", lines: [6] });
  assert.ok(wandering.evidence.some((item) => item.rule === "wandering_soul_structure" && item.effect === "mixed"));
  assert.equal(returning.structure.palaceStage, "returning_soul");
  assert.equal(returning.structure.hexagramBody.lines.length, 0);
  assert.ok(returning.evidence.some((item) => item.rule === "returning_soul_structure"));
  assert.ok(returning.evidence.some((item) => item.rule === "hexagram_body_location" && item.effect === "neutral"));
});

test("single moving and single static lines identify the information focus without deciding good or bad", () => {
  const yin: CoinToss = [2, 3, 3];
  const movingYin: CoinToss = [2, 2, 2];
  const context = { topic: "career" as const, monthBranch: "zi" as const, dayStem: "jia" as const, dayBranch: "zi" as const };
  const singleMoving = calculateLiuyao([movingYin, yin, yin, yin, yin, yin], context);
  const singleStatic = calculateLiuyao([yin, movingYin, movingYin, movingYin, movingYin, movingYin], context);

  assert.ok(singleMoving.evidence.some((item) => item.rule === "single_moving_line" && item.line === 1 && item.effect === "neutral"));
  assert.ok(singleStatic.evidence.some((item) => item.rule === "single_static_line" && item.line === 1 && item.effect === "neutral"));
});

test("general Shi-use relations state whether the target supports, drains or conflicts with the user", () => {
  const yin: CoinToss = [2, 3, 3];
  const yang: CoinToss = [3, 2, 2];
  const context = { topic: "career" as const, monthBranch: "zi" as const, dayStem: "jia" as const, dayBranch: "zi" as const };
  const conflict = calculateLiuyao(Array(6).fill(yin), context);
  const supported = calculateLiuyao([yang, yang, yin, yang, yin, yin], context);

  assert.ok(conflict.evidence.some((item) => item.rule === "shi_controls_useful" && item.effect === "obstruct"));
  assert.ok(conflict.evidence.some((item) => item.rule === "shi_use_clash" && item.effect === "mixed"));
  assert.ok(supported.evidence.some((item) => item.rule === "useful_generates_shi" && item.effect === "support"));
});

test("job search, exam, reconciliation and investment scenarios add distinct auditable factors", () => {
  const yin: CoinToss = [2, 3, 3];
  const yang: CoinToss = [3, 2, 2];
  const movingYin: CoinToss = [2, 2, 2];
  const calendar = { monthBranch: "zi" as const, dayStem: "jia" as const, dayBranch: "zi" as const };
  const job = calculateLiuyao([yin, movingYin, yin, yin, yin, yin], { topic: "career", scenario: "job_search", ...calendar });
  const exam = calculateLiuyao([yin, yin, movingYin, yin, yin, yin], { topic: "study", scenario: "exam", ...calendar });
  const reconciliationClash = calculateLiuyao(Array(6).fill(yin), { topic: "self", usefulGod: "ying", scenario: "reconciliation", ...calendar });
  const reconciliationCombine = calculateLiuyao([yang, yin, yin, yin, yin, yin], { topic: "self", usefulGod: "ying", scenario: "reconciliation", ...calendar });
  const investment = calculateLiuyao([yin, yin, movingYin, yin, yin, yin], { topic: "wealth", scenario: "investment", ...calendar });

  assert.ok(job.evidence.some((item) => item.rule === "job_search_employer_relation"));
  assert.ok(job.evidence.some((item) => item.rule === "job_search_documents"));
  assert.ok(exam.evidence.some((item) => item.rule === "exam_evaluation_conditions"));
  assert.ok(reconciliationClash.evidence.some((item) => item.rule === "reconciliation_shi_ying_clash"));
  assert.ok(reconciliationCombine.evidence.some((item) => item.rule === "reconciliation_shi_ying_combine"));
  assert.ok(investment.evidence.some((item) => item.rule === "investment_risk_factor"));
  assert.ok(investment.judgment.limitations.some((item) => item.includes("不能替代资产核验")));
  assert.equal(investment.judgment.verdicts[0].topic, "wealth");
});

test("all five six-relation Shi holdings are reachable and interpreted by topic", () => {
  const yin: CoinToss = [2, 3, 3];
  const yang: CoinToss = [3, 2, 2];
  const fixtures: Array<[CoinToss[], string]> = [
    [Array(6).fill(yin), "shi_holds_offspring"],
    [[yang, yin, yin, yin, yin, yin], "shi_holds_wealth"],
    [[yang, yang, yin, yin, yin, yin], "shi_holds_officials"],
    [[yang, yang, yang, yin, yin, yin], "shi_holds_siblings"],
    [[yang, yang, yin, yang, yin, yin], "shi_holds_parents"],
  ];

  for (const [tosses, rule] of fixtures) {
    const result = calculateLiuyao(tosses, { topic: "self", monthBranch: "zi", dayStem: "jia", dayBranch: "zi" });
    assert.ok(result.evidence.some((item) => item.rule === rule && item.line === result.structure.shi), rule);
  }
});

test("historical Python analysis fixtures preserve hidden-spirit choice and earth tomb", () => {
  const yin: CoinToss = [2, 3, 3];
  const yang: CoinToss = [3, 2, 2];
  const result = calculateLiuyao([yin, yang, yang, yang, yang, yang], {
    topic: "wealth", monthBranch: "yin", dayStem: "jia", dayBranch: "zi",
  });

  assert.equal(dayTombFor("earth"), "chen");
  assert.equal(result.analysis.usefulGod?.hidden, true);
  assert.equal(result.analysis.hiddenSpirit?.relation, "wealth");
  assert.equal(result.analysis.hiddenSpirit?.line, 2);
  assert.equal(result.analysis.hiddenSpirit?.branch, "yin");
  assert.equal(result.analysis.hiddenSpirit?.flyingBranch, "hai");
});

test("moving Shi or Ying recalculates their post-change relationship", () => {
  const yin: CoinToss = [2, 3, 3];
  const movingYang: CoinToss = [3, 3, 3];
  const result = calculateLiuyao([movingYang, yin, yin, yin, yin, yin], {
    topic: "partnership", monthBranch: "zi", dayStem: "jia", dayBranch: "zi",
  });

  assert.ok(result.evidence.some((item) => item.rule === "shi_line_changes"));
  const changed = result.evidence.find((item) => item.rule === "shi_ying_relation_after_change");
  assert.match(changed?.technicalText ?? "", /变后状态/);
  assert.equal(changed?.effect, "obstruct");
});

test("scenario stages select only their relevant auxiliary rule families", () => {
  const yin: CoinToss = [2, 3, 3];
  const movingYin: CoinToss = [2, 2, 2];
  const tosses = [yin, movingYin, yin, yin, yin, yin];
  const calendar = { monthBranch: "zi" as const, dayStem: "jia" as const, dayBranch: "zi" as const };
  const interview = calculateLiuyao(tosses, { topic: "career", scenario: "job_search", scenarioFocus: "job_interview", ...calendar });
  const offer = calculateLiuyao(tosses, { topic: "career", scenario: "job_search", scenarioFocus: "job_offer", ...calendar });
  const examScore = calculateLiuyao(tosses, { topic: "study", scenario: "exam", scenarioFocus: "exam_score", ...calendar });
  const examAdmission = calculateLiuyao(tosses, { topic: "study", scenario: "exam", scenarioFocus: "exam_admission", ...calendar });
  const contact = calculateLiuyao(tosses, { topic: "self", usefulGod: "ying", scenario: "reconciliation", scenarioFocus: "relationship_contact", ...calendar });
  const investment = calculateLiuyao(tosses, { topic: "wealth", scenario: "investment", scenarioFocus: "investment_long_term", ...calendar });

  assert.ok(interview.evidence.some((item) => item.rule === "job_search_employer_relation"));
  assert.ok(!interview.evidence.some((item) => item.rule === "job_search_documents"));
  assert.ok(!offer.evidence.some((item) => item.rule === "job_search_employer_relation"));
  assert.ok(offer.evidence.some((item) => item.rule === "scenario_focus_job_offer"));
  assert.ok(!examScore.evidence.some((item) => item.rule === "exam_evaluation_conditions"));
  assert.ok(examAdmission.evidence.some((item) => item.rule === "scenario_focus_exam_admission"));
  assert.ok(contact.evidence.some((item) => item.rule === "relationship_contact_signal"));
  assert.ok(investment.evidence.some((item) => item.rule === "investment_long_term_weighting"));
});

test("judgment arbitration exposes opposing evidence and lowers confidence for a real conflict", () => {
  const yin: CoinToss = [2, 3, 3];
  const movingYang: CoinToss = [3, 3, 3];
  const result = calculateLiuyao([yin, movingYang, yin, yin, yin, yin], {
    topic: "career", monthBranch: "zi", dayStem: "jia", dayBranch: "zi",
  });
  const verdict = result.judgment.verdicts[0];

  assert.equal(verdict.direction, "mixed");
  assert.equal(verdict.evidenceBalance, "conflicted");
  assert.ok((verdict.supportScore ?? 0) > 0);
  assert.ok((verdict.obstructionScore ?? 0) > 0);
  assert.ok((verdict.decisiveEvidenceIds?.length ?? 0) >= 2);
  assert.match(verdict.shortReason, /；但/);
  assert.ok(verdict.confidence < 0.6);
});

test("multi-intent evidence is scoped and deterministic across repeated calculations", () => {
  const movingYang: CoinToss = [3, 3, 3];
  const context = {
    topic: "travel" as const, monthBranch: "wei" as const, dayStem: "wu" as const, dayBranch: "shen" as const,
    intents: [
      { id: "travel-1", label: "邀约", topic: "travel" as const, priority: 1 },
      { id: "wealth-2", label: "输赢", topic: "wealth" as const, priority: 2 },
    ],
  };
  const first = calculateLiuyao(Array(6).fill(movingYang), context);

  assert.deepEqual(new Set(first.judgment.keyEvidence.map((item) => item.intentId)), new Set(["travel-1", "wealth-2"]));
  assert.ok(first.evidence.every((item) => item.intentId === "travel-1" || item.intentId === "wealth-2"));
  assert.ok(first.judgment.verdicts.every((verdict) => verdict.decisiveEvidenceIds?.every((id) => id.startsWith(`${verdict.intentId}:`))));
  for (let index = 0; index < 10; index += 1) {
    assert.deepEqual(calculateLiuyao(Array(6).fill(movingYang), context), first);
  }
});
