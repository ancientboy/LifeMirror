import type { RelationshipClassification, RelationshipPolicy } from "./types.js";

const policies: Record<string, RelationshipPolicy> = {
  dating: { key: "dating", label: "恋爱互动", priorities: ["投入是否对等", "言行信号是否一致", "现在是否适合主动"], avoid: ["替 TA 读心", "鼓励操控或反复试探", "把一次冷淡直接判成关系结论"], replyStyle: "自然、轻量、给对方可回应空间", nextSignals: ["是否在合理时间内回应", "回应是否具体", "是否出现对等投入"] },
  partner: { key: "partner", label: "伴侣沟通", priorities: ["冲突核心", "双方实际需要", "修复意愿和重复模式"], avoid: ["只教话术不处理重复伤害", "用诊断标签解释对方", "要求用户一味退让"], replyStyle: "降低对抗，表达具体影响和请求", nextSignals: ["是否愿意讨论具体问题", "是否有可执行改变", "冲突后是否持续修复"] },
  ex: { key: "ex", label: "前任关系", priorities: ["联系目的", "分离边界", "现实回应是否稳定"], avoid: ["把偶尔联系等同于复合", "鼓励纠缠", "制造希望"], replyStyle: "清楚、克制、不交换模糊承诺", nextSignals: ["行动是否匹配表达", "是否尊重边界", "是否只在情绪波动时出现"] },
  friendship: { key: "friendship", label: "朋友关系", priorities: ["互惠程度", "误会还是疏远", "边界是否失衡"], avoid: ["把普通疏远判成背叛", "鼓励情绪勒索"], replyStyle: "平等、自然、不过度沉重", nextSignals: ["是否愿意解释", "是否有双向投入", "边界是否被尊重"] },
  colleague: { key: "colleague", label: "同事协作", priorities: ["责任归属", "协作信息", "边界与留痕"], avoid: ["把工作问题完全情绪化", "鼓励公开对抗"], replyStyle: "简洁、具体、便于留痕", nextSignals: ["任务和时间是否被确认", "是否有书面记录", "协作是否改善"] },
  manager: { key: "manager", label: "领导沟通", priorities: ["权力差", "职业风险", "证据、时机和替代方案"], avoid: ["情绪化对抗", "冲动越级", "没有证据的指控"], replyStyle: "低风险表达，事实先行，提出清晰请求", nextSignals: ["对方是否确认事实", "是否给出时间和标准", "是否出现报复风险"] },
  report: { key: "report", label: "管理沟通", priorities: ["职责是否清晰", "反馈是否具体", "权力边界"], avoid: ["羞辱或威胁", "用私人关系替代管理流程"], replyStyle: "具体反馈、明确标准、保留尊重", nextSignals: ["对方是否理解标准", "是否能按约定改进", "是否需要正式流程"] },
  family: { key: "family", label: "家庭关系", priorities: ["长期角色", "现实依赖", "边界是否可执行", "是否涉及控制或伤害"], avoid: ["用一句话术解决多年问题", "忽略经济或照护依赖", "要求无条件和解"], replyStyle: "温和但不牺牲边界，优先现实安全", nextSignals: ["边界是否能实际执行", "是否有可信支持", "互动是否持续安全"] },
  fallback: { key: "fallback", label: "关系沟通", priorities: ["已经发生的事实", "用户真正目标", "最小风险下一步"], avoid: ["读心", "确定性结论", "操控性话术"], replyStyle: "低假设、自然、可撤回", nextSignals: ["现实回应", "是否尊重边界", "行动是否与表达一致"] },
};

export function relationshipPolicyFor(classification: RelationshipClassification) {
  if (classification.role === "dating" || classification.role === "partner" || classification.role === "ex" || classification.role === "manager" || classification.role === "colleague" || classification.role === "report") return policies[classification.role];
  if (classification.domain === "friendship") return policies.friendship;
  if (classification.domain === "family") return policies.family;
  return policies.fallback;
}

export function relationshipPromptContext(classification: RelationshipClassification) {
  const policy = relationshipPolicyFor(classification);
  return [`策略：${policy.label}`, `优先判断：${policy.priorities.join("、")}`, `必须避免：${policy.avoid.join("、")}`, `建议回复风格：${policy.replyStyle}`, `后续观察：${policy.nextSignals.join("、")}`].join("\n");
}
