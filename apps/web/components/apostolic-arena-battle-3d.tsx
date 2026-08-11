"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ARENA_CARD_CATALOG } from "../lib/apostolic-arena-card-catalog";
import { arena25DPowerFor, type Arena25DPowerKind } from "../lib/apostolic-arena-25d-power-system";
import { ApostolicArena3DUnitLayer } from "../lib/apostolic-arena-3d-unit-layer";
import { arenaUnitModelFor } from "../lib/apostolic-arena-3d-unit-registry";
import { loadArenaProgression } from "../lib/apostolic-arena-progression-v17";
import { ARENA_COMPETITIVE_FIELDS_V201, arenaThemeForProgression } from "../lib/apostolic-arena-themes-v20";
import { SELECTED_FIELD_STORAGE_KEY_V203 } from "../lib/apostolic-arena-presentations-v20-3";
import { arenaFieldCalibrationV202 } from "../lib/apostolic-arena-field-calibration-v20-2";
import { ApostolicArenaPhaser } from "./apostolic-arena-phaser";
import styles from "./apostolic-arena-battle-3d.module.css";
import "./apostolic-arena-battle-results-v42.css";

const DECK_STORAGE_KEY = "apostolic-arena-active-deck";
type DraggingCard = { cardId: number; clientX: number; clientY: number };
type Team = "blue" | "red";
type CombatUnit = { id: number; cardId: number; team: Team; x: number; y: number; hp: number; maxHp: number; damage: number; speed: number; range: number; power: Arena25DPowerKind; powerValue: number; lastPower: number; powerAt?: number; lastAttack: number; hitAt?: number; lastDamage?: number; defeatedAt?: number };
type TowerState = { id: string; team: Team; x: number; y: number; hp: number; maxHp: number; damage: number; range: number; lastAttack: number; main: boolean };
type TowerProjectile = { id: number; team: Team; main: boolean; targetUnitId: number; damage: number; startX: number; startY: number; endX: number; endY: number; launchedAt: number; impactAt: number; impactedAt?: number };
type CombatState = { units: CombatUnit[]; towers: TowerState[]; projectiles: TowerProjectile[] };
type MatchStatus = "waiting" | "running" | "finished";
type MatchResult = { title: string; detail: string } | null;
type ChampionEffect = { championId: number; until: number } | null;
type QualityTier = "low" | "medium" | "high";
export type ArenaTutorialEventV206 = "card-selected" | "unit-deployed" | "bridge-crossed" | "tower-damaged" | "match-finished";

const MATCH_DURATION_SECONDS = 180;
const OVERTIME_SECONDS = 60;
const CHAMPION_IDS = [117, 119, 121, 125] as const;
const CHAMPION_ABILITIES: Record<number, { name: string; duration: number }> = {
  117: { name: "Abrir as Águas", duration: 4000 },
  119: { name: "Harpa Real", duration: 3000 },
  121: { name: "Frenesi", duration: 4000 },
  125: { name: "Escudo da Juíza", duration: 4000 }
};
const ENEMY_DECKS = [
  [117, 8, 10, 11, 27, 29, 30, 38],
  [119, 1, 5, 9, 13, 17, 19, 33],
  [121, 2, 7, 12, 16, 18, 22, 40],
  [125, 5, 10, 11, 15, 20, 32, 38]
];

const INITIAL_TOWERS: TowerState[] = [
  { id: "blue-temple", team: "blue", x: .5, y: .82, hp: 2800, maxHp: 2800, damage: 105, range: .17, lastAttack: 0, main: true },
  { id: "blue-left", team: "blue", x: .29, y: .66, hp: 1800, maxHp: 1800, damage: 82, range: .15, lastAttack: 0, main: false },
  { id: "blue-right", team: "blue", x: .71, y: .66, hp: 1800, maxHp: 1800, damage: 82, range: .15, lastAttack: 0, main: false },
  { id: "red-temple", team: "red", x: .5, y: .12, hp: 2800, maxHp: 2800, damage: 105, range: .17, lastAttack: 0, main: true },
  { id: "red-left", team: "red", x: .29, y: .29, hp: 1800, maxHp: 1800, damage: 82, range: .15, lastAttack: 0, main: false },
  { id: "red-right", team: "red", x: .71, y: .29, hp: 1800, maxHp: 1800, damage: 82, range: .15, lastAttack: 0, main: false }
];

const distance = (first: { x: number; y: number }, second: { x: number; y: number }) => Math.hypot(first.x - second.x, first.y - second.y);
const makeUnit = (cardId: number, team: Team, x: number, y: number): CombatUnit => {
  const card = ARENA_CARD_CATALOG.find((entry) => entry.id === cardId);
  const faith = card?.faith ?? 3;
  const power = card ? arena25DPowerFor(card) : { kind: "warrior" as const, healthMultiplier: 1, damageMultiplier: 1, speedMultiplier: 1, rangeBonus: 0, powerValue: 0 };
  const health = Math.round((260 + faith * 95) * power.healthMultiplier);
  return { id: Date.now() + Math.floor(Math.random() * 10000), cardId, team, x, y, hp: health, maxHp: health, damage: Math.round((34 + faith * 18) * power.damageMultiplier), speed: (.0042 + Math.max(0, 5 - faith) * .00035) * power.speedMultiplier, range: .052 + power.rangeBonus, power: power.kind, powerValue: power.powerValue, lastPower: 0, lastAttack: 0 };
};

export function ApostolicArenaBattle3D({ onResult, trainingMode = false, tutorialPaused = false, onTutorialEvent }: { onResult?: (result: "victory" | "defeat" | "draw") => void; trainingMode?: boolean; tutorialPaused?: boolean; onTutorialEvent?: (event: ArenaTutorialEventV206) => void } = {}) {
  const shellRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const unitLayerRef = useRef<ApostolicArena3DUnitLayer | null>(null);
  const combatRef = useRef<CombatState>({ units: [], towers: INITIAL_TOWERS, projectiles: [] });
  const enemyFaithRef = useRef(6);
  const championEffectRef = useRef<ChampionEffect>(null);
  const reportedResultRef = useRef(false);
  const tutorialSignalsRef = useRef(new Set<ArenaTutorialEventV206>());
  const [ready, setReady] = useState(false);
  const [legacy, setLegacy] = useState(false);
  const [deckIds, setDeckIds] = useState<number[]>([]);
  const [faith, setFaith] = useState(6);
  const [enemyFaith, setEnemyFaith] = useState(6);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [dragging, setDragging] = useState<DraggingCard | null>(null);
  const [combat, setCombat] = useState<CombatState>({ units: [], towers: INITIAL_TOWERS, projectiles: [] });
  const [deployMessage, setDeployMessage] = useState("Selecione ou arraste uma carta");
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("waiting");
  const [timeLeft, setTimeLeft] = useState(MATCH_DURATION_SECONDS);
  const [matchResult, setMatchResult] = useState<MatchResult>(null);
  const [overtime, setOvertime] = useState(false);
  const [championEffect, setChampionEffect] = useState<ChampionEffect>(null);
  const [abilityReadyAt, setAbilityReadyAt] = useState(0);
  const [quality, setQuality] = useState<QualityTier>("medium");
  const [isPaused, setIsPaused] = useState(false);
  const [diagnostics, setDiagnostics] = useState(false);
  const [fps, setFps] = useState(0);
  const [visible3DUnits, setVisible3DUnits] = useState<Set<number>>(() => new Set());
  const arenaTheme = useMemo(() => arenaThemeForProgression(loadArenaProgression()), []);
  const [competitiveFieldIndex, setCompetitiveFieldIndex] = useState(0);
  const competitiveFields = ARENA_COMPETITIVE_FIELDS_V201[arenaTheme.theme.id] ?? ARENA_COMPETITIVE_FIELDS_V201.galilee!;
  const competitiveField = competitiveFields[competitiveFieldIndex] ?? competitiveFields[0];
  const fieldCalibration = arenaFieldCalibrationV202(competitiveField.id);

  useEffect(() => {
    try {
      const selected = JSON.parse(window.sessionStorage.getItem(SELECTED_FIELD_STORAGE_KEY_V203) ?? "null") as { arenaId?: string; fieldId?: string } | null;
      const matchingIndex = selected?.arenaId === arenaTheme.theme.id ? competitiveFields.findIndex((field) => field.id === selected.fieldId) : -1;
      setCompetitiveFieldIndex(matchingIndex >= 0 ? matchingIndex : Math.random() < .5 ? 0 : 1);
    } catch { setCompetitiveFieldIndex(Math.random() < .5 ? 0 : 1); }
  }, [arenaTheme.theme.id]);
  useEffect(() => {
    const { towers } = fieldCalibration;
    const calibrated = INITIAL_TOWERS.map((tower) => {
      const point = tower.id === "blue-temple" ? towers.blueMain : tower.id === "blue-left" ? towers.blueLeft : tower.id === "blue-right" ? towers.blueRight : tower.id === "red-temple" ? towers.redMain : tower.id === "red-left" ? towers.redLeft : towers.redRight;
      return { ...tower, ...point };
    });
    const next = { units: [], towers: calibrated, projectiles: [] };
    setCombat(next);
    combatRef.current = next;
  }, [fieldCalibration]);
  const orderedDeck = useMemo(() => {
    const cards = deckIds.flatMap((id) => {
      const card = ARENA_CARD_CATALOG.find((entry) => entry.id === id);
      return card ? [card] : [];
    });
    return (cards.length ? cards : ARENA_CARD_CATALOG.slice(0, 8)).slice(0, 8);
  }, [deckIds]);
  const hand = orderedDeck.slice(0, 4);
  const nextCard = orderedDeck[4];
  const activeChampionId = orderedDeck.find((card) => CHAMPION_IDS.includes(card.id as typeof CHAMPION_IDS[number]))?.id ?? 117;
  const activeChampion = ARENA_CARD_CATALOG.find((card) => card.id === activeChampionId);
  const activeAbility = CHAMPION_ABILITIES[activeChampionId] ?? CHAMPION_ABILITIES[117]!;
  const activeDragCardId = dragging?.cardId;
  const maxTeamUnits = quality === "high" ? 18 : quality === "medium" ? 14 : 10;
  const maxProjectiles = quality === "high" ? 30 : quality === "medium" ? 22 : 14;
  const paused = isPaused || tutorialPaused;

  const emitTutorialEvent = useCallback((event: ArenaTutorialEventV206) => {
    if (!trainingMode || tutorialSignalsRef.current.has(event)) return;
    tutorialSignalsRef.current.add(event);
    onTutorialEvent?.(event);
  }, [onTutorialEvent, trainingMode]);

  useEffect(() => { combatRef.current = combat; }, [combat]);

  useEffect(() => {
    unitLayerRef.current?.sync(quality === "low" ? [] : combat.units);
  }, [combat.units, quality]);

  useEffect(() => {
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const cores = navigator.hardwareConcurrency ?? 4;
    const compact = window.matchMedia("(max-width: 48rem)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setQuality(reducedMotion || memory <= 2 || cores <= 2 ? "low" : (!compact && memory >= 8 && cores >= 8 ? "high" : "medium"));
    setDiagnostics(new URLSearchParams(window.location.search).get("arenaDebug") === "1");
    let hiddenAt = 0;
    const updateVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        setIsPaused(true);
        return;
      }
      const pausedFor = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = 0;
      if (pausedFor > 0) {
        setAbilityReadyAt((current) => current > 0 ? current + pausedFor : current);
        setChampionEffect((current) => {
          const next = current ? { ...current, until: current.until + pausedFor } : null;
          championEffectRef.current = next;
          return next;
        });
      }
      setIsPaused(false);
    };
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (trainingMode) {
      setDeckIds(ARENA_CARD_CATALOG.slice(0, 8).map((card) => card.id));
      return;
    }
    try {
      const stored = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? "[]") as number[];
      const validDeck = Array.isArray(stored) ? [...new Set(stored)]
        .filter((id) => ARENA_CARD_CATALOG.some((card) => card.id === id))
        .slice(0, 8) : [];
      const completeDeck = validDeck.length === 8 ? validDeck : ARENA_CARD_CATALOG.slice(0, 8).map((card) => card.id);
      setDeckIds(completeDeck);
      if (validDeck.length !== 8) window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(completeDeck));
    } catch { setDeckIds([]); }
  }, [trainingMode]);

  useEffect(() => {
    if (matchStatus !== "running" || paused) return;
    const faithTimer = window.setInterval(() => {
      setFaith((current) => Math.min(10, current + 1));
      setEnemyFaith((current) => {
        const next = Math.min(10, current + 1);
        enemyFaithRef.current = next;
        return next;
      });
    }, overtime ? 1400 : 2800);
    return () => window.clearInterval(faithTimer);
  }, [matchStatus, overtime, paused]);

  useEffect(() => {
    if (!ready || legacy || matchStatus !== "waiting") return;
    setMatchStatus("running");
    setDeployMessage("A batalha começou");
  }, [legacy, matchStatus, ready]);

  useEffect(() => {
    if (matchStatus !== "running" || paused) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [matchStatus, paused]);

  const cycleCard = useCallback((cardId: number) => {
    setDeckIds((current) => {
      const source = current.length ? current : orderedDeck.map((card) => card.id);
      const index = source.indexOf(cardId);
      if (index < 0) return source;
      const nextOrder = [...source.slice(0, index), ...source.slice(index + 1), cardId];
      if (!trainingMode) try { window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(nextOrder)); } catch { /* Storage is optional. */ }
      return nextOrder;
    });
  }, [orderedDeck, trainingMode]);

  const deployCard = useCallback((cardId: number, x: number, y: number) => {
    if (matchStatus !== "running") {
      setDeployMessage(matchStatus === "finished" ? "A batalha terminou" : "Aguarde o início da batalha");
      return false;
    }
    if (combatRef.current.units.filter((unit) => unit.team === "blue" && !unit.defeatedAt).length >= maxTeamUnits) {
      setDeployMessage("Limite de tropas ativas atingido");
      return false;
    }
    const card = ARENA_CARD_CATALOG.find((entry) => entry.id === cardId);
    if (!card || faith < card.faith) {
      setDeployMessage("Fé insuficiente");
      return false;
    }
    if (x < fieldCalibration.deploy.minX || x > fieldCalibration.deploy.maxX || y < fieldCalibration.deploy.top || y > fieldCalibration.deploy.bottom) {
      setDeployMessage("Solte a carta no território azul");
      return false;
    }
    setFaith((current) => Math.max(0, current - card.faith));
    setCombat((current) => ({ ...current, units: [...current.units, makeUnit(cardId, "blue", x, y)] }));
    cycleCard(cardId);
    setSelectedCardId(null);
    setDeployMessage(`${card.name} foi invocado`);
    emitTutorialEvent("unit-deployed");
    return true;
  }, [cycleCard, emitTutorialEvent, faith, fieldCalibration, matchStatus, maxTeamUnits]);

  const activateChampionAbility = useCallback(() => {
    const now = Date.now();
    if (matchStatus !== "running" || now < abilityReadyAt) return;
    const effect = { championId: activeChampionId, until: now + activeAbility.duration };
    championEffectRef.current = effect;
    setChampionEffect(effect);
    setAbilityReadyAt(now + 18000);
    setDeployMessage(`${activeAbility.name} foi ativada`);
    if (activeChampionId === 117 || activeChampionId === 125) {
      const bonus = activeChampionId === 125 ? 200 : 120;
      setCombat((current) => ({ ...current, units: current.units.map((unit) => unit.team === "blue" && !unit.defeatedAt
        ? { ...unit, hp: unit.hp + bonus, maxHp: unit.maxHp + bonus }
        : unit) }));
    }
  }, [abilityReadyAt, activeAbility.duration, activeAbility.name, activeChampionId, matchStatus]);

  useEffect(() => {
    if (!activeDragCardId) return;
    const move = (event: PointerEvent) => setDragging((current) => current ? { ...current, clientX: event.clientX, clientY: event.clientY } : null);
    const finish = (event: PointerEvent) => {
      const rect = shellRef.current?.getBoundingClientRect();
      if (rect) deployCard(activeDragCardId, (event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
      setDragging(null);
    };
    const cancel = () => setDragging(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", cancel, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [activeDragCardId, deployCard]);

  useEffect(() => {
    if (!ready || legacy || matchStatus !== "running" || paused) return;
    const enemyCards = ENEMY_DECKS[(activeChampionId === 117 ? 1 : activeChampionId === 119 ? 2 : activeChampionId === 121 ? 3 : 0)]!;
    let enemyIndex = 0;
    const spawnEnemy = () => {
      if (combatRef.current.units.filter((unit) => unit.team === "red" && !unit.defeatedAt).length >= maxTeamUnits) return;
      const affordable = Array.from({ length: enemyCards.length }, (_, offset) => {
        const index = (enemyIndex + offset) % enemyCards.length;
        const cardId = enemyCards[index]!;
        return { cardId, index, card: ARENA_CARD_CATALOG.find((entry) => entry.id === cardId) };
      }).find((entry) => entry.card && entry.card.faith <= enemyFaithRef.current);
      if (!affordable?.card) return;
      enemyIndex = (affordable.index + 1) % enemyCards.length;
      const nextFaith = Math.max(0, enemyFaithRef.current - affordable.card.faith);
      enemyFaithRef.current = nextFaith;
      setEnemyFaith(nextFaith);
      setCombat((current) => {
        const leftThreat = current.units.filter((unit) => unit.team === "blue" && !unit.defeatedAt && unit.x < .5 && unit.y < .58).length;
        const rightThreat = current.units.filter((unit) => unit.team === "blue" && !unit.defeatedAt && unit.x >= .5 && unit.y < .58).length;
        const alternatingLane = enemyIndex % 2 === 0 ? fieldCalibration.lanes[0] : fieldCalibration.lanes[1];
        const laneX = leftThreat === rightThreat ? alternatingLane : (leftThreat > rightThreat ? fieldCalibration.lanes[0] : fieldCalibration.lanes[1]);
        return { ...current, units: [...current.units, makeUnit(affordable.cardId, "red", laneX, fieldCalibration.enemySpawnY)] };
      });
    };
    const firstSpawn = window.setTimeout(spawnEnemy, 1800);
    const enemyTimer = window.setInterval(spawnEnemy, 5200);
    return () => {
      window.clearTimeout(firstSpawn);
      window.clearInterval(enemyTimer);
    };
  }, [activeChampionId, fieldCalibration, legacy, matchStatus, maxTeamUnits, paused, ready]);

  useEffect(() => {
    if (!ready || legacy || matchStatus !== "running" || paused) return;
    const simulationTimer = window.setInterval(() => {
      setCombat((current) => {
        const now = Date.now();
        const activeEffect = championEffectRef.current && championEffectRef.current.until > now ? championEffectRef.current : null;
        const units = current.units.map((unit) => ({ ...unit }));
        const towers = current.towers.map((tower) => ({ ...tower }));
        const projectiles = current.projectiles.map((projectile) => ({ ...projectile }));

        projectiles.forEach((projectile) => {
          if (projectile.impactedAt || now < projectile.impactAt) return;
          const target = units.find((unit) => unit.id === projectile.targetUnitId && !unit.defeatedAt);
          projectile.impactedAt = now;
          if (!target) return;
          projectile.endX = target.x;
          projectile.endY = target.y;
          target.hitAt = now;
          const protectedByMoses = activeEffect?.championId === 117 && target.team === "blue";
          const guardianReduction = target.power === "guardian" ? Math.max(.5, 1 - target.powerValue) : 1;
          const appliedDamage = projectile.damage * (protectedByMoses ? .5 : 1) * guardianReduction;
          target.lastDamage = appliedDamage;
          target.hp = Math.max(0, target.hp - appliedDamage);
          if (target.hp <= 0) target.defeatedAt = now;
        });

        const moveTowards = (unit: CombatUnit, destination: { x: number; y: number }) => {
          const targetAcrossRiver = unit.team === "blue" ? destination.y < fieldCalibration.river.top : destination.y > fieldCalibration.river.bottom;
          let waypoint = destination;
          if (targetAcrossRiver) {
            const bridgeX = unit.x < .5 ? fieldCalibration.bridges[0] : fieldCalibration.bridges[1];
            if (unit.team === "blue" && unit.y > fieldCalibration.river.bottom) {
              waypoint = { x: bridgeX, y: fieldCalibration.river.bottom };
            } else if (unit.team === "blue" && unit.y >= fieldCalibration.river.top) {
              waypoint = { x: bridgeX, y: fieldCalibration.river.top - .01 };
            } else if (unit.team === "red" && unit.y < fieldCalibration.river.top) {
              waypoint = { x: bridgeX, y: fieldCalibration.river.top };
            } else if (unit.team === "red" && unit.y <= fieldCalibration.river.bottom) {
              waypoint = { x: bridgeX, y: fieldCalibration.river.bottom + .01 };
            }
          }
          const dx = waypoint.x - unit.x;
          const dy = waypoint.y - unit.y;
          const length = Math.hypot(dx, dy) || 1;
          const speed = unit.speed * (activeEffect?.championId === 121 && unit.team === "blue" ? 1.7 : 1);
          unit.x += (dx / length) * speed;
          unit.y += (dy / length) * speed;
        };

        units.forEach((unit) => {
          if (unit.defeatedAt) return;
          const daviSilence = activeEffect?.championId === 119 && unit.team === "red";
          if (unit.power === "healer" && now - unit.lastPower >= 2200) {
            const ally = units
              .filter((entry) => entry.team === unit.team && entry.id !== unit.id && !entry.defeatedAt && entry.hp < entry.maxHp && distance(unit, entry) <= .16)
              .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
            if (ally) {
              ally.hp = Math.min(ally.maxHp, ally.hp + unit.powerValue);
              ally.powerAt = now;
              unit.powerAt = now;
              unit.lastPower = now;
            }
          }
          const enemyUnits = units.filter((entry) => entry.team !== unit.team && !entry.defeatedAt);
          const nearbyUnit = enemyUnits.sort((a, b) => distance(unit, a) - distance(unit, b))[0];
          const enemyTowers = towers.filter((tower) => tower.team !== unit.team && tower.hp > 0);
          const nearestTower = enemyTowers.sort((a, b) => distance(unit, a) - distance(unit, b))[0];
          const target = nearbyUnit && distance(unit, nearbyUnit) < .17 ? nearbyUnit : nearestTower;
          if (!target) return;
          const targetDistance = distance(unit, target);
          if (targetDistance <= unit.range) {
            if (daviSilence) return;
            const samsonFrenzy = activeEffect?.championId === 121 && unit.team === "blue";
            if (now - unit.lastAttack < (samsonFrenzy ? 500 : 900)) return;
            unit.lastAttack = now;
            const protectedByMoses = activeEffect?.championId === 117 && target.team === "blue";
            const guardianReduction = "cardId" in target && target.power === "guardian" ? Math.max(.5, 1 - target.powerValue) : 1;
            const appliedDamage = unit.damage * (samsonFrenzy ? 1.8 : 1) * (protectedByMoses ? .5 : 1) * guardianReduction;
            target.hp = Math.max(0, target.hp - appliedDamage);
            if ("cardId" in target) {
              target.hitAt = now;
              target.lastDamage = appliedDamage;
              if (target.hp <= 0) target.defeatedAt = now;
            }
            if (unit.power === "burst" && now - unit.lastPower >= 1800) {
              units.filter((entry) => entry.team !== unit.team && !entry.defeatedAt && entry.id !== ("cardId" in target ? target.id : -1) && distance(entry, target) <= .105).forEach((entry) => {
                entry.hp = Math.max(0, entry.hp - unit.powerValue);
                entry.hitAt = now;
                entry.lastDamage = unit.powerValue;
                if (entry.hp <= 0) entry.defeatedAt = now;
              });
              unit.lastPower = now;
              unit.powerAt = now;
            }
          } else {
            moveTowards(unit, target);
          }
        });

        towers.forEach((tower) => {
          if (tower.hp <= 0 || now - tower.lastAttack < 1150) return;
          if (activeEffect?.championId === 119 && tower.team === "red") return;
          const target = units
            .filter((unit) => unit.team !== tower.team && !unit.defeatedAt && distance(tower, unit) <= tower.range)
            .sort((a, b) => distance(tower, a) - distance(tower, b))[0];
          if (!target) return;
          tower.lastAttack = now;
          const travelTime = tower.main ? 520 : 430;
          projectiles.push({
            id: now + Math.floor(Math.random() * 100000),
            team: tower.team,
            main: tower.main,
            targetUnitId: target.id,
            damage: tower.damage,
            startX: tower.x,
            startY: tower.y - (tower.team === "blue" ? .025 : -.025),
            endX: target.x,
            endY: target.y,
            launchedAt: now,
            impactAt: now + travelTime
          });
        });

        return {
          towers,
          units: units.filter((unit) => !unit.defeatedAt || now - unit.defeatedAt < 620),
          projectiles: projectiles
            .filter((projectile) => !projectile.impactedAt || now - projectile.impactedAt < 380)
            .slice(-maxProjectiles)
        };
      });
    }, 100);
    return () => window.clearInterval(simulationTimer);
  }, [fieldCalibration, legacy, matchStatus, maxProjectiles, paused, ready]);

  useEffect(() => {
    if (!trainingMode) return;
    if (combat.units.some((unit) => unit.team === "blue" && !unit.defeatedAt && unit.y < fieldCalibration.river.top)) emitTutorialEvent("bridge-crossed");
    if (combat.towers.some((tower) => tower.team === "red" && tower.hp < tower.maxHp)) emitTutorialEvent("tower-damaged");
  }, [combat.towers, combat.units, emitTutorialEvent, fieldCalibration.river.top, trainingMode]);

  useEffect(() => {
    if (matchStatus !== "running") return;
    const blueTemple = combat.towers.find((tower) => tower.id === "blue-temple");
    const redTemple = combat.towers.find((tower) => tower.id === "red-temple");
    if (blueTemple && blueTemple.hp <= 0) {
      setMatchResult({ title: "DERROTA", detail: "O Templo da Aliança foi destruído" });
      setMatchStatus("finished");
      setDeployMessage("Batalha encerrada");
    } else if (redTemple && redTemple.hp <= 0) {
      setMatchResult({ title: "VITÓRIA", detail: "O templo adversário foi destruído" });
      setMatchStatus("finished");
      setDeployMessage("Batalha encerrada");
    }
  }, [combat.towers, matchStatus]);

  useEffect(() => {
    if (matchStatus !== "running" || timeLeft > 0) return;
    const teamHealth = (team: Team) => combat.towers
      .filter((tower) => tower.team === team)
      .reduce((total, tower) => total + Math.max(0, tower.hp), 0);
    const blueHealth = teamHealth("blue");
    const redHealth = teamHealth("red");
    if (blueHealth === redHealth && !overtime) {
      setOvertime(true);
      setTimeLeft(OVERTIME_SECONDS);
      setDeployMessage("MORTE SÚBITA · Fé em dobro");
      return;
    }
    setMatchResult(blueHealth === redHealth
      ? { title: "EMPATE", detail: "A morte súbita terminou com resistência igual" }
      : blueHealth > redHealth
        ? { title: "VITÓRIA", detail: "Sua aliança preservou mais vida nas estruturas" }
        : { title: "DERROTA", detail: "O adversário preservou mais vida nas estruturas" });
    setMatchStatus("finished");
    setDeployMessage("Tempo encerrado");
  }, [combat.towers, matchStatus, overtime, timeLeft]);

  useEffect(() => {
    if (!matchResult || reportedResultRef.current) return;
    reportedResultRef.current = true;
    emitTutorialEvent("match-finished");
    if (!trainingMode) onResult?.(matchResult.title === "VITÓRIA" ? "victory" : matchResult.title === "DERROTA" ? "defeat" : "draw");
  }, [emitTutorialEvent, matchResult, onResult, trainingMode]);

  useEffect(() => {
    if (legacy) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    let readyTimer: number | undefined;
    let fpsTimer: number | undefined;

    void import("@babylonjs/core").then((BABYLON) => {
      if (disposed || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const engine = new BABYLON.Engine(canvas, quality !== "low", { antialias: quality !== "low", stencil: quality !== "low", powerPreference: "high-performance" });
      const hardwareScale = quality === "low" ? 1.8 : quality === "medium" ? 1.3 : (window.devicePixelRatio > 1.5 ? 1.1 : 1);
      engine.setHardwareScalingLevel(hardwareScale);
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(...arenaTheme.theme.sky, 1);
      scene.imageProcessingConfiguration.contrast = 1.13;
      scene.imageProcessingConfiguration.exposure = 1.08;
      const unitLayer = new ApostolicArena3DUnitLayer(BABYLON, scene, (unitId, visible3D) => {
        if (disposed) return;
        setVisible3DUnits((current) => {
          const next = new Set(current);
          if (visible3D) next.add(unitId); else next.delete(unitId);
          return next;
        });
      });
      unitLayerRef.current = unitLayer;
      unitLayer.sync(quality === "low" ? [] : combatRef.current.units);
      new BABYLON.Layer("vertical-biblical-arena", "/games/apostolic-arena/scenes/arena-battle-vertical-v81.png", scene, true);

      const camera = new BABYLON.ArcRotateCamera("battle-camera", -Math.PI / 2, 0.86, 34, new BABYLON.Vector3(0, 0, 0), scene);
      camera.lowerRadiusLimit = quality === "low" ? 33 : 31;
      camera.upperRadiusLimit = quality === "low" ? 36 : 38;
      camera.lowerBetaLimit = 0.78;
      camera.upperBetaLimit = 1.02;
      camera.lowerAlphaLimit = -1.69;
      camera.upperAlphaLimit = -1.45;
      camera.panningSensibility = 0;
      camera.wheelPrecision = 100;
      camera.attachControl(canvas, true);

      const ambient = new BABYLON.HemisphericLight("battle-ambient", new BABYLON.Vector3(0, 1, 0), scene);
      ambient.intensity = 0.95;
      ambient.diffuse = new BABYLON.Color3(...arenaTheme.theme.ambient);
      ambient.groundColor = new BABYLON.Color3(0.16, 0.1, 0.06);
      const sun = new BABYLON.DirectionalLight("battle-sun", new BABYLON.Vector3(-0.35, -1, 0.45), scene);
      sun.position = new BABYLON.Vector3(12, 24, -18);
      sun.intensity = 2.2;
      sun.diffuse = new BABYLON.Color3(...arenaTheme.theme.sun);

      const material = (name: string, diffuse: [number, number, number], emissive?: [number, number, number]) => {
        const value = new BABYLON.StandardMaterial(name, scene);
        value.diffuseColor = new BABYLON.Color3(...diffuse);
        value.specularColor = new BABYLON.Color3(0.24, 0.2, 0.15);
        if (emissive) value.emissiveColor = new BABYLON.Color3(...emissive);
        return value;
      };

      const stone = material("arena-stone", arenaTheme.theme.ground);
      const laneStone = material("lane-stone", arenaTheme.theme.lane);
      const bridgeStone = material("bridge-stone", arenaTheme.theme.bridge);
      const wallStone = material("wall-stone", arenaTheme.theme.wall);
      const water = material("river-water", arenaTheme.theme.water, arenaTheme.theme.waterGlow);
      water.alpha = 0.88;
      const blue = material("alliance-blue", [0.025, 0.23, 0.55], [0.03, 0.26, 0.62]);
      const red = material("rival-red", [0.55, 0.055, 0.035], [0.48, 0.035, 0.025]);
      const gold = material("arena-gold", [0.72, 0.42, 0.09], [0.18, 0.07, 0.005]);
      [stone, laneStone, bridgeStone, wallStone, water, blue, red, gold].forEach((entry) => { entry.alpha = 0; });

      const ground = BABYLON.MeshBuilder.CreateGround("battle-ground", { width: 18, height: 32, subdivisions: 2 }, scene);
      ground.material = stone;

      for (const laneX of [-5, 5]) {
        const lane = BABYLON.MeshBuilder.CreateBox(`lane-${laneX}`, { width: 4.4, height: 0.06, depth: 29.4 }, scene);
        lane.position = new BABYLON.Vector3(laneX, 0.04, 0);
        lane.material = laneStone;
      }

      const river = BABYLON.MeshBuilder.CreateBox("river", { width: 18, height: 0.14, depth: 2.2 }, scene);
      river.position.y = 0.08;
      river.material = water;

      for (const bridgeX of [-5, 5]) {
        const bridge = BABYLON.MeshBuilder.CreateBox(`bridge-${bridgeX}`, { width: 4.25, height: 0.32, depth: 2.65 }, scene);
        bridge.position = new BABYLON.Vector3(bridgeX, 0.25, 0);
        bridge.material = bridgeStone;
        for (const railX of [-1.92, 1.92]) {
          const rail = BABYLON.MeshBuilder.CreateBox(`bridge-rail-${bridgeX}-${railX}`, { width: 0.14, height: 0.32, depth: 2.8 }, scene);
          rail.position = new BABYLON.Vector3(bridgeX + railX, 0.55, 0);
          rail.material = gold;
        }
      }

      for (const sideX of [-9.35, 9.35]) {
        const wall = BABYLON.MeshBuilder.CreateBox(`side-wall-${sideX}`, { width: 0.7, height: 1.1, depth: 32.8 }, scene);
        wall.position = new BABYLON.Vector3(sideX, 0.55, 0);
        wall.material = wallStone;
      }
      for (const sideZ of [-16.35, 16.35]) {
        const wall = BABYLON.MeshBuilder.CreateBox(`end-wall-${sideZ}`, { width: 19.4, height: 1.1, depth: 0.7 }, scene);
        wall.position = new BABYLON.Vector3(0, 0.55, sideZ);
        wall.material = wallStone;
      }

      const decorMaterial = material("arena-theme-decor", arenaTheme.theme.wall, arenaTheme.theme.id === "covenant" ? [.12,.22,.55] : undefined);
      const accentMaterial = material("arena-theme-accent", arenaTheme.theme.bridge, arenaTheme.theme.id === "carmel" ? [.5,.08,.01] : undefined);
      const decorCount = quality === "low" ? 4 : quality === "medium" ? 8 : 12;
      for (let index = 0; index < decorCount; index += 1) {
        const side = index % 2 ? 1 : -1;
        const z = -13.5 + (index / Math.max(1, decorCount - 1)) * 27;
        const isColumn = ["jericho","jerusalem","covenant"].includes(arenaTheme.theme.id);
        const isTent = ["exodus","gideon","elah"].includes(arenaTheme.theme.id);
        const decoration = isColumn
          ? BABYLON.MeshBuilder.CreateCylinder(`theme-column-${index}`, { diameter: .65, height: 2.2 + arenaTheme.phaseIndex * .25, tessellation: 8 }, scene)
          : isTent
            ? BABYLON.MeshBuilder.CreateCylinder(`theme-tent-${index}`, { diameterTop: 0, diameterBottom: 1.2, height: 1.5, tessellation: 4 }, scene)
            : BABYLON.MeshBuilder.CreateSphere(`theme-tree-${index}`, { diameter: 1.15 + (index % 3) * .18, segments: 6 }, scene);
        decoration.position = new BABYLON.Vector3(side * 8.25, isColumn ? 1.1 : .75, z);
        decoration.material = index % 3 ? decorMaterial : accentMaterial;
      }

      const crystals: { mesh: import("@babylonjs/core").Mesh; baseY: number; phase: number }[] = [];
      const makeTower = (name: string, x: number, z: number, team: "blue" | "red", main = false) => {
        const root = new BABYLON.TransformNode(name, scene);
        root.position = new BABYLON.Vector3(x, 0, z);
        const teamMaterial = team === "blue" ? blue : red;
        const base = BABYLON.MeshBuilder.CreateCylinder(`${name}-base`, { diameter: main ? 3.5 : 2.6, height: 0.72, tessellation: 8 }, scene);
        base.parent = root;
        base.position.y = 0.36;
        base.material = wallStone;
        const body = BABYLON.MeshBuilder.CreateCylinder(`${name}-body`, { diameterTop: main ? 2.45 : 1.75, diameterBottom: main ? 2.9 : 2.2, height: main ? 3.9 : 3.1, tessellation: 8 }, scene);
        body.parent = root;
        body.position.y = main ? 2.4 : 1.95;
        body.material = teamMaterial;
        const crown = BABYLON.MeshBuilder.CreateCylinder(`${name}-crown`, { diameter: main ? 3.1 : 2.35, height: 0.48, tessellation: 8 }, scene);
        crown.parent = root;
        crown.position.y = main ? 4.45 : 3.55;
        crown.material = gold;
        const crystal = BABYLON.MeshBuilder.CreatePolyhedron(`${name}-crystal`, { type: 1, size: main ? 1.05 : 0.72 }, scene);
        crystal.parent = root;
        crystal.position.y = main ? 5.35 : 4.25;
        crystal.scaling.y = 1.5;
        crystal.material = teamMaterial;
        crystals.push({ mesh: crystal, baseY: crystal.position.y, phase: crystals.length * 0.72 });
      };

      makeTower("blue-temple", 0, 12.4, "blue", true);
      makeTower("blue-left", -5, 8.2, "blue");
      makeTower("blue-right", 5, 8.2, "blue");
      makeTower("red-temple", 0, -12.4, "red", true);
      makeTower("red-left", -5, -8.2, "red");
      makeTower("red-right", 5, -8.2, "red");

      const glow = new BABYLON.GlowLayer("battle-glow", scene, { blurKernelSize: 44 });
      glow.intensity = 0;
      let clock = 0;
      scene.onBeforeRenderObservable.add(() => {
        const delta = engine.getDeltaTime() / 1000;
        clock += delta;
        water.emissiveColor.set(arenaTheme.theme.waterGlow[0], arenaTheme.theme.waterGlow[1] + Math.sin(clock * 1.6) * 0.025, arenaTheme.theme.waterGlow[2] + Math.sin(clock * 1.2) * 0.035);
        crystals.forEach(({ mesh, baseY, phase }) => {
          mesh.rotation.y += delta * 0.72;
          mesh.position.y = baseY + Math.sin(clock * 1.8 + phase) * 0.12;
          const pulse = 1 + Math.sin(clock * 2.1 + phase) * 0.055;
          mesh.scaling.x = pulse;
          mesh.scaling.z = pulse;
        });
      });

      const resize = () => engine.resize();
      const renderFrame = () => scene.render();
      const updateRenderActivity = () => {
        engine.stopRenderLoop(renderFrame);
        if (!document.hidden) engine.runRenderLoop(renderFrame);
      };
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", updateRenderActivity);
      engine.runRenderLoop(renderFrame);
      fpsTimer = window.setInterval(() => setFps(Math.round(engine.getFps())), 1000);
      readyTimer = window.setTimeout(() => { if (!disposed) setReady(true); }, 8000);
      scene.executeWhenReady(() => {
        if (readyTimer) window.clearTimeout(readyTimer);
        if (!disposed) setReady(true);
      });
      cleanup = () => {
        if (readyTimer) window.clearTimeout(readyTimer);
        if (fpsTimer) window.clearInterval(fpsTimer);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", updateRenderActivity);
        unitLayer.dispose();
        if (unitLayerRef.current === unitLayer) unitLayerRef.current = null;
        scene.dispose();
        engine.dispose();
      };
    }).catch(() => setLegacy(true));

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [arenaTheme, legacy, quality]);

  if (legacy) return <ApostolicArenaPhaser />;
  const blueTowersAlive = combat.towers.filter((tower) => tower.team === "blue" && tower.hp > 0).length;
  const redTowersAlive = combat.towers.filter((tower) => tower.team === "red" && tower.hp > 0).length;
  const matchClock = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
  const abilityCooldown = Math.max(0, Math.ceil((abilityReadyAt - Date.now()) / 1000));
  const effectActive = Boolean(championEffect && championEffect.until > Date.now());

  return <section ref={shellRef} className={styles.battleShell} data-quality={quality} data-field={competitiveField.id} data-champion-effect={effectActive ? activeChampionId : undefined} aria-label="Arena de batalha 3D">
    <img className={styles.arenaBackdrop} src={competitiveField.image} alt="" aria-hidden="true" />
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      onPointerDown={(event) => {
        if (!selectedCardId) return;
        const rect = event.currentTarget.getBoundingClientRect();
        deployCard(selectedCardId, (event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
      }}
    />
    {!ready && <div className={styles.preparing}>Construindo arena 3D...</div>}
    {isPaused && <div className={styles.pauseOverlay}><b>PAUSADO</b><span>Volte à partida para continuar</span></div>}
    {diagnostics && <output className={styles.diagnostics}>V14 · {quality.toUpperCase()} · {fps} FPS · {combat.units.length} tropas · {combat.projectiles.length} projéteis</output>}

    {(selectedCardId || dragging) && <div className={styles.deployGuide} aria-hidden="true">
      <div className={styles.enemyTerritory} style={{ top: "7%", height: `${fieldCalibration.river.top * 100 - 7}%` }}>TERRITÓRIO INIMIGO</div>
      <div className={styles.riverBlock} style={{ top: `${fieldCalibration.river.top * 100}%`, height: `${(fieldCalibration.river.bottom - fieldCalibration.river.top) * 100}%` }}>TRAVESSIAS CALIBRADAS</div>
      <div className={styles.playerTerritory} style={{ top: `${fieldCalibration.deploy.top * 100}%`, height: `${(fieldCalibration.deploy.bottom - fieldCalibration.deploy.top) * 100}%`, left: `${fieldCalibration.deploy.minX * 100}%`, right: `${(1 - fieldCalibration.deploy.maxX) * 100}%` }}>ÁREA DE INVOCAÇÃO</div>
    </div>}
    {diagnostics && <div className={styles.calibrationOverlay} aria-hidden="true"><i style={{left:`${fieldCalibration.bridges[0]*100}%`,top:`${fieldCalibration.river.top*100}%`,height:`${(fieldCalibration.river.bottom-fieldCalibration.river.top)*100}%`}}/><i style={{left:`${fieldCalibration.bridges[1]*100}%`,top:`${fieldCalibration.river.top*100}%`,height:`${(fieldCalibration.river.bottom-fieldCalibration.river.top)*100}%`}}/>{combat.towers.map((tower)=><b key={tower.id} style={{left:`${tower.x*100}%`,top:`${tower.y*100}%`}}>{tower.id}</b>)}</div>}

    {combat.towers.map((tower) => <span
      key={tower.id}
      className={styles.towerStatus}
      data-team={tower.team}
      data-destroyed={tower.hp <= 0}
      style={{ left: `${tower.x * 100}%`, top: `${tower.y * 100}%` }}
    >
      <b>{tower.main ? "TEMPLO" : "TORRE"}</b>
      <i><em style={{ width: `${Math.max(0, tower.hp / tower.maxHp) * 100}%` }} /></i>
      <small>{Math.ceil(tower.hp)}</small>
    </span>)}

    {combat.projectiles.map((projectile) => {
      const now = Date.now();
      const progress = projectile.impactedAt ? 1 : Math.min(1, Math.max(0, (now - projectile.launchedAt) / (projectile.impactAt - projectile.launchedAt)));
      const x = projectile.startX + (projectile.endX - projectile.startX) * progress;
      const y = projectile.startY + (projectile.endY - projectile.startY) * progress - Math.sin(progress * Math.PI) * (projectile.main ? .032 : .02);
      const angle = Math.atan2(projectile.endY - projectile.startY, projectile.endX - projectile.startX);
      return <span
        key={projectile.id}
        className={styles.towerProjectile}
        data-team={projectile.team}
        data-main={projectile.main}
        data-impact={Boolean(projectile.impactedAt)}
        style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%,-50%) rotate(${angle}rad)` }}
        aria-hidden="true"
      ><i /><em /></span>;
    })}

    {combat.units.map((unit) => {
      const card = ARENA_CARD_CATALOG.find((entry) => entry.id === unit.cardId);
      if (!card) return null;
      const now = Date.now();
      const isHit = Boolean(unit.hitAt && now - unit.hitAt < 280);
      const isAttacking = now - unit.lastAttack < 320;
      const unitState = unit.defeatedAt ? "defeat" : isHit ? "hit" : isAttacking ? "attack" : "walk";
      const unitStyle = { left: `${unit.x * 100}%`, top: `${unit.y * 100}%`, "--unit-depth": .78 + unit.y * .38 } as CSSProperties & { "--unit-depth": number };
      return <span
        key={unit.id}
        className={styles.summonedUnit}
        data-team={unit.team}
        data-attacking={isAttacking}
        data-hit={isHit}
        data-defeated={Boolean(unit.defeatedAt)}
        data-state={unitState}
        data-power={unit.power}
        data-power-active={Boolean(unit.powerAt && now - unit.powerAt < 520)}
        data-empowered={effectActive && unit.team === "blue"}
        data-lane={unit.x < .5 ? "left" : "right"}
        data-renderer={visible3DUnits.has(unit.id) ? "3d" : "portrait"}
        style={unitStyle}
      >
        <i />
        <span className={styles.unitShadow} />
        <span className={styles.unitAura} />
        <img src={card.portrait} alt={card.name} />
        {isHit && unit.lastDamage && <strong className={styles.damageNumber}>-{Math.round(unit.lastDamage)}</strong>}
        <span className={styles.unitHealth}><em style={{ width: `${Math.max(0, unit.hp / unit.maxHp) * 100}%` }} /></span>
        <b>{card.name}</b>
        <small className={styles.unitPower}>{arena25DPowerFor(card).label}</small>
        {arenaUnitModelFor(unit.cardId)?.enabled && !visible3DUnits.has(unit.id) && <small className={styles.modelFallback}>2D</small>}
      </span>;
    })}

    {dragging && (() => {
      const card = ARENA_CARD_CATALOG.find((entry) => entry.id === dragging.cardId);
      return card ? <span className={styles.dragGhost} style={{ left: dragging.clientX, top: dragging.clientY }}><img src={card.portrait} alt="" /></span> : null;
    })()}

    <header className={styles.scoreboard}>
      <span className={styles.blueScore}>{Array.from({ length: blueTowersAlive }, () => "◆").join(" ") || "—"}</span>
      <strong>{overtime ? "MORTE SÚBITA " : ""}{matchClock}</strong>
      <span className={styles.redScore}>{Array.from({ length: redTowersAlive }, () => "◆").join(" ") || "—"}</span>
    </header>

    <aside className={styles.v8Badge}><b>{arenaTheme.theme.name}</b><span>Fase {arenaTheme.phaseIndex + 1} · {arenaTheme.phase.name}</span></aside>
    <aside className={styles.arenaThemeLabel}><small>{arenaTheme.theme.climate} · CAMPO {competitiveFieldIndex + 1}</small><b>{competitiveField.name}</b><span>{competitiveField.towerStyle}</span></aside>
    <aside className={styles.deckStatus}><b>8/8</b><span>BARALHO ATIVO</span></aside>
    <aside className={styles.enemyFaith} aria-label={`Fé adversária ${enemyFaith}`}><span>FÉ RIVAL</span><b>{enemyFaith}</b></aside>
    <p className={styles.deployMessage}>{deployMessage}</p>

    {effectActive && <div className={styles.championEffect} data-champion={activeChampionId} aria-hidden="true"><i /><em /></div>}

    <button
      type="button"
      className={styles.championAbility}
      data-active={effectActive}
      disabled={matchStatus !== "running" || abilityCooldown > 0}
      onClick={activateChampionAbility}
    >
      {activeChampion && <img src={activeChampion.portrait} alt="" aria-hidden="true" />}
      <span><small>{activeChampion?.name ?? "Campeão"}</small><b>{abilityCooldown > 0 ? `${abilityCooldown}s` : activeAbility.name}</b></span>
    </button>

    {matchResult && <section className={styles.matchResult} data-result={matchResult.title === "VITÓRIA" ? "victory" : matchResult.title === "DERROTA" ? "defeat" : "draw"} role="dialog" aria-modal="true" aria-label="Resultado da batalha">
      <i className={styles.resultSeal} aria-hidden="true">✦</i><small>CRÔNICA DA BATALHA</small>
      <h2>{matchResult.title}</h2>
      <p>{matchResult.detail}</p>
      <strong className={styles.matchReward}><span>{matchResult.title === "VITÓRIA" ? "RECOMPENSA DA VITÓRIA" : "RECOMPENSA DE BATALHA"}</span>{matchResult.title === "VITÓRIA" ? "+75 OURO · +25 TROFÉUS" : "+15 OURO"}</strong>
      <button type="button" onClick={() => {
        const nextFieldIndex = Math.random() < .5 ? 0 : 1;
        const nextField = competitiveFields[nextFieldIndex] ?? competitiveFields[0];
        setCompetitiveFieldIndex(nextFieldIndex);
        try { window.sessionStorage.setItem(SELECTED_FIELD_STORAGE_KEY_V203, JSON.stringify({ arenaId: arenaTheme.theme.id, fieldId: nextField.id, index: nextFieldIndex })); } catch { /* Storage is optional. */ }
        reportedResultRef.current = false;
        setCombat({ units: [], towers: combatRef.current.towers.map((tower) => ({ ...tower, hp: tower.maxHp, lastAttack: 0 })), projectiles: [] });
        setFaith(6);
        setEnemyFaith(6);
        enemyFaithRef.current = 6;
        setTimeLeft(MATCH_DURATION_SECONDS);
        setOvertime(false);
        setAbilityReadyAt(0);
        setChampionEffect(null);
        championEffectRef.current = null;
        setMatchResult(null);
        setMatchStatus("running");
        setDeployMessage("Nova batalha iniciada");
      }}>BATALHAR NOVAMENTE</button>
    </section>}

    <footer className={styles.hand}>
      <div className={styles.faith}><b>{faith}</b><span>FÉ</span></div>
      <div className={styles.cards}>
        {hand.map((card) => <button
          type="button"
          key={card.id}
          data-selected={card.id === selectedCardId}
          disabled={faith < card.faith || matchStatus !== "running"}
          aria-pressed={card.id === selectedCardId}
          onClick={() => {
            emitTutorialEvent("card-selected");
            setSelectedCardId((current) => current === card.id ? null : card.id);
            setDeployMessage(`Arraste ${card.name} para o território azul`);
          }}
          onPointerDown={(event) => {
            if (faith < card.faith) return;
            emitTutorialEvent("card-selected");
            event.preventDefault();
            setSelectedCardId(card.id);
            setDragging({ cardId: card.id, clientX: event.clientX, clientY: event.clientY });
            setDeployMessage(`Arraste ${card.name} para o território azul`);
          }}
        >
          <img src={card.portrait} alt={card.name} />
          <b>{card.faith}</b>
        </button>)}
      </div>
      <div className={styles.nextCard}><span>PRÓXIMA</span>{nextCard ? <i><img src={nextCard.portrait} alt={nextCard.name} /></i> : <i>✦</i>}</div>
    </footer>

    <button type="button" className={styles.legacyButton} onClick={() => setLegacy(true)}>Usar batalha atual</button>
  </section>;
}
