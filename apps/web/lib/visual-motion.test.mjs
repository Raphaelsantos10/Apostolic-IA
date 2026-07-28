import assert from "node:assert/strict";
import test from "node:test";
import { resolveMotionMode } from "./visual-motion.mjs";

test("movimento enriquecido fica desativado por padrão", () => {
  assert.equal(resolveMotionMode(undefined), "standard");
  assert.equal(resolveMotionMode("false"), "standard");
  assert.equal(resolveMotionMode("0"), "standard");
});

test("movimento enriquecido exige ativação explícita", () => {
  assert.equal(resolveMotionMode("true"), "enhanced");
  assert.equal(resolveMotionMode(" ON "), "enhanced");
  assert.equal(resolveMotionMode("1"), "enhanced");
});
