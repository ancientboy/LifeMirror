export type MirrorRecommendation = {
  href: "/app/liuyao/" | "/app/tarot/" | "/app/chart/" | "/app/astrology/" | "/app/home/";
  label: string;
  reason: string;
  seed?: string;
};

/**
 * A deliberately small, explainable first-step router. It never claims to know
 * the user or diagnose them; it only matches the shape of the question to the
 * tool that can provide the most useful supplemental perspective.
 */
export function recommendMirrorForQuestion(input: string): MirrorRecommendation {
  const question = input.replace(/\s+/g, " ").trim();
  if (!question) return { href: "/app/home/", label: "先和拾光聊聊", reason: "先把你在意的事说清，不急着选工具。" };
  if (/(能不能|是否|要不要|该不该|会不会|结果|offer|面试|合作|决定|选择|推进|复合)/u.test(question)) {
    return { href: "/app/liuyao/", label: "用六爻看这件事", reason: "这是一个具体且正在变化的现实问题；六爻更适合梳理条件、助力与阻力。", seed: question };
  }
  if (/(关系|感情|喜欢|分手|对方|他|她|我们|沟通|开口|情绪|焦虑|难过|害怕)/u.test(question)) {
    return { href: "/app/tarot/", label: "用塔罗看当下", reason: "你更像是在厘清感受或关系张力；塔罗适合作为当下的象征性观察。", seed: question };
  }
  if (/(为什么我|一直|长期|性格|天赋|职业方向|人生节奏|五行|命盘)/u.test(question)) {
    return { href: "/app/chart/", label: "建立我的命盘", reason: "你在问长期模式与节奏；命盘能提供一张稳定底图，不替你下定论。" };
  }
  if (/(星盘|行星|宫位|相位|人格|内在动力|关系模式)/u.test(question)) {
    return { href: "/app/astrology/", label: "建立我的星盘", reason: "你关注的是心理动力和关系模式；本命星盘更适合作为长期参考。" };
  }
  return { href: "/app/home/", label: "先和拾光聊聊", reason: "这件事还不必急着放进任何体系，先把现实里最卡住的部分说出来。", seed: question };
}
