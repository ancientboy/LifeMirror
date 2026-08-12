import assert from "node:assert/strict";
import test from "node:test";
import { initialConversationMode } from "./conversation-mode.js";

test("ordinary conversation is the default home mode", () => {
  assert.equal(initialConversationMode(""), "general");
  assert.equal(initialConversationMode("?guest=1"), "general");
  assert.equal(initialConversationMode("?continue=%E6%88%91%E6%83%B3%E8%81%8A%E8%81%8A%E4%BB%96"), "general");
});

test("relationship mode requires an explicit entry action", () => {
  assert.equal(initialConversationMode("?scene=relationship"), "relationship");
  assert.equal(initialConversationMode("?scene=general"), "general");
  assert.equal(initialConversationMode("?scene=relationship", false), "general");
});
