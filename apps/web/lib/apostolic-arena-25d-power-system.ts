export type Arena25DPowerKind = "warrior" | "ranged" | "guardian" | "healer" | "swarm" | "burst" | "champion";

export type Arena25DPowerProfile = {
  kind: Arena25DPowerKind;
  healthMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  rangeBonus: number;
  powerValue: number;
  label: string;
};

type PowerCard = { id: number; faith: number; type: string; rarity: string };

const includesAny = (value: string, words: string[]) => words.some((word) => value.includes(word));

export function arena25DPowerFor(card: PowerCard): Arena25DPowerProfile {
  const description = `${card.type} ${card.rarity}`.toLocaleLowerCase("pt");
  const rarityBonus = card.rarity === "champion" ? 1.28 : card.rarity === "legendary" ? 1.2 : card.rarity === "epic" ? 1.13 : card.rarity === "rare" ? 1.07 : 1;

  if (card.rarity === "champion" || [117, 119, 121, 125].includes(card.id)) {
    return { kind: "champion", healthMultiplier: 1.3, damageMultiplier: 1.22, speedMultiplier: 1, rangeBonus: .01, powerValue: 90 + card.faith * 18, label: "Poder de Campeão" };
  }
  if (includesAny(description, ["cura", "curador", "suporte", "sacerdote", "pastor", "levita"])) {
    return { kind: "healer", healthMultiplier: .9 * rarityBonus, damageMultiplier: .72, speedMultiplier: 1, rangeBonus: .035, powerValue: 45 + card.faith * 14, label: "Restauração" };
  }
  if (includesAny(description, ["arqueiro", "distância", "aérea", "atirador", "profeta", "mago"])) {
    return { kind: "ranged", healthMultiplier: .82 * rarityBonus, damageMultiplier: 1.12 * rarityBonus, speedMultiplier: 1, rangeBonus: .055, powerValue: 0, label: "Ataque à distância" };
  }
  if (includesAny(description, ["tanque", "guardião", "defensor", "construção", "estrutura", "escudeiro", "guarda"])) {
    return { kind: "guardian", healthMultiplier: 1.55 * rarityBonus, damageMultiplier: .82, speedMultiplier: .78, rangeBonus: 0, powerValue: .22, label: "Proteção" };
  }
  if (includesAny(description, ["enxame", "bando", "tropa", "esquadrão", "rebanho", "multidão"])) {
    return { kind: "swarm", healthMultiplier: .72 * rarityBonus, damageMultiplier: .88 * rarityBonus, speedMultiplier: 1.32, rangeBonus: 0, powerValue: 0, label: "Investida coletiva" };
  }
  if (includesAny(description, ["milagre", "efeito", "evento", "feitiço", "fogo", "raio", "vento"])) {
    return { kind: "burst", healthMultiplier: .88 * rarityBonus, damageMultiplier: 1.18 * rarityBonus, speedMultiplier: 1.05, rangeBonus: .02, powerValue: 24 + card.faith * 9, label: "Impacto em área" };
  }
  return { kind: "warrior", healthMultiplier: rarityBonus, damageMultiplier: rarityBonus, speedMultiplier: 1, rangeBonus: 0, powerValue: 0, label: "Combatente" };
}

