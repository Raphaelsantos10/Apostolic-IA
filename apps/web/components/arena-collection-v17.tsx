"use client";

import { useMemo, useState } from "react";
import { arena25DPowerFor, type Arena25DPowerKind } from "../lib/apostolic-arena-25d-power-system";
import { ARENA_CARD_CATALOG } from "../lib/apostolic-arena-card-catalog";
import { arenaRequirementForCard, copiesRequiredForLevel, goldRequiredForLevel, isCardUnlocked, loadArenaProgression, saveArenaProgression } from "../lib/apostolic-arena-progression-v17";
import styles from "./arena-collection-v17.module.css";

const ACTIVE_DECK_KEY = "apostolic-arena-active-deck";
const SAVED_DECKS_KEY = "apostolic-arena-decks-v16";
const POWER_LABELS: Record<Arena25DPowerKind, string> = {
  warrior: "Combatente", ranged: "Distância", guardian: "Guardião", healer: "Curador", swarm: "Enxame", burst: "Impacto", champion: "Campeão"
};

type SavedDeck = { name: string; ids: number[] };
type SavedDecks = Record<string, SavedDeck>;

const readSavedDecks = (): SavedDecks => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_DECKS_KEY) ?? "{}") as SavedDecks;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
};

export function ArenaCollectionV17({ initialDeck, onDeckChange, onBattleTest }: {
  initialDeck: number[];
  onDeckChange: (ids: number[]) => void;
  onBattleTest: () => void;
}) {
  const [savedDecks, setSavedDecks] = useState<SavedDecks>(() => readSavedDecks());
  const [deckIds, setDeckIds] = useState<number[]>(() => initialDeck.length === 8 ? initialDeck : []);
  const [progression, setProgression] = useState(() => loadArenaProgression());
  const [detailCardId, setDetailCardId] = useState<number | null>(null);
  const [deckName, setDeckName] = useState(() => savedDecks.active?.name ?? "Meu baralho");
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("all");
  const [power, setPower] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sortBy, setSortBy] = useState("arena");
  const [viewMode, setViewMode] = useState<"comfortable" | "compact">("comfortable");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [message, setMessage] = useState("Escolha exatamente oito cartas");

  const deckCards = deckIds.flatMap((id) => {
    const card = ARENA_CARD_CATALOG.find((entry) => entry.id === id);
    return card ? [card] : [];
  });
  const filteredCards = useMemo(() => ARENA_CARD_CATALOG.filter((card) => {
    const profile = arena25DPowerFor(card);
    const matchesSearch = card.name.toLocaleLowerCase("pt").includes(search.toLocaleLowerCase("pt"));
    const unlocked = isCardUnlocked(progression, card.id);
    return matchesSearch && (rarity === "all" || card.rarity === rarity) && (power === "all" || profile.kind === power) && (availability === "all" || (availability === "unlocked" ? unlocked : !unlocked));
  }).sort((left, right) => {
    if (sortBy === "faith") return left.faith - right.faith || left.name.localeCompare(right.name, "pt");
    if (sortBy === "name") return left.name.localeCompare(right.name, "pt");
    if (sortBy === "level") return (progression.cards[String(right.id)]?.level ?? 0) - (progression.cards[String(left.id)]?.level ?? 0);
    return arenaRequirementForCard(left.id).arenaIndex - arenaRequirementForCard(right.id).arenaIndex || left.id - right.id;
  }), [availability, power, progression, rarity, search, sortBy]);
  const averageFaith = deckCards.length ? deckCards.reduce((total, card) => total + card.faith, 0) / deckCards.length : 0;
  const powerCounts = deckCards.reduce<Partial<Record<Arena25DPowerKind, number>>>((counts, card) => {
    const kind = arena25DPowerFor(card).kind;
    counts[kind] = (counts[kind] ?? 0) + 1;
    return counts;
  }, {});
  const warnings = [
    !powerCounts.guardian && "Falta um Guardião",
    !powerCounts.healer && "Falta suporte ou cura",
    !powerCounts.ranged && "Falta ataque à distância"
  ].filter(Boolean) as string[];
  const detailCard = detailCardId ? ARENA_CARD_CATALOG.find((card) => card.id === detailCardId) : undefined;
  const currentArena = [...Array(8).keys()].reverse().find((index) => progression.trophies >= [0, 200, 500, 900, 1400, 2100, 3000, 4200][index]!) ?? 0;

  const evolveCard = (cardId: number) => {
    const card = ARENA_CARD_CATALOG.find((entry) => entry.id === cardId);
    if (!card || !isCardUnlocked(progression, cardId)) return;
    const progress = progression.cards[String(cardId)] ?? { level: 1, copies: 0 };
    const copies = copiesRequiredForLevel(progress.level, card.rarity);
    const gold = goldRequiredForLevel(progress.level, card.rarity);
    if (progress.copies < copies || progression.gold < gold) { setMessage("Ainda faltam cópias ou Ouro para evoluir"); return; }
    const next = {
      ...progression,
      gold: progression.gold - gold,
      xp: progression.xp + progress.level * 25,
      cards: { ...progression.cards, [String(cardId)]: { level: progress.level + 1, copies: progress.copies - copies } }
    };
    setProgression(next);
    saveArenaProgression(next);
    setMessage(`${card.name} evoluiu para o nível ${progress.level + 1}`);
  };

  const persist = (ids = deckIds, name = deckName) => {
    if (ids.length !== 8) {
      setMessage(`Faltam ${8 - ids.length} cartas`);
      return false;
    }
    if (ids.some((id) => !isCardUnlocked(progression, id))) {
      setMessage("O deck contém uma carta ainda bloqueada");
      return false;
    }
    const nextSaved = { ...savedDecks, active: { name: name.trim() || "Meu baralho", ids } };
    setSavedDecks(nextSaved);
    window.localStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(nextSaved));
    window.localStorage.setItem(ACTIVE_DECK_KEY, JSON.stringify(ids));
    onDeckChange(ids);
    setMessage("Baralho salvo e ligado à batalha");
    return true;
  };

  const toggleCard = (cardId: number) => {
    if (!isCardUnlocked(progression, cardId)) { setMessage("Esta carta ainda não foi conquistada"); return; }
    setDeckIds((current) => {
      if (selectedSlot !== null) {
        const next = [...current];
        const existingIndex = next.indexOf(cardId);
        if (existingIndex >= 0) [next[existingIndex], next[selectedSlot]] = [next[selectedSlot]!, next[existingIndex]!];
        else next[selectedSlot] = cardId;
        setSelectedSlot(null);
        setMessage(`Carta colocada no espaço ${selectedSlot + 1}`);
        return next;
      }
      if (current.includes(cardId)) return current.filter((id) => id !== cardId);
      if (current.length >= 8) {
        setMessage("O baralho já possui oito cartas");
        return current;
      }
      return [...current, cardId];
    });
  };

  const reorderByDrag = (destination: number) => {
    if (draggedSlot === null || draggedSlot === destination || !deckIds[draggedSlot]) return;
    setDeckIds((current) => {
      const next = [...current];
      const [moved] = next.splice(draggedSlot, 1);
      next.splice(destination, 0, moved!);
      return next;
    });
    setDraggedSlot(null);
    setMessage("Ordem do ciclo atualizada");
  };

  const moveCard = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= deckIds.length) return;
    setDeckIds((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination]!, next[index]!];
      return next;
    });
  };

  return <section className={styles.builder}>
    <header className={styles.header}>
      <div><span>V17.2 · ARQUIVO CELESTIAL</span><h2>Coleção da Aliança</h2><p>Monte livremente os oito espaços. A ordem abaixo será o ciclo usado na batalha.</p></div>
      <div className={styles.playerProgress}><b>NÍVEL {progression.playerLevel}</b><span>✦ {progression.xp} XP</span><span>🏆 {progression.trophies}</span><span>◉ {progression.gold}</span><small>ARENA {currentArena + 1}</small></div>
      <label>Nome do deck<input value={deckName} maxLength={32} onChange={(event) => setDeckName(event.target.value)} /></label>
    </header>

    <section className={styles.deckPanel}>
      <div className={styles.deckSummary}><b>{deckIds.length}/8</b><span>Fé média {averageFaith.toFixed(1)}</span><em>{message}</em></div>
      <div className={styles.slots}>
        {Array.from({ length: 8 }, (_, index) => {
          const card = deckCards[index];
          return <article key={index} data-empty={!card} data-target={selectedSlot === index} draggable={Boolean(card)} onDragStart={() => setDraggedSlot(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderByDrag(index)} onClick={() => { setSelectedSlot(index); setMessage(`Escolha na coleção a carta do espaço ${index + 1}`); }}>
            <i className={styles.slotOrder}>{index + 1}</i>{card ? <><img src={card.portrait} alt={card.name} /><b>{card.faith}</b><span>{card.name}</span><small>{POWER_LABELS[arena25DPowerFor(card).kind]}</small><div><button type="button" onClick={(event) => { event.stopPropagation(); moveCard(index, -1); }} aria-label="Mover para esquerda">‹</button><button type="button" onClick={(event) => { event.stopPropagation(); toggleCard(card.id); }} aria-label="Remover">×</button><button type="button" onClick={(event) => { event.stopPropagation(); moveCard(index, 1); }} aria-label="Mover para direita">›</button></div></> : <strong>ESCOLHER</strong>}
          </article>;
        })}
      </div>
      <aside className={styles.warnings}>{warnings.length ? warnings.map((warning) => <span key={warning}>◆ {warning}</span>) : <span data-ok="true">◆ Baralho equilibrado</span>}</aside>
      <div className={styles.actions}><button type="button" onClick={() => persist()}>SALVAR BARALHO</button><button type="button" disabled={deckIds.length !== 8} onClick={() => { if (persist()) onBattleTest(); }}>TESTAR NA ARENA</button></div>
    </section>

    <section className={styles.collection}>
      <div className={styles.collectionTitle}><div><small>ARQUIVO DE CARTAS</small><h3>Todas as cartas</h3><p>{filteredCards.length} cartas encontradas · clique numa carta para ampliar e ver os atributos</p></div><div className={styles.viewToggle} aria-label="Tamanho das cartas"><button type="button" data-active={viewMode === "comfortable"} onClick={() => setViewMode("comfortable")}>▦ Confortável</button><button type="button" data-active={viewMode === "compact"} onClick={() => setViewMode("compact")}>▦ Compacta</button></div></div>
      <header><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar entre 125 cartas..." /><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">Toda a coleção</option><option value="unlocked">Conquistadas</option><option value="locked">Bloqueadas</option></select><select value={rarity} onChange={(event) => setRarity(event.target.value)}><option value="all">Todas as raridades</option><option value="common">Comum</option><option value="rare">Rara</option><option value="epic">Épica</option><option value="legendary">Lendária</option><option value="champion">Campeão</option></select><select value={power} onChange={(event) => setPower(event.target.value)}><option value="all">Todas as funções</option>{Object.entries(POWER_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="arena">Ordem por Arena</option><option value="faith">Menor custo de Fé</option><option value="level">Maior nível</option><option value="name">Nome A–Z</option></select></header>
      <div className={styles.grid} data-view={viewMode}>{filteredCards.map((card) => {
        const profile = arena25DPowerFor(card);
        const selected = deckIds.includes(card.id);
        const unlocked = isCardUnlocked(progression, card.id);
        const cardProgress = progression.cards[String(card.id)] ?? { level: 1, copies: 0 };
        const requirement = arenaRequirementForCard(card.id);
        return <article key={card.id} data-selected={selected} data-rarity={card.rarity} data-locked={!unlocked}>
          <button type="button" className={styles.cardOpen} onClick={() => setDetailCardId(card.id)}><img src={card.portrait} alt={card.name} /><b>{card.faith}</b><span>{unlocked ? card.name : "Carta bloqueada"}</span><small>{profile.label}</small><i>{unlocked ? `NÍVEL ${cardProgress.level} · ${cardProgress.copies}/${copiesRequiredForLevel(cardProgress.level, card.rarity)}` : `🔒 ${requirement.name}`}</i>{unlocked && <meter min="0" max={copiesRequiredForLevel(cardProgress.level, card.rarity)} value={cardProgress.copies} aria-label="Progresso de cópias" />}</button>
          <button type="button" className={styles.cardAction} disabled={!unlocked} onClick={() => toggleCard(card.id)}>{selected ? "REMOVER" : "+ DECK"}</button>
        </article>;
      })}</div>
    </section>

    {detailCard && (() => {
      const unlocked = isCardUnlocked(progression, detailCard.id);
      const progress = progression.cards[String(detailCard.id)] ?? { level: 1, copies: 0 };
      const profile = arena25DPowerFor(detailCard);
      const copies = copiesRequiredForLevel(progress.level, detailCard.rarity);
      const gold = goldRequiredForLevel(progress.level, detailCard.rarity);
      const multiplier = 1 + (progress.level - 1) * .08;
      const hp = Math.round((260 + detailCard.faith * 95) * profile.healthMultiplier * multiplier);
      const damage = Math.round((34 + detailCard.faith * 18) * profile.damageMultiplier * multiplier);
      const requirement = arenaRequirementForCard(detailCard.id);
      return <div className={styles.detailBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailCardId(null); }}>
        <section className={styles.cardDetail} role="dialog" aria-modal="true" aria-label={`Detalhes de ${detailCard.name}`} data-rarity={detailCard.rarity}>
          <button type="button" className={styles.closeDetail} onClick={() => setDetailCardId(null)} aria-label="Fechar">×</button>
          <div className={styles.detailArt}><img src={detailCard.portrait} alt={detailCard.name} /><b>{detailCard.faith} FÉ</b></div>
          <div className={styles.detailInfo}><span>{detailCard.rarity.toUpperCase()} · {profile.label}</span><h2>{detailCard.name}</h2>{unlocked ? <>
            <div className={styles.levelLine}><b>NÍVEL {progress.level}</b><em>{progress.copies}/{copies} CÓPIAS</em></div>
            <div className={styles.stats}><article><small>VIDA</small><b>{hp}</b><em>→ {Math.round(hp * 1.08)}</em></article><article><small>DANO</small><b>{damage}</b><em>→ {Math.round(damage * 1.08)}</em></article><article><small>ALCANCE</small><b>{profile.kind === "ranged" ? "Longo" : "Curto"}</b></article><article><small>VELOCIDADE</small><b>{profile.speedMultiplier > 1.1 ? "Rápida" : profile.speedMultiplier < .9 ? "Lenta" : "Média"}</b></article></div>
            <p><strong>{profile.label}:</strong> {profile.kind === "healer" ? "restaura aliados próximos" : profile.kind === "guardian" ? "absorve parte do dano recebido" : profile.kind === "burst" ? "atinge inimigos numa área" : profile.kind === "ranged" ? "ataca mantendo distância" : profile.kind === "swarm" ? "avança rapidamente em grupo" : "combate diretamente os inimigos"}.</p>
            <div className={styles.upgrade}><span>Custo da evolução</span><b>◉ {gold}</b><button type="button" disabled={progress.copies < copies || progression.gold < gold} onClick={() => evolveCard(detailCard.id)}>EVOLUIR</button></div>
            <div className={styles.detailActions}><button type="button" onClick={() => toggleCard(detailCard.id)}>{deckIds.includes(detailCard.id) ? "REMOVER DO DECK" : "COLOCAR NO DECK"}</button><button type="button" disabled={deckIds.length !== 8} onClick={() => { if (persist()) onBattleTest(); }}>TESTAR</button></div>
          </> : <div className={styles.lockedDetail}><b>🔒 CARTA AINDA NÃO CONQUISTADA</b><p>Alcance {requirement.name}, nível {requirement.level} e {requirement.trophies} troféus para colocá-la no conjunto de recompensas.</p></div>}</div>
        </section>
      </div>;
    })()}
  </section>;
}
