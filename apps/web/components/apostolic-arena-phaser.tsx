"use client";

import type { GameObjects } from "phaser";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./apostolic-arena-phaser.module.css";

type Lane = "left" | "right";
type Side = "player" | "enemy";
type Card = { id: string; name: string; cost: number; life: number; damage: number; speed: number; range: number; color: number; symbol: string };
type Hud = { playerTemple: number; enemyTemple: number; faith: number; seconds: number; state: "playing" | "won" | "lost" | "draw" };
type ArenaApi = { deploy: (card: Card, lane: Lane, side?: Side) => boolean; restart: () => void; fullscreen: () => void };
type Fighter = { side: Side; lane: Lane; life: number; maxLife: number; damage: number; speed: number; range: number; attackAt: number; body: GameObjects.Container; bar: GameObjects.Graphics; alive: boolean };

const deck: Card[] = [
  { id: "guardiao", name: "Guardião", cost: 3, life: 72, damage: 12, speed: 30, range: 42, color: 0x2d78c9, symbol: "G" },
  { id: "mensageira", name: "Mensageira", cost: 3, life: 48, damage: 15, speed: 40, range: 125, color: 0x9a5bd1, symbol: "M" },
  { id: "servo", name: "Servo", cost: 2, life: 42, damage: 9, speed: 52, range: 38, color: 0xd49832, symbol: "S" },
  { id: "sentinela", name: "Sentinela", cost: 4, life: 105, damage: 10, speed: 23, range: 42, color: 0x238b7b, symbol: "T" },
  { id: "unidade", name: "Unidade", cost: 5, life: 92, damage: 18, speed: 34, range: 44, color: 0xc0527b, symbol: "U" },
  { id: "peregrino", name: "Peregrino", cost: 2, life: 38, damage: 8, speed: 62, range: 36, color: 0xd86831, symbol: "P" },
  { id: "arqueira", name: "Arqueira", cost: 4, life: 53, damage: 17, speed: 36, range: 145, color: 0x3d9fc3, symbol: "A" },
  { id: "porta-voz", name: "Porta-voz", cost: 5, life: 66, damage: 22, speed: 31, range: 115, color: 0x5965cb, symbol: "V" }
];

const initialHud: Hud = { playerTemple: 100, enemyTemple: 100, faith: 6, seconds: 180, state: "playing" };

export function ApostolicArenaPhaser() {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ArenaApi | null>(null);
  const [hud, setHud] = useState(initialHud);
  const [selected, setSelected] = useState<Card>(deck[0] as Card);
  const [lane, setLane] = useState<Lane>("left");
  const [message, setMessage] = useState("Escolha uma unidade e envie-a por uma das pontes.");
  const cards = useMemo(() => deck, []);

  useEffect(() => {
    let disposed = false;
    let game: import("phaser").Game | null = null;

    void import("phaser").then(({ default: Phaser }) => {
      if (disposed || !hostRef.current) return;

      class ArenaScene extends Phaser.Scene {
        fighters: Fighter[] = [];
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

        constructor() { super("apostolic-arena"); }
        preload() { this.load.image("arena-bg", "/games/apostolic-arena/valley-of-beginning-v1.png"); }
        create() {
          const background = this.add.image(360, 640, "arena-bg");
          background.setDisplaySize(720, 1280);
          this.effects = this.add.graphics().setDepth(9);
          this.enemyCore = this.makeTemple(360, 105, 0x7050a4, "TREINO");
          this.playerCore = this.makeTemple(360, 1172, 0xd6a744, "LUZ");
          this.add.text(18, 625, "VALE", { fontFamily: "system-ui", fontSize: "15px", fontStyle: "bold", color: "#f9edc0", backgroundColor: "#071521bb", padding: { x: 8, y: 4 } }).setDepth(8);
          this.add.text(626, 625, "MURALHA", { fontFamily: "system-ui", fontSize: "15px", fontStyle: "bold", color: "#f9edc0", backgroundColor: "#071521bb", padding: { x: 8, y: 4 } }).setOrigin(1, 0).setDepth(8);
          this.publish();
        }
        makeTemple(x: number, y: number, color: number, label: string) {
          const shadow = this.add.ellipse(0, 22, 106, 35, 0x000000, .3);
          const base = this.add.rectangle(0, 0, 92, 62, color).setStrokeStyle(4, 0xffdf78);
          const roof = this.add.triangle(0, -47, -55, 0, 0, -42, 55, 0, color).setStrokeStyle(4, 0xffdf78);
          const title = this.add.text(0, 2, label, { fontFamily: "system-ui", fontSize: "14px", fontStyle: "bold", color: "#ffffff" }).setOrigin(.5);
          return this.add.container(x, y, [shadow, base, roof, title]).setDepth(7);
        }
        makeFighter(card: Card, chosenLane: Lane, side: Side) {
          const x = chosenLane === "left" ? 268 : 458;
          const y = side === "player" ? 1080 : 190;
          const direction = side === "player" ? -1 : 1;
          const cape = this.add.triangle(-9, 7, -13, -13, -23, 24, 2, 21, side === "player" ? 0x174c85 : 0x742f55);
          const body = this.add.rectangle(0, 8, 25, 35, card.color).setStrokeStyle(3, 0xf7dfa0);
          const head = this.add.circle(0, -17, 12, 0xe8b477).setStrokeStyle(2, 0x40291d);
          const badge = this.add.text(0, 8, card.symbol, { fontFamily: "Georgia", fontSize: "14px", fontStyle: "bold", color: "#ffffff" }).setOrigin(.5);
          const container = this.add.container(x, y, [cape, body, head, badge]).setDepth(10).setScale(side === "player" ? 1 : .96);
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
          for (const fighter of this.fighters.filter((unit) => unit.alive)) {
            this.drawBar(fighter);
            const enemies = this.fighters.filter((unit) => unit.alive && unit.side !== fighter.side && unit.lane === fighter.lane);
            const target = enemies.sort((a, b) => Math.abs(a.body.y - fighter.body.y) - Math.abs(b.body.y - fighter.body.y))[0];
            const distance = target ? Math.abs(target.body.y - fighter.body.y) : Infinity;
            if (target && distance <= fighter.range) this.strike(fighter, target, time);
            else {
              const templeY = fighter.side === "player" ? 105 : 1172;
              if (Math.abs(fighter.body.y - templeY) < 82) this.hitTemple(fighter, time);
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
  };
  const time = `${Math.floor(hud.seconds / 60)}:${String(hud.seconds % 60).padStart(2, "0")}`;

  return (
    <section className={styles.shell} aria-label="Apostolic Arena em tempo real">
      <div className={styles.toolbar}><div><p className="eyebrow">Vertical slice Phaser</p><h2>Vale do Começo</h2></div><strong className={styles.clock}>{time}</strong><button type="button" onClick={() => apiRef.current?.fullscreen()}>⛶ Tela cheia</button></div>
      <div className={styles.guide}><span className={styles.barnabas}>B</span><p><strong>Barnabé:</strong> {message}</p></div>
      <div className={styles.stage}><div ref={hostRef} className={styles.canvas} />{hud.state !== "playing" && <div className={styles.result}><h2>{hud.state === "won" ? "Vitória!" : hud.state === "lost" ? "Continue a treinar" : "Empate"}</h2><p>Templo da Luz {hud.playerTemple} × {hud.enemyTemple} Templo de treino</p><button className="button button-primary" onClick={() => apiRef.current?.restart()}>Jogar novamente</button></div>}</div>
      <div className={styles.hud}><span>Templo <b>{hud.playerTemple}</b></span><div><i style={{ width: `${hud.faith * 10}%` }} /></div><span>Fé <b>{hud.faith}/10</b></span><span>Rival <b>{hud.enemyTemple}</b></span></div>
      <div className={styles.lanes}><button className={lane === "left" ? styles.active : ""} onClick={() => setLane("left")}>Ponte do Vale</button><button className={lane === "right" ? styles.active : ""} onClick={() => setLane("right")}>Ponte das Muralhas</button></div>
      <div className={styles.deck}>{cards.map((card) => <button key={card.id} className={selected.id === card.id ? styles.selected : ""} onClick={() => setSelected(card)}><span style={{ backgroundColor: `#${card.color.toString(16).padStart(6, "0")}` }}>{card.symbol}</span><strong>{card.name}</strong><small>{card.cost} Fé · {card.damage} poder</small></button>)}</div>
      <button className={`button button-primary ${styles.deploy}`} type="button" onClick={deploy}>Invocar {selected.name}</button>
    </section>
  );
}
