import { ARENA_CARD_CATALOG } from "./apostolic-arena-card-catalog";

export const ARENA_PROGRESSION_KEY = "apostolic-arena-progression-v17";
export const ACTIVE_DECK_KEY = "apostolic-arena-active-deck";

export type ArenaCardProgress = { level: number; copies: number };
export type ArenaPlayerProgression = {
  version: 1;
  playerLevel: number;
  xp: number;
  trophies: number;
  gold: number;
  unlockedCardIds: number[];
  cards: Record<string, ArenaCardProgress>;
};

export const BIBLICAL_ARENAS = [
  { name: "Primeiro Chamado", trophies: 0, level: 1 },
  { name: "Vale do Carvalho", trophies: 200, level: 2 },
  { name: "Caminho do Êxodo", trophies: 500, level: 3 },
  { name: "Muralhas de Jericó", trophies: 900, level: 5 },
  { name: "Acampamento de Gideão", trophies: 1400, level: 7 },
  { name: "Reino de Jerusalém", trophies: 2100, level: 9 },
  { name: "Monte Carmelo", trophies: 3000, level: 11 },
  { name: "Arena da Aliança", trophies: 4200, level: 14 }
] as const;

export const arenaRequirementForCard = (cardId: number) => {
  const catalogIndex = Math.max(0, ARENA_CARD_CATALOG.findIndex((card) => card.id === cardId));
  const arenaIndex = Math.min(BIBLICAL_ARENAS.length - 1, Math.floor(catalogIndex / Math.ceil(ARENA_CARD_CATALOG.length / BIBLICAL_ARENAS.length)));
  return { arenaIndex, ...BIBLICAL_ARENAS[arenaIndex]! };
};

const readLegacyDeck = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ACTIVE_DECK_KEY) ?? "[]") as number[];
    const saved = JSON.parse(window.localStorage.getItem("apostolic-arena-decks-v16") ?? "{}") as Record<string, { ids?: number[] }>;
    const savedIds = Object.values(saved).flatMap((deck) => Array.isArray(deck.ids) ? deck.ids : []);
    return [...new Set([...(Array.isArray(parsed) ? parsed : []), ...savedIds])];
  } catch { return []; }
};

export function createInitialProgression(): ArenaPlayerProgression {
  const starterCards = [...ARENA_CARD_CATALOG.slice(0, 16).map((card) => card.id), 117];
  const migratedDeck = readLegacyDeck().filter((id) => ARENA_CARD_CATALOG.some((card) => card.id === id));
  const unlockedCardIds = [...new Set([...starterCards, ...migratedDeck])];
  return {
    version: 1,
    playerLevel: 1,
    xp: 0,
    trophies: 0,
    gold: 2500,
    unlockedCardIds,
    cards: Object.fromEntries(unlockedCardIds.map((id) => [String(id), { level: 1, copies: migratedDeck.includes(id) ? 5 : 10 }]))
  };
}

export function loadArenaProgression(): ArenaPlayerProgression {
  if (typeof window === "undefined") return { version: 1, playerLevel: 1, xp: 0, trophies: 0, gold: 2500, unlockedCardIds: [], cards: {} };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ARENA_PROGRESSION_KEY) ?? "null") as ArenaPlayerProgression | null;
    if (parsed?.version === 1 && Array.isArray(parsed.unlockedCardIds)) {
      if (!parsed.unlockedCardIds.includes(117)) {
        const migrated = { ...parsed, unlockedCardIds: [...parsed.unlockedCardIds, 117], cards: { ...parsed.cards, "117": parsed.cards["117"] ?? { level: 1, copies: 5 } } };
        saveArenaProgression(migrated);
        return migrated;
      }
      return parsed;
    }
  } catch { /* Create a safe initial progression below. */ }
  const initial = createInitialProgression();
  saveArenaProgression(initial);
  return initial;
}

export function saveArenaProgression(progression: ArenaPlayerProgression) {
  window.localStorage.setItem(ARENA_PROGRESSION_KEY, JSON.stringify(progression));
}

export const isCardUnlocked = (progression: ArenaPlayerProgression, cardId: number) => progression.unlockedCardIds.includes(cardId);

export const copiesRequiredForLevel = (level: number, rarity: string) => {
  const base = rarity === "champion" ? 2 : rarity === "legendary" ? 3 : rarity === "epic" ? 5 : rarity === "rare" ? 10 : 20;
  return base * Math.max(1, level);
};

export const goldRequiredForLevel = (level: number, rarity: string) => {
  const multiplier = rarity === "champion" ? 2.2 : rarity === "legendary" ? 1.8 : rarity === "epic" ? 1.45 : rarity === "rare" ? 1.2 : 1;
  return Math.round(250 * level * multiplier);
};
