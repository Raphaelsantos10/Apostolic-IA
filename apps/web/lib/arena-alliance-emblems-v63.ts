export type AllianceEmblemTier="free"|"gems"|"pro";
export type AllianceEmblem={id:string;name:string;image:string;tier:AllianceEmblemTier;price?:number};
const ROOT="/images/arena/alliance-emblems-v63";
export const ALLIANCE_EMBLEMS_V63:AllianceEmblem[]=[
 {id:"pomba-da-alianca",name:"Pomba da Aliança",image:`${ROOT}/pomba-da-alianca.webp`,tier:"free"},
 {id:"lampada-da-vigilia",name:"Lâmpada da Vigília",image:`${ROOT}/lampada-da-vigilia.webp`,tier:"free"},
 {id:"trigo-da-colheita",name:"Trigo da Colheita",image:`${ROOT}/trigo-da-colheita.webp`,tier:"free"},
 {id:"monte-da-promessa",name:"Monte da Promessa",image:`${ROOT}/monte-da-promessa.webp`,tier:"free"},
 {id:"leao-de-juda",name:"Leão de Judá",image:`${ROOT}/leao-de-juda.webp`,tier:"gems",price:500},
 {id:"arca-sobre-as-aguas",name:"Arca sobre as Águas",image:`${ROOT}/arca-sobre-as-aguas.webp`,tier:"gems",price:450},
 {id:"trombetas-de-jerico",name:"Trombetas de Jericó",image:`${ROOT}/trombetas-de-jerico.webp`,tier:"gems",price:550},
 {id:"fogo-do-carmelo",name:"Fogo do Carmelo",image:`${ROOT}/fogo-do-carmelo.webp`,tier:"gems",price:650},
 {id:"coroa-das-doze-estrelas",name:"Coroa das Doze Estrelas",image:`${ROOT}/coroa-das-doze-estrelas.webp`,tier:"pro"},
 {id:"portoes-de-safira",name:"Portões de Safira",image:`${ROOT}/portoes-de-safira.webp`,tier:"pro"},
 {id:"espada-dos-serafins",name:"Espada dos Serafins",image:`${ROOT}/espada-dos-serafins.webp`,tier:"pro"},
 {id:"selo-da-nova-alianca",name:"Selo da Nova Aliança",image:`${ROOT}/selo-da-nova-alianca.webp`,tier:"pro"}
];
export const DEFAULT_ALLIANCE_EMBLEM=ALLIANCE_EMBLEMS_V63[0]!;
export function allianceEmblemById(id?:string){return ALLIANCE_EMBLEMS_V63.find(item=>item.id===id)??DEFAULT_ALLIANCE_EMBLEM}
