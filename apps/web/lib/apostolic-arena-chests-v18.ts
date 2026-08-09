import { ARENA_CARD_CATALOG } from "./apostolic-arena-card-catalog";
import { arenaRequirementForCard, loadArenaProgression, saveArenaProgression, type ArenaPlayerProgression } from "./apostolic-arena-progression-v17";

export const ARENA_CHESTS_KEY = "apostolic-arena-chests-v18";
export const ARENA_CHEST_CLAIMS_KEY_V207 = "apostolic-arena-chest-claims-v20-7";
export type ArenaChestKind = "wood" | "silver" | "gold" | "covenant";
export type ArenaChest = { id: string; kind: ArenaChestKind; earnedAt: number; openingStartedAt?: number; readyAt?: number };
export type ArenaChestState = { version: 1; slots: Array<ArenaChest | null>; victories: number };
export type ArenaChestReward = { chestKind: ArenaChestKind; gold: number; cards: Array<{ cardId: number; copies: number; newlyUnlocked: boolean }> };

export const CHEST_DEFINITIONS: Record<ArenaChestKind, { name: string; hours: number; gold: [number, number]; cardGroups: number; copies: [number, number] }> = {
  wood: { name: "Baú de Madeira", hours: 3, gold: [90, 150], cardGroups: 2, copies: [3, 7] },
  silver: { name: "Baú de Prata", hours: 8, gold: [180, 310], cardGroups: 3, copies: [5, 11] },
  gold: { name: "Baú de Ouro", hours: 12, gold: [350, 600], cardGroups: 4, copies: [8, 16] },
  covenant: { name: "Baú da Aliança", hours: 24, gold: [700, 1100], cardGroups: 5, copies: [12, 24] }
};

const emptyState = (): ArenaChestState => ({ version: 1, slots: [null, null, null, null], victories: 0 });
const randomBetween = ([minimum, maximum]: [number, number]) => minimum + Math.floor(Math.random() * (maximum - minimum + 1));
const rarityWeight = (rarity: string) => rarity === "champion" ? 2 : rarity === "legendary" ? 6 : rarity === "epic" ? 14 : rarity === "rare" ? 28 : 50;
const weightedCards = <T extends { rarity: string }>(pool: T[], amount: number) => {
  const remaining = [...pool];
  const selected: T[] = [];
  while (remaining.length && selected.length < amount) {
    const total = remaining.reduce((sum, card) => sum + rarityWeight(card.rarity), 0);
    let roll = Math.random() * total;
    const index = remaining.findIndex((card) => (roll -= rarityWeight(card.rarity)) <= 0);
    selected.push(remaining.splice(Math.max(0, index), 1)[0]!);
  }
  return selected;
};

export function loadArenaChests(): ArenaChestState {
  if (typeof window === "undefined") return emptyState();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ARENA_CHESTS_KEY) ?? "null") as ArenaChestState | null;
    if (parsed?.version === 1 && Array.isArray(parsed.slots)) return { ...parsed, slots: Array.from({ length: 4 }, (_, index) => parsed.slots[index] ?? null) };
  } catch { /* Fall through to a safe state. */ }
  return emptyState();
}

export function saveArenaChests(state: ArenaChestState) {
  window.localStorage.setItem(ARENA_CHESTS_KEY, JSON.stringify(state));
}

export function addVictoryChest(state: ArenaChestState) {
  const slot = state.slots.findIndex((chest) => chest === null);
  if (slot < 0) return { state, added: false as const };
  const victory = state.victories + 1;
  const kind: ArenaChestKind = victory % 10 === 0 ? "covenant" : victory % 5 === 0 ? "gold" : victory % 3 === 0 ? "silver" : "wood";
  const slots = [...state.slots];
  slots[slot] = { id: `${Date.now()}-${victory}`, kind, earnedAt: Date.now() };
  const next = { ...state, slots, victories: victory };
  saveArenaChests(next);
  return { state: next, added: true as const, slot, kind };
}

export function startOpeningChest(state: ArenaChestState, slot: number, quick = false) {
  const chest = state.slots[slot];
  if (!chest || chest.readyAt) return state;
  if (state.slots.some((entry) => entry?.readyAt && entry.readyAt > Date.now())) return state;
  const startedAt = Date.now();
  const readyAt = quick ? startedAt : startedAt + CHEST_DEFINITIONS[chest.kind].hours * 60 * 60 * 1000;
  const slots = [...state.slots];
  slots[slot] = { ...chest, openingStartedAt: startedAt, readyAt };
  const next = { ...state, slots };
  saveArenaChests(next);
  return next;
}

const eligibleCards = (progression: ArenaPlayerProgression) => ARENA_CARD_CATALOG.filter((card) => {
  const requirement = arenaRequirementForCard(card.id);
  return progression.trophies >= requirement.trophies && progression.playerLevel >= requirement.level;
});

export function claimChest(state: ArenaChestState, slot: number) {
  const chest = state.slots[slot];
  if (!chest?.readyAt || chest.readyAt > Date.now()) return null;
  const persisted = loadArenaChests().slots[slot];
  if (!persisted || persisted.id !== chest.id) return null;
  let claimedIds: string[] = [];
  try {
    const parsedClaims = JSON.parse(window.localStorage.getItem(ARENA_CHEST_CLAIMS_KEY_V207) ?? "[]") as unknown;
    claimedIds = Array.isArray(parsedClaims) ? parsedClaims.filter((id): id is string => typeof id === "string") : [];
  } catch { claimedIds = []; }
  if (claimedIds.includes(chest.id)) return null;
  window.localStorage.setItem(ARENA_CHEST_CLAIMS_KEY_V207, JSON.stringify([...claimedIds.slice(-99), chest.id]));
  const definition = CHEST_DEFINITIONS[chest.kind];
  const progression = loadArenaProgression();
  const pool = eligibleCards(progression);
  const chosen = weightedCards(pool, definition.cardGroups);
  const reward: ArenaChestReward = { chestKind: chest.kind, gold: randomBetween(definition.gold), cards: [] };
  const unlocked = new Set(progression.unlockedCardIds);
  const cards = { ...progression.cards };
  chosen.forEach((card) => {
    const newlyUnlocked = !unlocked.has(card.id);
    const copies = randomBetween(definition.copies);
    unlocked.add(card.id);
    const current = cards[String(card.id)] ?? { level: 1, copies: 0 };
    cards[String(card.id)] = { ...current, copies: current.copies + copies };
    reward.cards.push({ cardId: card.id, copies, newlyUnlocked });
  });
  saveArenaProgression({ ...progression, gold: progression.gold + reward.gold, unlockedCardIds: [...unlocked], cards });
  const slots = [...state.slots];
  slots[slot] = null;
  const next = { ...state, slots };
  saveArenaChests(next);
  return { state: next, reward };
}

export function grantBattleProgress(victory: boolean) {
  const progression = loadArenaProgression();
  const xp = progression.xp + (victory ? 20 : 5);
  const playerLevel = Math.min(14, Math.max(progression.playerLevel, 1 + Math.floor(xp / 100)));
  const nextProgression = { ...progression, playerLevel, gold: progression.gold + (victory ? 75 : 15), trophies: Math.max(0, progression.trophies + (victory ? 25 : -10)), xp };
  saveArenaProgression(nextProgression);
  return victory ? addVictoryChest(loadArenaChests()) : { state: loadArenaChests(), added: false as const };
}
