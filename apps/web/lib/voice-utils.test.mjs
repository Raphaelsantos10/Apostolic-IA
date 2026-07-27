import assert from "node:assert/strict";
import test from "node:test";
import { clampSpeechRate, matchSpokenOption } from "./voice-utils.mjs";

test("reconhece uma opção pelo número falado", () => {
  assert.equal(matchSpokenOption("2", ["Fé", "Esperança", "Amor"]), 1);
});

test("reconhece uma opção pelo texto sem diferenciar maiúsculas", () => {
  assert.equal(matchSpokenOption("  AMOR ", ["Fé", "Esperança", "Amor"]), 2);
});

test("rejeita transcrição que não corresponde a uma opção", () => {
  assert.equal(matchSpokenOption("outra resposta", ["Fé", "Esperança"]), -1);
});

test("limita a velocidade de fala ao intervalo acessível", () => {
  assert.equal(clampSpeechRate(0.1), 0.5);
  assert.equal(clampSpeechRate(3), 2);
  assert.equal(clampSpeechRate(1.2), 1.2);
});
