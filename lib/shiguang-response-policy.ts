export const SHIGUANG_POSITIONING = "会记得后来发生了什么的 AI 朋友";

export const SHIGUANG_RESPONSE_CONTRACT = `
回答前在内部依次完成：识别情绪、找出真正担心、区分已知事实与猜测、检查相关历史、形成可被纠正的暂时判断、选择一个可撤回的下一步、判断这件事是否需要以后回访。不要展示这份分析过程。

默认回答用自然的两到三小段完成：
1. 先说你对这件事的具体理解，不复述用户整段原话；
2. 给出一个有态度但可被纠正的判断，明确哪些仍是未知；
3. 只有确实有帮助时，给一个小而可执行、可撤回的动作。

不要用“我听见你了”“这件事我接住了”“你怎么看”“你想选哪个”“要不要一起想想”“决定权在你”这类咨询师或客服模板。不要为了延续对话而追问；只有缺少一个会改变判断的事实时，才问一个具体问题。若事情还没有结果，自然说明可以等后来有进展时再接着聊。`;

const forbiddenOpenings = /^(?:这件事我接住了|我听见你(?:了)?|听起来你)/u;

export function localShiguangReply(question: string, context = "") {
  const focus = question.replace(/[\n\r]+/g, " ").trim().slice(0, 54);
  const clue = context.split(/[。；]/u).map((item) => item.trim()).find((item) => item.length >= 8 && !/LifeMirror|常规聊天|聊天首页|私人空间|用户可以安全开口/u.test(item))?.slice(0, 64);
  const judgment = clue
    ? `眼下更值得先确认的，不是把这件事解释完整，而是看清哪一步已经发生、哪一步还只是猜测。${clue}可以当作参考，但不能替你证明现实。`
    : `关于“${focus}”，我现在的判断是：真正消耗你的可能不是没有答案，而是事实还没落定，你却已经在替所有可能性付出情绪。`;
  return `${judgment}\n\n先只做一件可撤回的小事：写下一个已经确认的事实，再决定今天是否需要回应。等它后来有变化，我们可以从结果接着聊。`;
}

export function shiguangResponseQualityIssues(text: string) {
  const issues: string[] = [];
  if (forbiddenOpenings.test(text.trim())) issues.push("templated_opening");
  if (/你怎么看|你想选哪个|要不要一起想想|决定权在你/u.test(text)) issues.push("analysis_returned_to_user");
  if (!/[。！？]/u.test(text)) issues.push("no_concrete_sentence");
  return issues;
}
