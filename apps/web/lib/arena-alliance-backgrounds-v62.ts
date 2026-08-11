export type AllianceBackgroundTier="free"|"gems"|"level"|"pro";
export type AllianceBackground={id:string;name:string;image:string;tier:AllianceBackgroundTier;price?:number;requiredLevel?:number};

const ROOT="/images/arena/alliance-backgrounds-v62";
export const ALLIANCE_BACKGROUNDS_V62:AllianceBackground[]=[
 {id:"cidadela-dourada",name:"Cidadela Dourada",image:`${ROOT}/cidadela-dourada.webp`,tier:"free"},
 {id:"vale-dos-cedros",name:"Vale dos Cedros",image:`${ROOT}/vale-dos-cedros.webp`,tier:"free"},
 {id:"fortaleza-do-deserto",name:"Fortaleza do Deserto",image:`${ROOT}/fortaleza-do-deserto.webp`,tier:"free"},
 {id:"cidade-nas-nuvens",name:"Cidade nas Nuvens",image:`${ROOT}/cidade-nas-nuvens.webp`,tier:"free"},
 {id:"porto-de-tarsis",name:"Porto de Társis",image:`${ROOT}/porto-de-tarsis.webp`,tier:"gems",price:350},
 {id:"jardim-das-oliveiras",name:"Jardim das Oliveiras",image:`${ROOT}/jardim-das-oliveiras.webp`,tier:"gems",price:350},
 {id:"muralhas-de-neemias",name:"Muralhas de Neemias",image:`${ROOT}/muralhas-de-neemias.webp`,tier:"gems",price:450},
 {id:"fortaleza-de-gelo",name:"Fortaleza de Gelo",image:`${ROOT}/fortaleza-de-gelo.webp`,tier:"gems",price:450},
 {id:"monte-sinai",name:"Monte Sinai",image:`${ROOT}/monte-sinai.webp`,tier:"gems",price:550},
 {id:"refugio-do-jordao",name:"Refúgio do Jordão",image:`${ROOT}/refugio-do-jordao.webp`,tier:"gems",price:550},
 {id:"palacio-de-ester",name:"Palácio de Ester",image:`${ROOT}/palacio-de-ester.webp`,tier:"gems",price:650},
 {id:"torre-de-vigia",name:"Torre de Vigia",image:`${ROOT}/torre-de-vigia.webp`,tier:"gems",price:650},
 {id:"ruinas-da-alianca",name:"Ruínas da Aliança",image:`${ROOT}/ruinas-da-alianca.webp`,tier:"level",requiredLevel:3},
 {id:"oasis-de-en-gedi",name:"Oásis de En-Gedi",image:`${ROOT}/oasis-de-en-gedi.webp`,tier:"level",requiredLevel:6},
 {id:"cidade-de-safira",name:"Cidade de Safira",image:`${ROOT}/cidade-de-safira.webp`,tier:"level",requiredLevel:10},
 {id:"campos-de-belem",name:"Campos de Belém",image:`${ROOT}/campos-de-belem.webp`,tier:"level",requiredLevel:15},
 {id:"trono-de-leoes",name:"Trono de Leões",image:`${ROOT}/trono-de-leoes.webp`,tier:"pro"},
 {id:"vale-do-fogo",name:"Vale do Fogo",image:`${ROOT}/vale-do-fogo.webp`,tier:"pro"},
 {id:"biblioteca-de-salomao",name:"Biblioteca de Salomão",image:`${ROOT}/biblioteca-de-salomao.webp`,tier:"pro"},
 {id:"nova-jerusalem",name:"Nova Jerusalém",image:`${ROOT}/nova-jerusalem.webp`,tier:"pro"}
];

export const DEFAULT_ALLIANCE_BACKGROUND=ALLIANCE_BACKGROUNDS_V62[0]!;
export function allianceBackgroundById(id?:string){return ALLIANCE_BACKGROUNDS_V62.find(item=>item.id===id)??DEFAULT_ALLIANCE_BACKGROUND}
