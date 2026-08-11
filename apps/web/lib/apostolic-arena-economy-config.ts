export const APOSTOLIC_ARENA_ECONOMY = {
  freeGems: { monthlyTarget: 80, monthlyHardCap: 120, weeklyTarget: 18 },
  chestSkip: { rare: 20, epic: 40, legendary: 60 },
  prices: { emoteMin: 60, skinRare: 180, skinEpic: 350, skinLegendary: 650, towerPremium: 500 }
} as const;

export type ArenaWallet = { coins: number; gems: number };

export type ArenaShopCategory = "featured" | "chests" | "skins" | "effects" | "pass" | "gems";

export type ArenaShopProduct = {
  id: string;
  category: ArenaShopCategory;
  name: string;
  subtitle: string;
  currency: "gems" | "money" | "coins";
  price: number;
  image: string;
  rarity: "rare" | "epic" | "legendary" | "premium";
  featured?: boolean;
  available?: boolean;
};
