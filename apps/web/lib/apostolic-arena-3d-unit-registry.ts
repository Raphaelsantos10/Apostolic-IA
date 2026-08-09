export type ArenaUnitAnimation = "idle" | "walk" | "attack" | "ability" | "hit" | "defeat";

export type ArenaUnitModelDefinition = {
  cardId: number;
  enabled: boolean;
  modelUrl: string;
  scale: number;
  rotationY: number;
  animations: Record<ArenaUnitAnimation, string[]>;
};

const STANDARD_ANIMATIONS: ArenaUnitModelDefinition["animations"] = {
  idle: ["Idle", "idle"],
  walk: ["Walk", "Walking", "walk"],
  attack: ["Attack", "Melee_Attack", "attack"],
  ability: ["Ability", "Spellcast", "ability"],
  hit: ["Hit", "Damage", "hit"],
  defeat: ["Death", "Defeat", "death"]
};

export const ARENA_3D_UNIT_MODELS: Record<number, ArenaUnitModelDefinition> = {
  117: { cardId: 117, enabled: false, modelUrl: "/games/apostolic-arena/characters/models/v15/117-moises.glb", scale: .82, rotationY: Math.PI, animations: STANDARD_ANIMATIONS },
  119: { cardId: 119, enabled: false, modelUrl: "/games/apostolic-arena/characters/models/v15/119-davi.glb", scale: .8, rotationY: Math.PI, animations: STANDARD_ANIMATIONS },
  121: { cardId: 121, enabled: false, modelUrl: "/games/apostolic-arena/characters/models/v15/121-sansao.glb", scale: .86, rotationY: Math.PI, animations: STANDARD_ANIMATIONS },
  125: { cardId: 125, enabled: false, modelUrl: "/games/apostolic-arena/characters/models/v15/125-debora.glb", scale: .8, rotationY: Math.PI, animations: STANDARD_ANIMATIONS }
};

export const arenaUnitModelFor = (cardId: number) => ARENA_3D_UNIT_MODELS[cardId];

