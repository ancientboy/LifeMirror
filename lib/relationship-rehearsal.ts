import type { PrivatePerson } from "./relationship-context";
import type { RelationshipCalibration } from "./relationship-learning";

export type RehearsalPath = { id: "receptive" | "needs-space" | "defensive"; label: string; response: string; nextMove: string };
export type RelationshipRehearsal = { opening: string; perspective: string; checkpoints: string[]; paths: RehearsalPath[]; calibration?: RelationshipCalibration };

function clean(value: string | undefined, fallback: string) {
  const result = value?.trim().replace(/\s+/g, " ").slice(0, 180);
  return result || fallback;
}

/** A rehearsal aid, never a prediction of a real person's inner life. */
export function createRelationshipRehearsal(person: PrivatePerson, situation: string, need: string, calibration?: RelationshipCalibration): RelationshipRehearsal {
  const topic = clean(situation, "最近的相处方式");
  const request = clean(need, "我们能不能一起找一个彼此都舒服的做法");
  const notes = person.communicationNotes || person.userDescription;
  const context = notes ? `你此前写下的观察是“${notes.slice(0, 96)}”。` : "你还没有写下更多互动细节。";
  const name = person.displayName;
  return {
    opening: `${name}，我想认真聊一下${topic}。当这件事发生时，我会感到在意和不安；我不是想指责你，而是想让你知道这对我的影响。${request}？`,
    perspective: `以下练习只基于你目前提供的资料。${context} 它不是对 ${name} 心理状态的判断，也不是对 TA 会怎样回应的预测。`,
    checkpoints: ["先说一个具体场景，再说你的感受；避免用“你总是／你从不”开头。", "把“希望你改变”换成一个可以回应的具体请求。", calibration?.nextPractice ?? "给对方停顿和不同意见的空间，不把一次谈话当成关系的最终判决。"],
    paths: [
      { id: "receptive", label: "愿意理解", response: `一种可能是：${name} 听见了你的在意，愿意先确认“我不知道这会让你这么难受”，再和你讨论怎么调整。`, nextMove: "你可以接：谢谢你愿意听。对我来说，最有帮助的是我们先约定一个具体做法，而不是马上把所有问题都解决。" },
      { id: "needs-space", label: "暂时需要空间", response: `一种可能是：${name} 并不马上回应细节，可能说“我现在有点乱／需要想一想”。这不必然代表拒绝，也可能只是还没有准备好组织表达。`, nextMove: "你可以接：好，我们不用现在定结论。你愿意在什么时候再回到这件事？我希望不要让它就这样消失。" },
      { id: "defensive", label: "感到被指责", response: `一种可能是：${name} 听成了批评，先解释自己或反问你。这是困难谈话里常见的路径，不代表你表达需求就是错的。`, nextMove: "你可以接：我听见你也有你的难处。我不是在给你定性；我想先把这一件事讲清楚，再听你的感受。" },
    ], calibration: calibration?.completedActions ? calibration : undefined,
  };
}

export function coachRehearsalReply(reply: string) {
  const text = reply.trim();
  if (!text) return "先用你自己的话写下一句回应；这里不会自动保存，除非你之后主动把它变成现实记录。";
  const hasFeeling = /我(感到|会|很|不安|难过|在意|希望|需要)/.test(text);
  if (/你(总是|从不|就是|永远)/.test(text)) return "这句话可能让对方先进入防御。试着补一个具体情境，并把“你总是”换成“当……发生时，我会……”。";
  if (!hasFeeling) return "这句已经在回应对方了；再加上你的感受或需要，会让谈话更容易落到真实问题上。";
  return "这句话既保留了你的感受，也没有替对方下结论。下一步可以加一个小而具体、对方能回答的请求。";
}

/** A short, corrigible possible reply. Corrections and real feedback outrank this hypothesis. */
export function createPersonSimulationReply(person: PrivatePerson, userMessage: string) {
  const corrections = (person.observations ?? []).filter((item) => item.source === "owner_correction").map((item) => item.text).join(" ");
  if (corrections) return `${person.displayName} · 模拟：${corrections.slice(0, 120)}`;
  const notes = person.communicationNotes || person.userDescription;
  if (notes) return `${person.displayName} · 模拟：我听见你在说“${userMessage.slice(0, 42)}”，但我现在不太知道怎么回应。你能先告诉我，你最在意的是什么吗？`;
  return `${person.displayName} · 模拟：我先听着。你想从哪一件具体的事开始？`;
}
