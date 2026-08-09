import assert from "node:assert/strict";
import test from "node:test";
import { acceptConversationMemory } from "./conversation-gate.js";

test("conversation memory accepts only an explicit remember request", () => {
  assert.deepEqual(acceptConversationMemory("请记住：我不喜欢连续追问"), { text: "我不喜欢连续追问", kind: "explicit_memory" });
  assert.equal(acceptConversationMemory("我今天有点累，想先聊聊"), null);
});

test("conversation memory treats stated communication preferences as high-priority facts", () => {
  assert.deepEqual(acceptConversationMemory("我喜欢直接结论，不要鸡汤"), { text: "我喜欢直接结论，不要鸡汤", kind: "communication_preference" });
  assert.deepEqual(acceptConversationMemory("后来证实：那个合作已经取消"), { text: "那个合作已经取消", kind: "confirmed_event" });
});
