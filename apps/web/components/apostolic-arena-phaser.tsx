"use client";

import type { GameObjects, Input } from "phaser";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import styles from "./apostolic-arena-phaser.module.css";

type Lane = "left" | "right";
type Side = "player" | "enemy";
type Card = { id: string; name: string; cost: number; life: number; damage: number; speed: number; range: number; color: number; symbol: string; asset?: string };
type Hud = { playerTemple: number; enemyTemple: number; faith: number; seconds: number; state: "playing" | "won" | "lost" | "draw" };
type ArenaApi = { deploy: (card: Card, lane: Lane, side?: Side) => boolean; restart: () => void; fullscreen: () => void };
type Fighter = { side: Side; lane: Lane; life: number; maxLife: number; damage: number; speed: number; range: number; attackAt: number; body: GameObjects.Container; bar: GameObjects.Graphics; alive: boolean };
type Tower = { side: Side; lane: Lane; life: number; maxLife: number; damage: number; range: number; attackAt: number; body: GameObjects.Container; bar: GameObjects.Graphics; alive: boolean };

const deck: Card[] = [
  { id: "guardiao", name: "Guardião", cost: 3, life: 72, damage: 12, speed: 30, range: 42, color: 0x2d78c9, symbol: "G", asset: "/games/apostolic-arena/units/guardiao-v1.png" },
  { id: "mensageira", name: "Mensageira", cost: 3, life: 48, damage: 15, speed: 40, range: 125, color: 0x9a5bd1, symbol: "M", asset: "/games/apostolic-arena/units/mensageira-v1.png" },
  { id: "servo", name: "Servo", cost: 2, life: 42, damage: 9, speed: 52, range: 38, color: 0xd49832, symbol: "S", asset: "/games/apostolic-arena/units/servo-v1.png" },
  { id: "sentinela", name: "Sentinela", cost: 4, life: 105, damage: 10, speed: 23, range: 42, color: 0x238b7b, symbol: "T", asset: "/games/apostolic-arena/units/sentinela-v1.png" },
  { id: "unidade", name: "Unidade", cost: 5, life: 92, damage: 18, speed: 34, range: 44, color: 0xc0527b, symbol: "U", asset: "/games/apostolic-arena/units/unidade-v1.png" },
  { id: "peregrino", name: "Peregrino", cost: 2, life: 38, damage: 8, speed: 62, range: 36, color: 0xd86831, symbol: "P", asset: "/games/apostolic-arena/units/peregrino-v1.png" },
  { id: "arqueira", name: "Arqueira", cost: 4, life: 53, damage: 17, speed: 36, range: 145, color: 0x3d9fc3, symbol: "A", asset: "/games/apostolic-arena/units/arqueira-v1.png" },
  { id: "porta-voz", name: "Porta-voz", cost: 5, life: 66, damage: 22, speed: 31, range: 115, color: 0x5965cb, symbol: "V", asset: "/games/apostolic-arena/units/porta-voz-v1.png" }
];

const initialHud: Hud = { playerTemple: 100, enemyTemple: 100, faith: 6, seconds: 180, state: "playing" };

export function ApostolicArenaPhaser() {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ArenaApi | null>(null);
  const [hud, setHud] = useState(initialHud);
  const [selected, setSelected] = useState<Card>(deck[0] as Card);
  const [lane, setLane] = useState<Lane>("left");
  const [handOffset, setHandOffset] = useState(0);
  const [message, setMessage] = useState("Escolha uma unidade e envie-a por uma das pontes.");
  const cards = useMemo(() => deck, []);
  const selectedCardRef = useRef(selected);
  const hand = Array.from({ length: 4 }, (_, index) => cards[(handOffset + index) % cards.length] as Card);
  const nextCard = cards[(handOffset + 4) % cards.length] as Card;

  const advanceHand = () => {
    setHandOffset((current) => {
      const next = (current + 1) % cards.length;
      const nextSelection = cards[next] as Card;
      setSelected(nextSelection);
      selectedCardRef.current = nextSelection;
      return next;
    });
  };

  useEffect(() => { selectedCardRef.current = selected; }, [selected]);

  useEffect(() => {
    let disposed = false;
    let game: import("phaser").Game | null = null;

    void import("phaser").then(({ default: Phaser }) => {
      if (disposed || !hostRef.current) return;

      class ArenaScene extends Phaser.Scene {
        fighters: Fighter[] = [];
        towers: Tower[] = [];
        playerTemple = 100;
        enemyTemple = 100;
        faith = 6;
        enemyFaith = 6;
        seconds = 180;
        finished = false;
        lastSecond = 0;
        lastFaith = 0;
        lastEnemyMove = 0;
        playerCore!: GameObjects.Container;
        enemyCore!: GameObjects.Container;
        effects!: GameObjects.Graphics;
        deployPreview!: GameObjects.Graphics;

        constructor() { super("apostolic-arena"); }
        preload() {
          this.load.image("arena-bg", "/games/apostolic-arena/valley-of-beginning-v1.png");
          for (const card of deck) if (card.asset) this.load.image(`unit-${card.id}`, card.asset);
        }
        create() {
          const background = this.add.image(360, 640, "arena-bg");
          background.setDisplaySize(720, 1280);
          this.effects = this.add.graphics().setDepth(9);
          this.enemyCore = this.makeTemple(360, 105, 0x7050a4, "TREINO");
          this.playerCore = this.makeTemple(360, 1172, 0xd6a744, "LUZ");
          this.towers = [this.makeTower("left", "enemy"), this.makeTower("right", "enemy"), this.makeTower("left", "player"), this.makeTower("right", "player")];
          this.deployPreview = this.add.graphics().setDepth(20);
          this.add.text(18, 625, "VALE", { fontFamily: "system-ui", fontSize: "15px", fontStyle: "bold", color: "#f9edc0", backgroundColor: "#071521bb", padding: { x: 8, y: 4 } }).setDepth(8);
          this.add.text(626, 625, "MURALHA", { fontFamily: "system-ui", fontSize: "15px", fontStyle: "bold", color: "#f9edc0", backgroundColor: "#071521bb", padding: { x: 8, y: 4 } }).setOrigin(1, 0).setDepth(8);
          this.input.on("pointermove", (pointer: Input.Pointer) => {
            this.deployPreview.clear();
            if (pointer.y < 650 || this.finished) return;
            const x = pointer.x < 360 ? 268 : 458;
            const y = Math.min(1050, Math.max(700, pointer.y));
            this.deployPreview.fillStyle(0x61d8ff, .16).fillCircle(x, y, 38);
            this.deployPreview.lineStyle(3, 0x7ce5ff, .85).strokeCircle(x, y, 38);
          });
          this.input.on("pointerdown", (pointer: Input.Pointer) => {
            if (pointer.y < 650 || this.finished) return;
            const chosenLane: Lane = pointer.x < 360 ? "left" : "right";
            const card = selectedCardRef.current;
            const deployed = this.deploy(card, chosenLane, "player");
            setLane(chosenLane);
            setMessage(deployed ? `${card.name} entrou diretamente pela ${chosenLane === "left" ? "Ponte do Vale" : "Ponte das Muralhas"}.` : "Ainda não há Fé suficiente para esta unidade.");
            if (deployed) advanceHand();
          });
          this.publish();
        }
        makeTemple(x: number, y: number, color: number, label: string) {
          const shadow = this.add.ellipse(0, 22, 106, 35, 0x000000, .3);
          const base = this.add.rectangle(0, 0, 92, 62, color).setStrokeStyle(4, 0xffdf78);
          const roof = this.add.triangle(0, -47, -55, 0, 0, -42, 55, 0, color).setStrokeStyle(4, 0xffdf78);
          const title = this.add.text(0, 2, label, { fontFamily: "system-ui", fontSize: "14px", fontStyle: "bold", color: "#ffffff" }).setOrigin(.5);
          return this.add.container(x, y, [shadow, base, roof, title]).setDepth(7);
        }
        makeTower(chosenLane: Lane, side: Side): Tower {
          const x = chosenLane === "left" ? 268 : 458;
          const y = side === "player" ? 962 : 307;
          const shadow = this.add.ellipse(0, 24, 66, 24, 0x000000, .35);
          const base = this.add.rectangle(0, 3, 51, 58, side === "player" ? 0x2868a5 : 0x864469).setStrokeStyle(4, 0xe8c56a);
          const crown = this.add.triangle(0, -38, -32, 0, 0, -25, 32, 0, side === "player" ? 0x3e8bc3 : 0xaa5880).setStrokeStyle(3, 0xf2d77f);
          const light = this.add.circle(0, -8, 8, 0xffdf6c).setStrokeStyle(2, 0xffffff);
          const body = this.add.container(x, y, [shadow, base, crown, light]).setDepth(8);
          return { side, lane: chosenLane, life: 140, maxLife: 140, damage: 8, range: 205, attackAt: 0, body, bar: this.add.graphics().setDepth(13), alive: true };
        }
        makeFighter(card: Card, chosenLane: Lane, side: Side) {
          const x = chosenLane === "left" ? 268 : 458;
          const y = side === "player" ? 1080 : 190;
          const direction = side === "player" ? -1 : 1;
          const shadow = this.add.ellipse(0, 25, 48, 17, 0x000000, .34);
          const teamRing = this.add.circle(0, 18, 28).setStrokeStyle(4, side === "player" ? 0x52c7ff : 0xed6f9b, .9);
          let actor: GameObjects.GameObject;
          if (card.asset) actor = this.add.image(0, -8, `unit-${card.id}`).setDisplaySize(88, 88).setFlipX(side === "enemy");
          else {
            const body = this.add.rectangle(0, 5, 28, 39, card.color).setStrokeStyle(3, 0xf7dfa0);
            const head = this.add.circle(0, -19, 13, 0xe8b477).setStrokeStyle(2, 0x40291d);
            const badge = this.add.text(0, 5, card.symbol, { fontFamily: "Georgia", fontSize: "14px", fontStyle: "bold", color: "#ffffff" }).setOrigin(.5);
            actor = this.add.container(0, 0, [body, head, badge]);
          }
          const container = this.add.container(x, y, [shadow, teamRing, actor]).setDepth(10).setScale(side === "player" ? 1 : .96);
          const bar = this.add.graphics().setDepth(12);
          const fighter: Fighter = { side, lane: chosenLane, life: card.life, maxLife: card.life, damage: card.damage, speed: card.speed, range: card.range, attackAt: 0, body: container, bar, alive: true };
          this.fighters.push(fighter);
          this.tweens.add({ targets: container, scaleY: container.scaleY * .9, yoyo: true, repeat: -1, duration: 280, ease: "Sine.inOut" });
          this.burst(x, y, side === "player" ? 0xffd969 : 0xb77ae8);
        }
        burst(x: number, y: number, color: number) {
          const ring = this.add.circle(x, y, 12).setStrokeStyle(5, color).setDepth(15);
          this.tweens.add({ targets: ring, radius: 45, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
        }
        deploy(card: Card, chosenLane: Lane, side: Side) {
          if (this.finished) return false;
          const available = side === "player" ? this.faith : this.enemyFaith;
          if (available < card.cost) return false;
          if (side === "player") this.faith -= card.cost; else this.enemyFaith -= card.cost;
          this.makeFighter(card, chosenLane, side);
          this.publish();
          return true;
        }
        projectile(attacker: Fighter, target: Fighter) {
          const orb = this.add.circle(attacker.body.x, attacker.body.y, 6, attacker.side === "player" ? 0xffdc62 : 0xbd77e8).setDepth(14);
          this.tweens.add({ targets: orb, x: target.body.x, y: target.body.y, duration: 180, onComplete: () => orb.destroy() });
        }
        strike(attacker: Fighter, target: Fighter, time: number) {
          if (time < attacker.attackAt) return;
          attacker.attackAt = time + 720;
          if (attacker.range > 60) this.projectile(attacker, target);
          else this.tweens.add({ targets: attacker.body, x: attacker.body.x + (attacker.side === "player" ? -8 : 8), yoyo: true, duration: 90 });
          target.life -= attacker.damage;
          this.cameras.main.shake(70, .002);
          if (target.life <= 0) this.removeFighter(target);
        }
        towerStrike(tower: Tower, target: Fighter, time: number) {
          if (!tower.alive || time < tower.attackAt) return;
          tower.attackAt = time + 920;
          const orb = this.add.circle(tower.body.x, tower.body.y - 18, 7, tower.side === "player" ? 0x69d9ff : 0xf281b0).setDepth(14);
          this.tweens.add({ targets: orb, x: target.body.x, y: target.body.y, duration: 230, onComplete: () => orb.destroy() });
          target.life -= tower.damage;
          if (target.life <= 0) this.removeFighter(target);
        }
        hitTower(fighter: Fighter, tower: Tower, time: number) {
          if (time < fighter.attackAt || !tower.alive) return;
          fighter.attackAt = time + 760;
          tower.life = Math.max(0, tower.life - fighter.damage);
          this.tweens.add({ targets: tower.body, x: tower.body.x + (Math.random() > .5 ? 5 : -5), yoyo: true, duration: 90 });
          if (tower.life <= 0) {
            tower.alive = false; tower.bar.destroy(); this.burst(tower.body.x, tower.body.y, 0xffd766);
            this.tweens.add({ targets: tower.body, alpha: .22, scale: .7, angle: 8, duration: 420 });
          }
        }
        removeFighter(fighter: Fighter) {
          fighter.alive = false;
          fighter.bar.destroy();
          this.tweens.killTweensOf(fighter.body);
          this.tweens.add({ targets: fighter.body, alpha: 0, scale: 1.6, duration: 260, onComplete: () => fighter.body.destroy() });
        }
        hitTemple(fighter: Fighter, time: number) {
          if (time < fighter.attackAt) return;
          fighter.attackAt = time + 820;
          if (fighter.side === "player") this.enemyTemple = Math.max(0, this.enemyTemple - fighter.damage);
          else this.playerTemple = Math.max(0, this.playerTemple - fighter.damage);
          const core = fighter.side === "player" ? this.enemyCore : this.playerCore;
          this.tweens.add({ targets: core, angle: { from: -2, to: 2 }, yoyo: true, repeat: 2, duration: 65 });
          this.publish();
          if (this.playerTemple <= 0 || this.enemyTemple <= 0) this.end();
        }
        drawBar(fighter: Fighter) {
          fighter.bar.clear();
          fighter.bar.fillStyle(0x07131d, .85).fillRoundedRect(fighter.body.x - 22, fighter.body.y - 43, 44, 6, 3);
          fighter.bar.fillStyle(fighter.side === "player" ? 0x45dc94 : 0xe66b91, 1).fillRoundedRect(fighter.body.x - 21, fighter.body.y - 42, 42 * Math.max(0, fighter.life / fighter.maxLife), 4, 2);
        }
        drawTowerBar(tower: Tower) {
          if (!tower.alive) return;
          tower.bar.clear();
          tower.bar.fillStyle(0x07131d, .9).fillRoundedRect(tower.body.x - 31, tower.body.y - 60, 62, 8, 3);
          tower.bar.fillStyle(tower.side === "player" ? 0x55d5ff : 0xee79a3, 1).fillRoundedRect(tower.body.x - 30, tower.body.y - 59, 60 * (tower.life / tower.maxLife), 6, 2);
        }
        override update(time: number, delta: number) {
          if (this.finished) return;
          if (time - this.lastSecond >= 1000) { this.lastSecond = time; this.seconds = Math.max(0, this.seconds - 1); this.publish(); if (!this.seconds) this.end(); }
          if (time - this.lastFaith >= 1150) { this.lastFaith = time; this.faith = Math.min(10, this.faith + 1); this.enemyFaith = Math.min(10, this.enemyFaith + 1); this.publish(); }
          if (time - this.lastEnemyMove >= 2350) {
            this.lastEnemyMove = time;
            const affordable = deck.filter((card) => card.cost <= this.enemyFaith);
            const card = affordable[Math.floor(Math.random() * affordable.length)];
            if (card) this.deploy(card, Math.random() > .5 ? "left" : "right", "enemy");
          }
          for (const tower of this.towers) {
            this.drawTowerBar(tower);
            if (!tower.alive) continue;
            const targets = this.fighters.filter((unit) => unit.alive && unit.side !== tower.side && unit.lane === tower.lane && Math.abs(unit.body.y - tower.body.y) <= tower.range);
            const target = targets.sort((a, b) => Math.abs(a.body.y - tower.body.y) - Math.abs(b.body.y - tower.body.y))[0];
            if (target) this.towerStrike(tower, target, time);
          }
          for (const fighter of this.fighters.filter((unit) => unit.alive)) {
            this.drawBar(fighter);
            const enemies = this.fighters.filter((unit) => unit.alive && unit.side !== fighter.side && unit.lane === fighter.lane);
            const target = enemies.sort((a, b) => Math.abs(a.body.y - fighter.body.y) - Math.abs(b.body.y - fighter.body.y))[0];
            const distance = target ? Math.abs(target.body.y - fighter.body.y) : Infinity;
            if (target && distance <= fighter.range) this.strike(fighter, target, time);
            else {
              const tower = this.towers.find((item) => item.alive && item.side !== fighter.side && item.lane === fighter.lane);
              const towerDistance = tower ? Math.abs(fighter.body.y - tower.body.y) : Infinity;
              const templeY = fighter.side === "player" ? 105 : 1172;
              if (tower && towerDistance <= fighter.range + 34) this.hitTower(fighter, tower, time);
              else if (!tower && Math.abs(fighter.body.y - templeY) < 82) this.hitTemple(fighter, time);
              else fighter.body.y += (fighter.side === "player" ? -1 : 1) * fighter.speed * (delta / 1000);
            }
          }
          this.fighters = this.fighters.filter((unit) => unit.alive);
        }
        end() {
          this.finished = true;
          const state: Hud["state"] = this.playerTemple === this.enemyTemple ? "draw" : this.playerTemple > this.enemyTemple ? "won" : "lost";
          setHud((current) => ({ ...current, state, playerTemple: this.playerTemple, enemyTemple: this.enemyTemple, seconds: this.seconds }));
        }
        publish() { setHud({ playerTemple: this.playerTemple, enemyTemple: this.enemyTemple, faith: this.faith, seconds: this.seconds, state: this.finished ? "draw" : "playing" }); }
      }

      const scene = new ArenaScene();
      game = new Phaser.Game({ type: Phaser.AUTO, parent: hostRef.current, width: 720, height: 1280, backgroundColor: "#091725", scene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true, pixelArt: false } });
      apiRef.current = {
        deploy: (card, chosenLane, side = "player") => scene.deploy(card, chosenLane, side),
        restart: () => { scene.scene.restart(); setHud(initialHud); },
        fullscreen: () => { if (document.fullscreenElement) void document.exitFullscreen(); else void hostRef.current?.parentElement?.requestFullscreen(); }
      };
    });
    return () => { disposed = true; apiRef.current = null; game?.destroy(true); };
  }, []);

  const deploy = () => {
    const worked = apiRef.current?.deploy(selected, lane) ?? false;
    setMessage(worked ? `${selected.name} avançou pela ${lane === "left" ? "Rota do Vale" : "Rota das Muralhas"}.` : "Aguarde a Fé recarregar para usar esta carta.");
    if (worked) advanceHand();
  };
  const dropOnArena = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/x-apostolic-card");
    const card = cards.find((item) => item.id === id);
    if (!card) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const chosenLane: Lane = event.clientX - bounds.left < bounds.width / 2 ? "left" : "right";
    const worked = apiRef.current?.deploy(card, chosenLane) ?? false;
    setLane(chosenLane);
    setMessage(worked ? `${card.name} foi solto na ${chosenLane === "left" ? "Ponte do Vale" : "Ponte das Muralhas"}.` : "A carta voltou à mão: falta Fé para invocá-la.");
    if (worked) advanceHand();
  };
  const time = `${Math.floor(hud.seconds / 60)}:${String(hud.seconds % 60).padStart(2, "0")}`;

  return (
    <section className={styles.shell} aria-label="Apostolic Arena em tempo real">
      <div className={styles.toolbar}><div><p className="eyebrow">Vertical slice Phaser</p><h2>Vale do Começo</h2></div><strong className={styles.clock}>{time}</strong><button type="button" onClick={() => apiRef.current?.fullscreen()}>⛶ Tela cheia</button></div>
      <div className={styles.guide}><span className={styles.barnabas}>B</span><p><strong>Barnabé:</strong> {message} Toque na metade inferior da arena para invocar diretamente.</p></div>
      <div className={styles.stage} onDragOver={(event) => event.preventDefault()} onDrop={dropOnArena}>
        <div ref={hostRef} className={styles.canvas} />
        <div className={styles.hud} style={{ position: "absolute", zIndex: 28, inset: ".45rem .45rem auto", padding: ".45rem .6rem", borderRadius: ".7rem", background: "#06131ddd", backdropFilter: "blur(6px)" }}><span>Templo <b>{hud.playerTemple}</b></span><div><i style={{ width: `${hud.faith * 10}%` }} /></div><span>Fé <b>{hud.faith}/10</b></span><span>Rival <b>{hud.enemyTemple}</b></span></div>
        <div style={{ position: "absolute", zIndex: 30, inset: "auto .35rem .35rem", padding: ".4rem", border: "1px solid #e8c56a88", borderRadius: ".75rem", background: "#071522e8", backdropFilter: "blur(7px)" }}>
          <small style={{ display: "block", marginBottom: ".3rem", color: "#d8e5ef" }}>Próxima: {nextCard.name} · Arraste uma carta para a rota</small>
          <div className={styles.deck}>{hand.map((card) => <button draggable key={`${card.id}-${handOffset}`} className={selected.id === card.id ? styles.selected : ""} onDragStart={(event) => { event.dataTransfer.setData("application/x-apostolic-card", card.id); event.dataTransfer.effectAllowed = "move"; setSelected(card); }} onClick={() => setSelected(card)}>{card.asset ? <img src={card.asset} alt="" width={54} height={54} style={{ width: "3.3rem", height: "3.3rem", objectFit: "contain", filter: "drop-shadow(0 4px 4px #0008)" }} /> : <span style={{ backgroundColor: `#${card.color.toString(16).padStart(6, "0")}` }}>{card.symbol}</span>}<strong>{card.name}</strong><small>{card.cost} Fé · {card.damage} poder</small></button>)}</div>
        </div>
        {hud.state !== "playing" && <div className={styles.result}><h2>{hud.state === "won" ? "Vitória!" : hud.state === "lost" ? "Continue a treinar" : "Empate"}</h2><p>Templo da Luz {hud.playerTemple} × {hud.enemyTemple} Templo de treino</p><button className="button button-primary" onClick={() => apiRef.current?.restart()}>Jogar novamente</button></div>}
      </div>
      <div className={styles.lanes}><button className={lane === "left" ? styles.active : ""} onClick={() => setLane("left")}>Ponte do Vale</button><button className={lane === "right" ? styles.active : ""} onClick={() => setLane("right")}>Ponte das Muralhas</button></div>
      <button className={`button button-primary ${styles.deploy}`} type="button" onClick={deploy}>Invocar {selected.name}</button>
    </section>
  );
}
