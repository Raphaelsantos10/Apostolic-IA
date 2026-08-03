export type ArenaTerrainRule = {
  id: string;
  name: string;
  intervalSeconds?: number;
  durationSeconds?: number;
  effect: string;
  gameplay: string;
};

export type ApostolicArenaWorld = {
  id: number;
  name: string;
  era: string;
  trophyMin: number;
  trophyMax: number | null;
  unlockCards: number[];
  terrain: ArenaTerrainRule;
  status: "playable" | "planned";
  accent: string;
};

export const APOSTOLIC_ARENAS: ApostolicArenaWorld[] = [
  { id:1, name:"Vale do Carvalho", era:"Patriarcas", trophyMin:0, trophyMax:299, unlockCards:[1,2,3,4], status:"playable", accent:"#6fbe63", terrain:{id:"stable",name:"Terreno estável",effect:"Sem modificadores.",gameplay:"Aprendizagem das pontes, Fé e rotação do baralho."} },
  { id:2, name:"Campos de Belém", era:"Rute e os Juízes", trophyMin:300, trophyMax:599, unlockCards:[5,6], status:"planned", accent:"#e7b856", terrain:{id:"harvest",name:"Colheita abundante",intervalSeconds:45,durationSeconds:10,effect:"Zonas de provisão restauram tropas leves.",gameplay:"Incentiva disputa por território."} },
  { id:3, name:"Margens do Jordão", era:"Entrada em Canaã", trophyMin:600, trophyMax:899, unlockCards:[7,8], status:"planned", accent:"#48b9d6", terrain:{id:"river-opening",name:"Abertura do rio",intervalSeconds:60,durationSeconds:15,effect:"A água baixa e cria uma terceira via central.",gameplay:"Permite ataques surpresa e reposicionamento."} },
  { id:4, name:"Fortaleza de Sião", era:"Reino de Davi", trophyMin:900, trophyMax:1199, unlockCards:[9,10], status:"planned", accent:"#ad85da", terrain:{id:"high-ground",name:"Terreno elevado",effect:"Unidades nas laterais recebem visão adicional.",gameplay:"Valoriza tropas de alcance e defesa."} },
  { id:5, name:"Muralhas de Jericó", era:"Conquista", trophyMin:1200, trophyMax:1599, unlockCards:[11,12], status:"planned", accent:"#d98553", terrain:{id:"earthquake",name:"Tremores de terra",intervalSeconds:50,effect:"Estruturas estáticas sofrem dano leve periódico.",gameplay:"Evita defesas totalmente imóveis."} },
  { id:6, name:"Planícies de Gideão", era:"Juízes", trophyMin:1600, trophyMax:1999, unlockCards:[13,14], status:"planned", accent:"#d1a547", terrain:{id:"night-watch",name:"Vigília noturna",intervalSeconds:55,durationSeconds:12,effect:"A arena escurece e tropas próximas ganham percepção.",gameplay:"Favorece formações compactas."} },
  { id:7, name:"Deserto do Sinai", era:"Êxodo", trophyMin:2000, trophyMax:2399, unlockCards:[15,16], status:"planned", accent:"#dfad63", terrain:{id:"sandstorm",name:"Tempestade de areia",intervalSeconds:45,durationSeconds:12,effect:"Alcance das tropas à distância diminui 40%.",gameplay:"Abre janelas para avanços corpo a corpo."} },
  { id:8, name:"Jardins de Salomão", era:"Reino Unido", trophyMin:2400, trophyMax:2799, unlockCards:[17,18], status:"planned", accent:"#56bf91", terrain:{id:"wisdom-wells",name:"Fontes de sabedoria",intervalSeconds:40,durationSeconds:8,effect:"Uma fonte reduz temporariamente o custo da próxima carta.",gameplay:"Premia controle e planejamento."} },
  { id:9, name:"Monte Carmelo", era:"Profetas", trophyMin:2800, trophyMax:3299, unlockCards:[19,20], status:"planned", accent:"#ef7654", terrain:{id:"sky-fire",name:"Fogo do céu",intervalSeconds:50,effect:"Uma área densa é marcada antes da queda de um relâmpago.",gameplay:"Exige dispersão após o aviso visual."} },
  { id:10, name:"Caminho de Damasco", era:"Igreja Primitiva", trophyMin:3300, trophyMax:3799, unlockCards:[], status:"planned", accent:"#78b8ff", terrain:{id:"revelation-light",name:"Luz reveladora",intervalSeconds:60,durationSeconds:10,effect:"Revela armadilhas e remove camuflagem.",gameplay:"Altera o momento ideal de cartas furtivas."} },
  { id:11, name:"Ilha de Patmos", era:"Apocalipse", trophyMin:3800, trophyMax:4299, unlockCards:[], status:"planned", accent:"#9a78dd", terrain:{id:"visions",name:"Ondas de visão",intervalSeconds:45,durationSeconds:9,effect:"A próxima carta do rival aparece por alguns segundos.",gameplay:"Permite antecipar e responder ao ciclo."} },
  { id:12, name:"Vale do Armagedom", era:"Arena Suprema", trophyMin:4300, trophyMax:null, unlockCards:[], status:"planned", accent:"#db596a", terrain:{id:"relic-war",name:"Guerra de relíquias",effect:"Ambos regeneram Fé 20% mais rapidamente.",gameplay:"Partidas finais intensas e de ciclo acelerado."} }
];

export const DAILY_EVENTS = [
  { id:"mana-rain", name:"Chuva de Maná", effect:"A próxima carta de cada jogador custa 1 Fé a menos.", duration:"Primeiros 30s" },
  { id:"sand-wind", name:"Vento do Deserto", effect:"Tropas de distância perdem 20% de alcance.", duration:"15s a cada minuto" },
  { id:"peace", name:"Momento de Paz", effect:"Torres pausam o ataque por 5 segundos.", duration:"Uma vez na partida" },
  { id:"double-study", name:"Sabedoria em Dobro", effect:"Vitórias também concedem pontos de estudo.", duration:"Durante 24 horas" }
] as const;

export const GOLIATH_RAID = {
  id:"goliath-colossal",
  name:"Golias Colossal",
  mode:"Raid cooperativa",
  players:"2–4 jogadores",
  status:"planned" as const,
  health:12000,
  stagger:100,
  weakPoint:"Lança colossal",
  phases:[
    { threshold:"100%–50%", name:"Desafio no vale", attacks:["Golpe de lança nas duas vias","Pisão esmagador com zona vermelha de 2s"], summons:[] },
    { threshold:"50%–0%", name:"Escudo de bronze", attacks:["Pedra contra a torre com contagem regressiva","Pisão em sequência"], summons:["3 hordas de arqueiros filisteus"] }
  ],
  systems:[
    "Zona vermelha anuncia ataques devastadores com 2 segundos de antecedência.",
    "Trombetas e ataques de impacto enchem a barra de quebra.",
    "Ao quebrar a postura, Golias fica atordoado por 5 segundos e recebe dano dobrado.",
    "Destruir a lança reduz o dano dos ataques no restante da Raid."
  ]
};

export function arenaForTrophies(trophies: number) {
  return [...APOSTOLIC_ARENAS].reverse().find((arena) => trophies >= arena.trophyMin) ?? APOSTOLIC_ARENAS[0];
}

export function dailyEventFor(date: Date) {
  const dayKey = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
  return DAILY_EVENTS[Math.abs(dayKey) % DAILY_EVENTS.length];
}
