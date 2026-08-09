import { ARENA_CARD_CATALOG } from "./apostolic-arena-card-catalog";
import { arenaRequirementForCard, BIBLICAL_ARENAS, loadArenaProgression, saveArenaProgression, type ArenaPlayerProgression } from "./apostolic-arena-progression-v17";

export const ARENA_JOURNEY_KEY = "apostolic-arena-journey-v19";
export type ArenaJourneyState = { version: 1; claimedArenaRewards: number[] };
export type ArenaJourneyReward = { arenaIndex: number; gold: number; copies: number; cardId: number };

export const CARDS_BY_ARENA = BIBLICAL_ARENAS.map((_, arenaIndex) => ARENA_CARD_CATALOG.filter((card) => arenaRequirementForCard(card.id).arenaIndex === arenaIndex));
export const ARENA_JOURNEY_REWARDS: ArenaJourneyReward[] = BIBLICAL_ARENAS.map((_, arenaIndex) => ({
  arenaIndex,
  gold: 300 + arenaIndex * 225,
  copies: 8 + arenaIndex * 2,
  cardId: CARDS_BY_ARENA[arenaIndex]?.[0]?.id ?? ARENA_CARD_CATALOG[0]!.id
}));

export function loadArenaJourney(): ArenaJourneyState {
  if (typeof window === "undefined") return { version: 1, claimedArenaRewards: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ARENA_JOURNEY_KEY) ?? "null") as ArenaJourneyState | null;
    if (parsed?.version === 1 && Array.isArray(parsed.claimedArenaRewards)) return parsed;
  } catch { /* Use the safe state below. */ }
  return { version: 1, claimedArenaRewards: [] };
}

export function saveArenaJourney(state: ArenaJourneyState) {
  window.localStorage.setItem(ARENA_JOURNEY_KEY, JSON.stringify(state));
}

export function collectArenaJourneyReward(arenaIndex: number) {
  const journey = loadArenaJourney();
  const progression = loadArenaProgression();
  const arena = BIBLICAL_ARENAS[arenaIndex];
  const reward = ARENA_JOURNEY_REWARDS[arenaIndex];
  if (!arena || !reward || journey.claimedArenaRewards.includes(arenaIndex) || progression.trophies < arena.trophies || progression.playerLevel < arena.level) return null;
  const unlocked = new Set(progression.unlockedCardIds);
  unlocked.add(reward.cardId);
  const currentCard = progression.cards[String(reward.cardId)] ?? { level: 1, copies: 0 };
  const nextProgression: ArenaPlayerProgression = {
    ...progression,
    gold: progression.gold + reward.gold,
    unlockedCardIds: [...unlocked],
    cards: { ...progression.cards, [String(reward.cardId)]: { ...currentCard, copies: currentCard.copies + reward.copies } }
  };
  const nextJourney = { ...journey, claimedArenaRewards: [...journey.claimedArenaRewards, arenaIndex] };
  saveArenaProgression(nextProgression);
  saveArenaJourney(nextJourney);
  return { progression: nextProgression, journey: nextJourney, reward };
}
