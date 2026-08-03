export type ArenaCatalogCard = {
  id: number; slug: string; name: string; rarity: "common" | "rare" | "epic" | "legendary" | "champion";
  faith: number; type: string; hp: string; damage: string; dps: string; range: string; speed: string;
  description: string; portrait: string;
};

const commonArt = (id: number, slug: string) => `/games/apostolic-arena/cards/art/common/${String(id).padStart(3, "0")}-${slug}-v1.webp`;

export const ARENA_CARD_CATALOG: ArenaCatalogCard[] = [
  { id:1, slug:"davi-e-a-funda", name:"Davi e a Funda", rarity:"common", faith:2, type:"Tropa terrestre", hp:"320", damage:"90", dps:"75", range:"5,5 tiles", speed:"Rápida", description:"Jovem pastor corajoso que ataca à distância com sua funda de precisão.", portrait:commonArt(1,"davi-e-a-funda") },
  { id:2, slug:"soldados-de-israel", name:"Soldados de Israel", rarity:"common", faith:3, type:"Horda (4)", hp:"150 ×4", damage:"65", dps:"65", range:"Corpo a corpo", speed:"Média", description:"Esquadrão leal com lanças e escudos para contenção estratégica.", portrait:commonArt(2,"soldados-de-israel") },
  { id:3, slug:"pomba-da-paz", name:"Pomba da Paz", rarity:"common", faith:1, type:"Tropa aérea", hp:"90", damage:"35", dps:"40", range:"3,5 tiles", speed:"Muito rápida", description:"Unidade voadora de ciclo rápido para distração e patrulha.", portrait:commonArt(3,"pomba-da-paz") },
  { id:4, slug:"bando-de-pombas", name:"Bando de Pombas", rarity:"common", faith:2, type:"Horda aérea (4)", hp:"80 ×4", damage:"30", dps:"35", range:"3 tiles", speed:"Muito rápida", description:"Grupo aéreo de ciclo rápido para distrair tropas de distância.", portrait:commonArt(4,"bando-de-pombas") },
  { id:5, slug:"arqueiros-de-juda", name:"Arqueiros de Judá", rarity:"common", faith:3, type:"Tropa (2)", hp:"210 ×2", damage:"85", dps:"70", range:"5 tiles", speed:"Média", description:"Dupla de atiradores para suporte defensivo terrestre e aéreo.", portrait:commonArt(5,"arqueiros-de-juda") },
  { id:6, slug:"bando-de-ovelhas", name:"Bando de Ovelhas", rarity:"common", faith:2, type:"Horda (6)", hp:"60 ×6", damage:"20", dps:"25", range:"Corpo a corpo", speed:"Rápida", description:"Grupo frágil e numeroso que ajuda a conter ataques pesados.", portrait:commonArt(6,"bando-de-ovelhas") },
  { id:7, slug:"guardas-de-jerusalem", name:"Guardas de Jerusalém", rarity:"common", faith:3, type:"Tropa (2)", hp:"300 ×2", damage:"95", dps:"80", range:"Corpo a corpo longo", speed:"Média", description:"Lanceiros de elite com escudos e estocada longa.", portrait:commonArt(7,"guardas-de-jerusalem") },
  { id:8, slug:"codornizes-do-deserto", name:"Codornizes do Deserto", rarity:"common", faith:2, type:"Aérea / Suporte", hp:"110", damage:"25", dps:"20", range:"Corpo a corpo", speed:"Rápida", description:"Ao serem derrotadas, deixam suprimento restaurador para aliados.", portrait:commonArt(8,"codornizes-do-deserto") },
  { id:9, slug:"fundibularios-de-benjamim", name:"Fundibulários de Benjamim", rarity:"common", faith:3, type:"Tropa (2)", hp:"180 ×2", damage:"75", dps:"90", range:"4,5 tiles", speed:"Rápida", description:"Atiradores ambidestros com cadência dupla de disparo.", portrait:commonArt(9,"fundibularios-de-benjamim") },
  { id:10, slug:"guardas-do-templo", name:"Guardas do Templo", rarity:"common", faith:3, type:"Tropa terrestre", hp:"450", damage:"110", dps:"85", range:"Corpo a corpo", speed:"Lenta", description:"Sentinela rígida com boa resistência contra tropas leves.", portrait:commonArt(10,"guardas-do-templo") }
];
