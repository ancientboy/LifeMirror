import type { PowerPosition, RelationshipClassification, RelationshipDomain, RelationshipGoal, RelationshipRole, RelationshipStage } from "./types.js";

const roleRules: Array<{ pattern: RegExp; role: RelationshipRole; domain: RelationshipDomain; power: PowerPosition }> = [
  { pattern: /前任|前男友|前女友|前夫|前妻/u, role: "ex", domain: "romance", power: "roughly_equal" },
  { pattern: /暧昧|约会|相亲|喜欢的人|追我|在追|crush/iu, role: "dating", domain: "romance", power: "roughly_equal" },
  { pattern: /男朋友|女朋友|对象|伴侣|老公|老婆|丈夫|妻子/u, role: "partner", domain: "romance", power: "roughly_equal" },
  { pattern: /老板|领导|上司|主管|经理/u, role: "manager", domain: "work", power: "user_lower_power" },
  { pattern: /下属|员工|组员|实习生/u, role: "report", domain: "work", power: "user_higher_power" },
  { pattern: /客户|甲方|合作方/u, role: "client", domain: "work", power: "unknown" },
  { pattern: /同事|同组|搭档/u, role: "colleague", domain: "work", power: "roughly_equal" },
  { pattern: /妈妈|母亲|爸爸|父亲|父母/u, role: "parent", domain: "family", power: "dependent" },
  { pattern: /儿子|女儿|孩子/u, role: "child", domain: "family", power: "user_higher_power" },
  { pattern: /哥哥|姐姐|弟弟|妹妹|兄弟|姐妹/u, role: "sibling", domain: "family", power: "roughly_equal" },
  { pattern: /家人|亲戚|长辈|晚辈/u, role: "relative", domain: "family", power: "unknown" },
  { pattern: /朋友|闺蜜|兄弟|好友/u, role: "friend", domain: "friendship", power: "roughly_equal" },
];

function inferGoal(text: string): RelationshipGoal {
  if (/什么意思|怎么看|什么信号|是不是|为什么/u.test(text)) return "interpret_signal";
  if (/怎么回|回复|回什么|怎么说/u.test(text)) return "draft_reply";
  if (/要不要主动|该不该联系|要不要找|先开口/u.test(text)) return "decide_initiation";
  if (/和好|修复|挽回|道歉|吵架/u.test(text)) return "repair";
  if (/拒绝|不想答应|怎么推掉/u.test(text)) return "refuse";
  if (/边界|越界|底线|别再/u.test(text)) return "set_boundary";
  if (/谈谈|沟通|开会|面谈|准备说/u.test(text)) return "prepare_conversation";
  return "other";
}

function inferStage(text: string): RelationshipStage {
  if (/分手|离婚|已经结束|前任/u.test(text)) return "separated";
  if (/冷淡|不回|消失|疏远|冷战/u.test(text)) return "cooling";
  if (/吵架|冲突|生气|翻脸|争执/u.test(text)) return "conflict";
  if (/和好|修复|重新联系/u.test(text)) return "repairing";
  if (/刚认识|第一次|相亲|初识/u.test(text)) return "new";
  if (/暧昧|发展中|追求/u.test(text)) return "developing";
  if (/长期|多年|一直|稳定/u.test(text)) return "stable";
  return "unknown";
}

export function classifyRelationship(text: string, fallback?: Partial<RelationshipClassification>): RelationshipClassification {
  const clean = String(text || "").slice(0, 6_000);
  const matched = roleRules.find((rule) => rule.pattern.test(clean));
  const role = matched?.role ?? fallback?.role ?? "other";
  const domain = matched?.domain ?? fallback?.domain ?? "other";
  const powerPosition = matched?.power ?? fallback?.powerPosition ?? "unknown";
  const goal = inferGoal(clean) === "other" ? fallback?.goal ?? "other" : inferGoal(clean);
  const stage = inferStage(clean) === "unknown" ? fallback?.stage ?? "unknown" : inferStage(clean);
  const confidence = matched ? (goal === "other" ? 0.78 : 0.91) : domain !== "other" ? 0.68 : 0.38;
  const missingCriticalField = !matched && /怎么回|要不要主动|该不该联系/u.test(clean) ? "role" : undefined;
  return { domain, role, stage, powerPosition, goal, confidence, missingCriticalField, reasonCodes: [matched ? `role:${role}` : "role:unknown", `goal:${goal}`, `stage:${stage}`] };
}

export function relationshipLabel(role: RelationshipRole) {
  return ({ dating: "暧昧／约会", partner: "伴侣", ex: "前任", friend: "朋友", colleague: "同事", manager: "领导", report: "下属", client: "客户／合作方", parent: "父母", child: "子女", sibling: "兄弟姐妹", relative: "家人", other: "其他关系" } as const)[role];
}
