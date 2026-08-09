import { ARENA_COMPETITIVE_FIELDS_V201 } from "./apostolic-arena-themes-v20";

export const SELECTED_FIELD_STORAGE_KEY_V203 = "apostolic-arena-selected-field-v20-3";

export type ArenaPresentationV203 = {
  id: string;
  name: string;
  subtitle: string;
  coverImage: string;
};

export const ARENA_PRESENTATIONS_V203: Record<string, ArenaPresentationV203> = {
  galilee: { id: "galilee", name: "Margens da Galileia", subtitle: "O chamado começa junto às águas", coverImage: "/games/apostolic-arena/arenas/v20-3/galilee.webp" },
  elah: { id: "elah", name: "Vale de Elá", subtitle: "Coragem diante do impossível", coverImage: "/games/apostolic-arena/arenas/v20-3/elah.webp" },
  exodus: { id: "exodus", name: "Deserto do Êxodo", subtitle: "Um caminho aberto pela fé", coverImage: "/games/apostolic-arena/arenas/v20-3/exodus.webp" },
  jericho: { id: "jericho", name: "Muralhas de Jericó", subtitle: "Os portões da cidade fortificada", coverImage: "/games/apostolic-arena/arenas/v20-3/jericho.webp" },
  gideon: { id: "gideon", name: "Acampamento de Gideão", subtitle: "Tochas acesas no vale", coverImage: "/games/apostolic-arena/arenas/v20-3/gideon.webp" },
  jerusalem: { id: "jerusalem", name: "Cidade de Davi", subtitle: "A batalha pelo reino", coverImage: "/games/apostolic-arena/arenas/v20-3/jerusalem.webp" },
  carmel: { id: "carmel", name: "Monte Carmelo", subtitle: "Fogo e tempestade sobre o altar", coverImage: "/games/apostolic-arena/arenas/v20-3/carmel.webp" },
  covenant: { id: "covenant", name: "Templo da Aliança", subtitle: "A arena celestial", coverImage: "/games/apostolic-arena/arenas/v20-3/covenant.webp" }
};

export function chooseRandomFieldV203(arenaId: string) {
  const fields = ARENA_COMPETITIVE_FIELDS_V201[arenaId] ?? ARENA_COMPETITIVE_FIELDS_V201.galilee!;
  let randomValue = Math.random();
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    randomValue = value[0]! / 4294967296;
  }
  const index = randomValue < .5 ? 0 : 1;
  const field = fields[index] ?? fields[0];
  return { index, field };
}
