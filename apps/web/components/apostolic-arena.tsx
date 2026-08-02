"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Lane = "left" | "right";
type Side = "player" | "enemy";
type Card = {
  id: string;
  name: string;
  cost: number;
  power: number;
  icon: string;
  tone: string;
  description: string;
  kind: "attack" | "heal" | "shield";
};
type Unit = Card & { unitId: number; lane: Lane; side: Side };
type MatchState = "intro" | "playing" | "won" | "lost" | "draw";

const cards: Card[] = [
  { id: "coragem", name: "Coragem", cost: 3, power: 9, icon: "🛡️", tone: "blue", description: "Avança com firmeza", kind: "attack" },
  { id: "sabedoria", name: "Sabedoria", cost: 2, power: 6, icon: "📜", tone: "violet", description: "Ataque rápido", kind: "attack" },
  { id: "servico", name: "Serviço", cost: 4, power: 13, icon: "🤲", tone: "gold", description: "Ajuda poderosa", kind: "attack" },
  { id: "esperanca", name: "Esperança", cost: 3, power: 10, icon: "⭐", tone: "teal", description: "Restaura o templo", kind: "heal" },
  { id: "unidade", name: "Unidade", cost: 5, power: 17, icon: "👥", tone: "rose", description: "Força em conjunto", kind: "attack" },
  { id: "perseveranca", name: "Perseverança", cost: 4, power: 12, icon: "🔥", tone: "orange", description: "Não recua", kind: "attack" },
  { id: "paz", name: "Paz", cost: 3, power: 8, icon: "🕊️", tone: "sky", description: "Protege por instantes", kind: "shield" },
  { id: "verdade", name: "Verdade", cost: 5, power: 16, icon: "⚔️", tone: "indigo", description: "Impacto certeiro", kind: "attack" }
];

const initialMessage = "Escolha uma carta e depois toque numa das duas rotas.";

export function ApostolicArena() {
  const [state, setState] = useState<MatchState>("intro");
  const [faith, setFaith] = useState(6);
  const [enemyFaith, setEnemyFaith] = useState(6);
  const [playerLife, setPlayerLife] = useState(100);
  const [enemyLife, setEnemyLife] = useState(100);
  const [playerShield, setPlayerShield] = useState(0);
  const [enemyShield, setEnemyShield] = useState(0);
  const [seconds, setSeconds] = useState(180);
  const [selected, setSelected] = useState<Card | null>(null);
  const [handOffset, setHandOffset] = useState(0);
  const [units, setUnits] = useState<Unit[]>([]);
  const [message, setMessage] = useState(initialMessage);
  const arenaRef = useRef<HTMLElement>(null);
  const unitCounter = useRef(0);
  const enemyFaithRef = useRef(6);
  const playerShieldRef = useRef(0);
  const enemyShieldRef = useRef(0);

  const hand = Array.from({ length: 4 }, (_, index) => cards[(handOffset + index) % cards.length] as Card);

  const finish = useCallback((next: Exclude<MatchState, "intro" | "playing">) => {
    setState(next);
    setSelected(null);
    setMessage(next === "won" ? "Excelente! A sua estratégia protegeu o Templo da Luz." : next === "lost" ? "Boa tentativa. Reveja o tempo das cartas e experimente novamente." : "Equilíbrio perfeito. Uma nova estratégia pode decidir a próxima partida.");
  }, []);

  const resolveCard = useCallback((card: Card, side: Side) => {
    const ownLife = side === "player" ? setPlayerLife : setEnemyLife;
    const opponentLife = side === "player" ? setEnemyLife : setPlayerLife;
    const ownShield = side === "player" ? setPlayerShield : setEnemyShield;
    if (card.kind === "heal") {
      ownLife((life) => Math.min(100, life + card.power));
      return;
    }
    if (card.kind === "shield") {
      ownShield((shield) => {
        const next = Math.min(24, shield + card.power);
        if (side === "player") playerShieldRef.current = next;
        else enemyShieldRef.current = next;
        return next;
      });
      return;
    }
    const shieldRef = side === "player" ? enemyShieldRef : playerShieldRef;
    const absorbed = Math.min(shieldRef.current, card.power);
    shieldRef.current = Math.max(0, shieldRef.current - absorbed);
    if (side === "player") setEnemyShield(shieldRef.current);
    else setPlayerShield(shieldRef.current);
    opponentLife((life) => Math.max(0, life - (card.power - absorbed)));
  }, []);

  const deploy = useCallback((card: Card, lane: Lane, side: Side) => {
    const unitId = ++unitCounter.current;
    setUnits((current) => [...current, { ...card, unitId, lane, side }]);
    window.setTimeout(() => {
      resolveCard(card, side);
      setUnits((current) => current.filter((unit) => unit.unitId !== unitId));
    }, 1900);
  }, [resolveCard]);

  const playCard = (lane: Lane) => {
    if (state !== "playing" || !selected) return;
    if (faith < selected.cost) {
      setMessage("Ainda não há Fé suficiente para esta carta.");
      return;
    }
    setFaith((value) => value - selected.cost);
    deploy(selected, lane, "player");
    setMessage(`${selected.name} entrou pela rota ${lane === "left" ? "do Vale" : "das Muralhas"}.`);
    setHandOffset((offset) => (offset + 1) % cards.length);
    setSelected(null);
  };

  const start = () => {
    setFaith(6); setEnemyFaith(6); setPlayerLife(100); setEnemyLife(100);
    setPlayerShield(0); setEnemyShield(0); setSeconds(180); setUnits([]);
    enemyFaithRef.current = 6; playerShieldRef.current = 0; enemyShieldRef.current = 0;
    setHandOffset(0); setSelected(null); setMessage(initialMessage); setState("playing");
  };

  useEffect(() => {
    if (state !== "playing") return;
    const clock = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    const recharge = window.setInterval(() => {
      setFaith((value) => Math.min(10, value + 1));
      setEnemyFaith((value) => Math.min(10, value + 1));
    }, 1200);
    return () => { window.clearInterval(clock); window.clearInterval(recharge); };
  }, [state]);

  useEffect(() => { enemyFaithRef.current = enemyFaith; }, [enemyFaith]);
  useEffect(() => { playerShieldRef.current = playerShield; }, [playerShield]);
  useEffect(() => { enemyShieldRef.current = enemyShield; }, [enemyShield]);

  useEffect(() => {
    if (state !== "playing") return;
    const ai = window.setInterval(() => {
      const affordable = cards.filter((card) => card.cost <= enemyFaithRef.current);
      const card = affordable[Math.floor(Math.random() * affordable.length)];
      if (!card) return;
      enemyFaithRef.current -= card.cost;
      setEnemyFaith(enemyFaithRef.current);
      deploy(card, Math.random() > 0.5 ? "left" : "right", "enemy");
    }, 2600);
    return () => window.clearInterval(ai);
  }, [deploy, state]);

  useEffect(() => {
    if (state !== "playing") return;
    if (enemyLife <= 0) finish("won");
    else if (playerLife <= 0) finish("lost");
    else if (seconds <= 0) finish(playerLife === enemyLife ? "draw" : playerLife > enemyLife ? "won" : "lost");
  }, [enemyLife, finish, playerLife, seconds, state]);

  const requestFullscreen = () => {
    if (!document.fullscreenElement) void arenaRef.current?.requestFullscreen();
    else void document.exitFullscreen();
  };

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <section className="apostolic-arena" ref={arenaRef} aria-label="Apostolic Arena">
      <header className="arena-topbar">
        <div><p className="eyebrow">Vale do Começo</p><h2>Apostolic Arena</h2></div>
        <div className="arena-clock" aria-label={`${time} restantes`}>{time}</div>
        <button type="button" className="arena-fullscreen" onClick={requestFullscreen}>⛶ <span>Tela cheia</span></button>
      </header>

      <div className="arena-guide" role="status">
        <div className="barnabas-avatar" aria-hidden="true"><span>Б</span></div>
        <div><strong>Barnabé, seu treinador</strong><p>{message}</p></div>
      </div>

      <div className="arena-board">
        <Temple side="enemy" life={enemyLife} shield={enemyShield} />
        <div className="arena-routes">
          {(["left", "right"] as const).map((lane) => (
            <button key={lane} type="button" className={`arena-lane arena-lane--${lane}`} onClick={() => playCard(lane)} aria-label={`Jogar na rota ${lane === "left" ? "do Vale" : "das Muralhas"}`}>
              <span className="lane-name">{lane === "left" ? "Rota do Vale" : "Rota das Muralhas"}</span>
              <span className="lane-river" />
              {units.filter((unit) => unit.lane === lane).map((unit) => (
                <span className={`arena-unit arena-unit--${unit.side} card-tone--${unit.tone}`} key={unit.unitId} title={unit.name}>{unit.icon}</span>
              ))}
              {selected && <span className="deploy-hint">Invocar {selected.name}</span>}
            </button>
          ))}
        </div>
        <Temple side="player" life={playerLife} shield={playerShield} />
      </div>

      <div className="faith-meter" aria-label={`${faith} de 10 pontos de Fé`}>
        <strong>Fé</strong><div><span style={{ width: `${faith * 10}%` }} /></div><b>{faith}/10</b>
      </div>

      <div className="arena-hand" aria-label="Cartas disponíveis">
        {hand.map((card) => (
          <button key={card.id} type="button" disabled={state !== "playing"} onClick={() => setSelected(card)} className={`arena-card card-tone--${card.tone}${selected?.id === card.id ? " is-selected" : ""}${faith < card.cost ? " is-expensive" : ""}`}>
            <span className="card-cost">{card.cost}</span><span className="card-icon" aria-hidden="true">{card.icon}</span><strong>{card.name}</strong><small>{card.description}</small>
          </button>
        ))}
        <div className="next-card"><small>Próxima</small><span>{cards[(handOffset + 4) % cards.length]?.icon}</span></div>
      </div>

      {state !== "playing" && (
        <div className="arena-overlay">
          <div className="arena-dialog">
            <span className="arena-dialog__crest" aria-hidden="true">A</span>
            <p className="eyebrow">{state === "intro" ? "Primeiro treino" : "Partida concluída"}</p>
            <h2>{state === "intro" ? "Proteja o Templo da Luz" : state === "won" ? "Vitória!" : state === "lost" ? "Continue a jornada" : "Empate"}</h2>
            <p>{state === "intro" ? "Use Fé para lançar virtudes nas duas rotas. Vença o treino reduzindo a resistência do outro templo antes do tempo terminar." : message}</p>
            <button className="button button-primary" type="button" onClick={start}>{state === "intro" ? "Começar treino" : "Jogar novamente"}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function Temple({ side, life, shield }: Readonly<{ side: Side; life: number; shield: number }>) {
  return (
    <div className={`arena-temple arena-temple--${side}`}>
      <span aria-hidden="true">⌂</span>
      <div><strong>{side === "player" ? "Seu Templo" : "Templo de treino"}</strong><div className="temple-life"><i style={{ width: `${life}%` }} /></div><small>{life} resistência{shield > 0 ? ` · ${shield} escudo` : ""}</small></div>
    </div>
  );
}
