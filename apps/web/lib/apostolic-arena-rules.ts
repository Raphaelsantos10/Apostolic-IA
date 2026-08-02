export type ArenaRarity = "common" | "rare" | "epic" | "legendary" | "champion";
export type ArenaCardType = "troop" | "spell" | "building";
export type ArenaTarget = "ground" | "air" | "both" | "buildings" | "none";
export type ArenaMovement = "static" | "slow" | "medium" | "fast" | "very_fast";

export type ArenaCardDefinition = {
  id: string; name: string; rarity: ArenaRarity; type: ArenaCardType; faithCost: number;
  description: string; biblicalReference: string; hitPoints: number | null; damage: number | null;
  hitSpeedSeconds: number | null; dps: number | null; target: ArenaTarget; rangeTiles: number | null;
  movement: ArenaMovement; deploySeconds: number; durationSeconds?: number; units?: number; specialAbility?: string;
};

export const ARENA_MATCH_RULES = {
  normalSeconds: 180, overtimeSeconds: 60, maximumFaith: 10, startingFaith: 10,
  normalRegenerationMs: 2_800, doubleRegenerationMs: 1_400, overtimeRegenerationMs: 900,
  defaultDeployMs: 1_000, deckSize: 8, handSize: 4
} as const;

export function calculateDps(damage: number | null, hitSpeedSeconds: number | null) {
  if (!damage || !hitSpeedSeconds) return null;
  return Math.round((damage / hitSpeedSeconds) * 10) / 10;
}
export function faithRegenerationMs(secondsRemaining: number, overtime: boolean) {
  if (overtime) return ARENA_MATCH_RULES.overtimeRegenerationMs;
  return secondsRemaining <= 60 ? ARENA_MATCH_RULES.doubleRegenerationMs : ARENA_MATCH_RULES.normalRegenerationMs;
}
export function upgradedStat(base: number, level: number) { return Math.round(base * 1.1 ** Math.max(0, level - 1)); }
export function trophyChange(won: boolean) { return won ? 30 : -20; }
const card = (definition: Omit<ArenaCardDefinition, "dps">): ArenaCardDefinition => ({ ...definition, dps: calculateDps(definition.damage, definition.hitSpeedSeconds) });

export const APOSTOLIC_ARENA_CARDS: ArenaCardDefinition[] = [
  card({ id:"davi-funda", name:"Davi e a Funda", rarity:"common", type:"troop", faithCost:2, description:"Pequeno no campo, enorme quando aparece um tanque.", biblicalReference:"1 Samuel 17", hitPoints:260, damage:104, hitSpeedSeconds:1.1, target:"both", rangeTiles:5.5, movement:"fast", deploySeconds:1, specialAbility:"Dano crítico contra unidades tanque." }),
  card({ id:"soldados-israel", name:"Soldados de Israel", rarity:"common", type:"troop", faithCost:3, description:"Três companheiros; ninguém guarda a ponte sozinho.", biblicalReference:"1 Samuel 17:52", hitPoints:690, damage:160, hitSpeedSeconds:1.2, target:"ground", rangeTiles:.8, movement:"medium", deploySeconds:1, units:3 }),
  card({ id:"guerreiro-filisteu", name:"Guerreiro Filisteu", rarity:"rare", type:"troop", faithCost:5, description:"Vai direto ao objetivo e não se distrai.", biblicalReference:"1 Samuel 17:4-7", hitPoints:3180, damage:220, hitSpeedSeconds:1.6, target:"buildings", rangeTiles:.8, movement:"slow", deploySeconds:1.2 }),
  card({ id:"trezentos-gideao", name:"Os Trezentos de Gideão", rarity:"epic", type:"troop", faithCost:4, description:"Poucos, atentos e surpreendentemente barulhentos.", biblicalReference:"Juízes 7", hitPoints:455, damage:128, hitSpeedSeconds:1, target:"ground", rangeTiles:.8, movement:"fast", deploySeconds:1, units:3 }),
  card({ id:"muralha-neemias", name:"Muralha de Neemias", rarity:"common", type:"building", faithCost:3, description:"Reconstruída depressa; reclamações ficam do lado de fora.", biblicalReference:"Neemias 4:6", hitPoints:1420, damage:null, hitSpeedSeconds:null, target:"none", rangeTiles:null, movement:"static", deploySeconds:1, durationSeconds:30 }),
  card({ id:"abrigo-arca", name:"Abrigo da Arca", rarity:"epic", type:"building", faithCost:5, description:"Proteção e reforços chegando de dois em dois.", biblicalReference:"Génesis 7", hitPoints:1260, damage:null, hitSpeedSeconds:null, target:"none", rangeTiles:null, movement:"static", deploySeconds:1, durationSeconds:30, specialAbility:"Envia apoio a cada 4,5 segundos." }),
  card({ id:"trombetas-jerico", name:"Trombetas de Jericó", rarity:"epic", type:"spell", faithCost:4, description:"O som passa; a estrutura reconsidera as escolhas.", biblicalReference:"Josué 6", hitPoints:null, damage:470, hitSpeedSeconds:null, target:"buildings", rangeTiles:3.5, movement:"static", deploySeconds:.4 }),
  card({ id:"resposta-carmelo", name:"Resposta no Carmelo", rarity:"legendary", type:"spell", faithCost:6, description:"Uma resposta decisiva em área, usada com responsabilidade.", biblicalReference:"1 Reis 18:36-39", hitPoints:null, damage:840, hitSpeedSeconds:null, target:"both", rangeTiles:2.5, movement:"static", deploySeconds:.5 }),
  card({ id:"sansao", name:"Sansão", rarity:"legendary", type:"troop", faithCost:6, description:"Ataque lento; impacto impossível de ignorar.", biblicalReference:"Juízes 15", hitPoints:2180, damage:315, hitSpeedSeconds:1.4, target:"ground", rangeTiles:.8, movement:"medium", deploySeconds:1.2 }),
  card({ id:"lideranca-moises", name:"Liderança de Moisés", rarity:"legendary", type:"troop", faithCost:5, description:"Abre espaço para o povo avançar sem perder a direção.", biblicalReference:"Êxodo 14", hitPoints:840, damage:135, hitSpeedSeconds:1.6, target:"both", rangeTiles:5, movement:"slow", deploySeconds:1, specialAbility:"Ao entrar, afasta unidades próximas." })
];
