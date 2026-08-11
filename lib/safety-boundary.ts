export type SafetyBoundary = "crisis" | "health" | "legal" | "finance" | "none";

export function classifySafetyBoundary(text: string): SafetyBoundary {
  const value = String(text || "");
  if (/自杀|轻生|不想活|结束生命|伤害自己|割腕|跳楼|活不下去/u.test(value)) return "crisis";
  if (/症状|确诊|用药|停药|剂量|手术|疼痛|生病|治疗|心理疾病|抑郁|焦虑症/u.test(value)) return "health";
  if (/起诉|诉讼|仲裁|合同纠纷|报警|法律责任|判刑|律师/u.test(value)) return "legal";
  if (/投资|借贷|贷款|加杠杆|合约交易|买入|卖出|理财|税务/u.test(value)) return "finance";
  return "none";
}

export function safetyPrompt(boundary: SafetyBoundary) {
  if (boundary === "health") return "这是健康相关问题：先给情绪与行动支持，但不得诊断、解释检查结果、指导用药或替代医生；明确建议联系合格医疗人员。";
  if (boundary === "legal") return "这是法律相关问题：只提供一般信息与整理思路，不判断法律责任或替代律师；提醒核对所在地规则并咨询合格法律专业人士。";
  if (boundary === "finance") return "这是财务相关问题：不得给出个性化买卖、杠杆或收益承诺；先说明风险与信息缺口，并建议核对持牌专业意见。";
  return "";
}

export const CRISIS_RESPONSE = "我很在意你刚才说的这句话。现在先别一个人扛：如果你正准备伤害自己，或已经无法保证安全，请立即联系当地急救电话，去最近的急诊，或请一个可信的人现在陪在你身边。把可能伤害自己的物品先移远，然后只回复我两个字也可以：安全，或危险。";
