"use client";

import { useEffect, useRef } from "react";
import type { AbstractMesh, StandardMaterial, TransformNode } from "@babylonjs/core";

type SceneMode = "loading" | "menu";

export type ArenaSceneChampion = {
  id: number;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
  faith: number;
  type: string;
};

export type ArenaPowerSignal = {
  championId: number;
  nonce: number;
};

type PowerKind = "waters" | "harp" | "frenzy" | "shield" | "generic";
type FeaturedVisual = { image: string; power: PowerKind; height: number };

type AnimatedActor = {
  root: TransformNode;
  action: TransformNode;
  effects: TransformNode;
  effectMeshes: AbstractMesh[];
  baseY: number;
  championId: number;
  powerKind: PowerKind;
  powerStartedAt: number;
};

const FEATURED_VISUALS: Record<number, FeaturedVisual> = {
  117: { image: "/games/apostolic-arena/characters/dashboard/117-moises-o-libertador-v1.png", power: "waters", height: 5.25 },
  119: { image: "/games/apostolic-arena/characters/dashboard/119-davi-o-rei-campeao-v1.png", power: "harp", height: 5.05 },
  121: { image: "/games/apostolic-arena/characters/dashboard/121-sansao-o-inabalavel-v1.png", power: "frenzy", height: 5.15 },
  125: { image: "/games/apostolic-arena/characters/dashboard/125-debora-a-juiza-campea-v1.png", power: "shield", height: 5.1 }
};

const DEFAULT_CHAMPIONS: ArenaSceneChampion[] = [
  { id: 117, name: "Moisés, o Libertador", rarity: "champion", faith: 5, type: "Campeão líder" },
  { id: 119, name: "Davi, o Rei Campeão", rarity: "champion", faith: 5, type: "Campeão monarca" },
  { id: 121, name: "Sansão, o Inabalável", rarity: "champion", faith: 6, type: "Campeão tanque" },
  { id: 125, name: "Débora, a Juíza Campeã", rarity: "champion", faith: 4, type: "Campeã inspiradora" }
];

export function ApostolicArena3DScene({ mode, champions = DEFAULT_CHAMPIONS, powerSignal, onProgress, onReady }: {
  mode: SceneMode;
  champions?: ArenaSceneChampion[];
  powerSignal?: ArenaPowerSignal | null;
  onProgress?: (progress: number, label: string) => void;
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const powerSignalRef = useRef(powerSignal);

  useEffect(() => { powerSignalRef.current = powerSignal; }, [powerSignal]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    onProgress?.(12, "Abrindo o Salão dos Campeões");

    void import("@babylonjs/core").then((BABYLON) => {
      if (disposed || !canvasRef.current) return;
      onProgress?.(42, "Materializando os quatro heróis");

      const canvas = canvasRef.current;
      const engine = new BABYLON.Engine(canvas, true, {
        antialias: true,
        preserveDrawingBuffer: false,
        stencil: true,
        powerPreference: "high-performance"
      });
      engine.setHardwareScalingLevel(window.devicePixelRatio > 1.5 ? 1.3 : 1);
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0.012, 0.024, 0.045, 1);
      scene.imageProcessingConfiguration.contrast = 1.14;
      scene.imageProcessingConfiguration.exposure = 1.04;

      const camera = new BABYLON.ArcRotateCamera(
        "champion-hall-camera",
        -Math.PI / 2,
        1.14,
        mode === "loading" ? 21.5 : 18.4,
        new BABYLON.Vector3(0, 2.25, 0),
        scene
      );
      camera.lowerRadiusLimit = 17;
      camera.upperRadiusLimit = 21.5;
      camera.lowerBetaLimit = 1.04;
      camera.upperBetaLimit = 1.23;
      camera.lowerAlphaLimit = -1.68;
      camera.upperAlphaLimit = -1.46;
      camera.wheelPrecision = 120;
      camera.panningSensibility = 0;
      camera.attachControl(canvas, true);

      const sky = new BABYLON.HemisphericLight("sky", new BABYLON.Vector3(0, 1, 0), scene);
      sky.intensity = 1.05;
      sky.diffuse = new BABYLON.Color3(0.58, 0.72, 1);
      sky.groundColor = new BABYLON.Color3(0.2, 0.11, 0.045);
      const sunrise = new BABYLON.DirectionalLight("sunrise", new BABYLON.Vector3(-0.45, -1, 0.5), scene);
      sunrise.intensity = 2.1;
      sunrise.diffuse = new BABYLON.Color3(1, 0.67, 0.34);

      const standardMaterial = (name: string, color: [number, number, number], emissive?: [number, number, number], alpha = 1) => {
        const value = new BABYLON.StandardMaterial(name, scene);
        value.diffuseColor = new BABYLON.Color3(...color);
        value.specularColor = new BABYLON.Color3(0.32, 0.27, 0.18);
        value.alpha = alpha;
        if (emissive) value.emissiveColor = new BABYLON.Color3(...emissive);
        return value;
      };

      const backdropMaterial = new BABYLON.StandardMaterial("real-champion-hall-material", scene);
      const backdropTexture = new BABYLON.Texture("/games/apostolic-arena/scenes/champion-hall-real-v1.webp", scene, true, false);
      backdropMaterial.diffuseTexture = backdropTexture;
      backdropMaterial.emissiveTexture = backdropTexture;
      backdropMaterial.emissiveColor = new BABYLON.Color3(0.62, 0.62, 0.62);
      backdropMaterial.disableLighting = true;
      backdropMaterial.backFaceCulling = false;
      const backdrop = BABYLON.MeshBuilder.CreatePlane("real-champion-hall", { width: 32.5, height: 18.28 }, scene);
      backdrop.position = new BABYLON.Vector3(0, 5.2, 6.5);
      backdrop.material = backdropMaterial;
      backdrop.applyFog = false;

      const darkStone = standardMaterial("dark-stone", [0.035, 0.05, 0.08]);
      const gold = standardMaterial("gold", [0.74, 0.39, 0.055], [0.2, 0.08, 0.004]);
      const blue = standardMaterial("portal-blue", [0.015, 0.24, 0.62], [0.04, 0.5, 1]);
      const aqua = standardMaterial("water-power", [0.02, 0.44, 0.78], [0.02, 0.42, 0.88], 0.72);
      const warmGold = standardMaterial("harp-power", [0.88, 0.55, 0.08], [0.55, 0.24, 0.015], 0.78);
      const frenzy = standardMaterial("frenzy-power", [0.88, 0.12, 0.03], [0.65, 0.06, 0.01], 0.76);
      const shield = standardMaterial("shield-power", [0.04, 0.7, 0.72], [0.04, 0.45, 0.72], 0.28);
      shield.backFaceCulling = false;

      const foreground = BABYLON.MeshBuilder.CreateCylinder("foreground-depth", { diameter: 15.8, height: 0.18, tessellation: 72 }, scene);
      foreground.position = new BABYLON.Vector3(0, -0.16, -0.2);
      foreground.scaling.z = 0.5;
      foreground.material = darkStone;
      const floorRing = BABYLON.MeshBuilder.CreateTorus("foreground-ring", { diameter: 13.8, thickness: 0.07, tessellation: 96 }, scene);
      floorRing.rotation.x = Math.PI / 2;
      floorRing.position.y = -0.04;
      floorRing.scaling.z = 0.52;
      floorRing.material = gold;

      const actors: AnimatedActor[] = [];
      const positions = [-5.1, -1.72, 1.72, 5.1];

      const addRingEffects = (effects: TransformNode, championId: number, material: StandardMaterial, vertical = false) => {
        const meshes: AbstractMesh[] = [];
        for (let index = 0; index < 3; index += 1) {
          const ring = BABYLON.MeshBuilder.CreateTorus(`power-ring-${championId}-${index}`, { diameter: 2.1 + index * 0.55, thickness: 0.075, tessellation: 48 }, scene);
          ring.parent = effects;
          ring.position.y = 0.65 + index * 0.68;
          ring.rotation.x = vertical ? 0 : Math.PI / 2;
          ring.material = material;
          meshes.push(ring);
        }
        return meshes;
      };

      const makeFeaturedChampion = (champion: ArenaSceneChampion, index: number, visual: FeaturedVisual) => {
        const root = new BABYLON.TransformNode(`real-champion-${champion.id}`, scene);
        root.position = new BABYLON.Vector3(positions[index] ?? 0, 0.08, index % 2 === 0 ? -0.08 : 0.04);
        const action = new BABYLON.TransformNode(`real-action-${champion.id}`, scene);
        action.parent = root;
        const effects = new BABYLON.TransformNode(`real-effects-${champion.id}`, scene);
        effects.parent = root;

        const pedestal = BABYLON.MeshBuilder.CreateCylinder(`hero-pedestal-${champion.id}`, { diameter: 2.42, height: 0.18, tessellation: 48 }, scene);
        pedestal.parent = root;
        pedestal.position.y = -0.02;
        pedestal.material = blue;
        const pedestalRing = BABYLON.MeshBuilder.CreateTorus(`hero-ring-${champion.id}`, { diameter: 2.18, thickness: 0.075, tessellation: 64 }, scene);
        pedestalRing.parent = root;
        pedestalRing.rotation.x = Math.PI / 2;
        pedestalRing.position.y = 0.08;
        pedestalRing.material = gold;

        const heroTexture = new BABYLON.Texture(visual.image, scene, true, false);
        heroTexture.hasAlpha = true;
        const heroMaterial = new BABYLON.StandardMaterial(`hero-material-${champion.id}`, scene);
        heroMaterial.diffuseTexture = heroTexture;
        heroMaterial.opacityTexture = heroTexture;
        heroMaterial.useAlphaFromDiffuseTexture = true;
        heroMaterial.emissiveColor = new BABYLON.Color3(0.17, 0.17, 0.17);
        heroMaterial.specularColor = BABYLON.Color3.Black();
        heroMaterial.backFaceCulling = false;
        heroMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHATESTANDBLEND;

        const hero = BABYLON.MeshBuilder.CreatePlane(`hero-figure-${champion.id}`, { width: visual.height * 0.75, height: visual.height, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        hero.parent = action;
        hero.position.y = visual.height / 2 + 0.13;
        hero.position.z = -0.04;
        hero.material = heroMaterial;
        hero.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;

        const shadowMaterial = new BABYLON.StandardMaterial(`hero-shadow-${champion.id}`, scene);
        shadowMaterial.diffuseColor = BABYLON.Color3.Black();
        shadowMaterial.emissiveColor = BABYLON.Color3.Black();
        shadowMaterial.alpha = 0.42;
        const groundShadow = BABYLON.MeshBuilder.CreateDisc(`ground-shadow-${champion.id}`, { radius: 1.15, tessellation: 48 }, scene);
        groundShadow.parent = root;
        groundShadow.rotation.x = Math.PI / 2;
        groundShadow.scaling.y = 0.42;
        groundShadow.position.y = 0.1;
        groundShadow.material = shadowMaterial;

        let effectMeshes: AbstractMesh[] = [];
        if (visual.power === "waters") {
          for (const side of [-1, 1]) {
            const wave = BABYLON.MeshBuilder.CreateSphere(`water-wall-${champion.id}-${side}`, { diameter: 2.15, segments: 24 }, scene);
            wave.parent = effects;
            wave.position = new BABYLON.Vector3(side * 1.05, 1.45, 0.25);
            wave.scaling = new BABYLON.Vector3(0.36, 1.4, 0.26);
            wave.material = aqua;
            effectMeshes.push(wave);
          }
        } else if (visual.power === "harp") {
          effectMeshes = addRingEffects(effects, champion.id, warmGold, true);
        } else if (visual.power === "frenzy") {
          for (let streakIndex = 0; streakIndex < 7; streakIndex += 1) {
            const streak = BABYLON.MeshBuilder.CreateCylinder(`frenzy-streak-${champion.id}-${streakIndex}`, { diameter: 0.065, height: 2.9, tessellation: 8 }, scene);
            streak.parent = effects;
            const angle = (Math.PI * 2 * streakIndex) / 7;
            streak.position = new BABYLON.Vector3(Math.cos(angle) * 1.02, 1.55, Math.sin(angle) * 0.42);
            streak.rotation.z = Math.sin(angle) * 0.22;
            streak.material = frenzy;
            effectMeshes.push(streak);
          }
        } else if (visual.power === "shield") {
          const dome = BABYLON.MeshBuilder.CreateSphere(`shield-dome-${champion.id}`, { diameter: 4.15, segments: 32, slice: 0.72 }, scene);
          dome.parent = effects;
          dome.position.y = 1.95;
          dome.scaling.z = 0.55;
          dome.material = shield;
          effectMeshes.push(dome);
          effectMeshes.push(...addRingEffects(effects, champion.id, aqua));
        }
        effects.setEnabled(false);
        actors.push({ root, action, effects, effectMeshes, baseY: root.position.y, championId: champion.id, powerKind: visual.power, powerStartedAt: -100 });
      };

      const makeFallbackChampion = (champion: ArenaSceneChampion, index: number) => {
        const root = new BABYLON.TransformNode(`fallback-champion-${champion.id}`, scene);
        root.position = new BABYLON.Vector3(positions[index] ?? 0, 0.08, 0);
        const action = new BABYLON.TransformNode(`fallback-action-${champion.id}`, scene);
        action.parent = root;
        const effects = new BABYLON.TransformNode(`fallback-effects-${champion.id}`, scene);
        effects.parent = root;
        const robe = BABYLON.MeshBuilder.CreateCylinder(`fallback-robe-${champion.id}`, { diameterTop: 1.05, diameterBottom: 1.65, height: 2.35, tessellation: 16 }, scene);
        robe.parent = root;
        robe.position.y = 1.3;
        robe.material = blue;
        const torso = BABYLON.MeshBuilder.CreateCapsule(`fallback-torso-${champion.id}`, { radius: 0.55, height: 1.75 }, scene);
        torso.parent = action;
        torso.position.y = 2.45;
        torso.material = gold;
        const head = BABYLON.MeshBuilder.CreateSphere(`fallback-head-${champion.id}`, { diameter: 0.82, segments: 18 }, scene);
        head.parent = action;
        head.position.y = 3.5;
        head.material = warmGold;
        effects.setEnabled(false);
        actors.push({ root, action, effects, effectMeshes: [], baseY: root.position.y, championId: champion.id, powerKind: "generic", powerStartedAt: -100 });
      };

      if (mode === "menu") {
        const roster = champions.length ? champions.slice(0, 4) : DEFAULT_CHAMPIONS;
        roster.forEach((champion, index) => {
          const visual = FEATURED_VISUALS[champion.id];
          if (visual) makeFeaturedChampion(champion, index, visual);
          else makeFallbackChampion(champion, index);
        });
      }

      const glow = new BABYLON.GlowLayer("arena-glow", scene, { blurKernelSize: 48 });
      glow.intensity = 0.74;

      let clock = 0;
      let lastPowerNonce = -1;
      let nextAutomaticPower = 2.2;
      let automaticIndex = 0;
      scene.onBeforeRenderObservable.add(() => {
        const delta = engine.getDeltaTime() / 1000;
        clock += delta;
        floorRing.rotation.z += delta * 0.045;

        const signal = powerSignalRef.current;
        if (signal && signal.nonce !== lastPowerNonce) {
          lastPowerNonce = signal.nonce;
          const actor = actors.find((entry) => entry.championId === signal.championId);
          if (actor) actor.powerStartedAt = clock;
        }
        if (mode === "menu" && actors.length && clock >= nextAutomaticPower) {
          actors[automaticIndex % actors.length]!.powerStartedAt = clock;
          automaticIndex += 1;
          nextAutomaticPower = clock + 5.2;
        }

        actors.forEach((actor, index) => {
          const idle = Math.sin(clock * 1.55 + index * 0.72);
          actor.root.position.y = actor.baseY + idle * 0.035;
          actor.action.rotation.z = idle * 0.012;
          actor.action.scaling.y = 1 + Math.sin(clock * 1.8 + index) * 0.006;

          const elapsed = clock - actor.powerStartedAt;
          const active = elapsed >= 0 && elapsed < 4;
          actor.effects.setEnabled(active);
          if (!active) return;
          const pulse = 1 + Math.sin(elapsed * 7.2) * 0.08;
          actor.effects.scaling.setAll(pulse);
          actor.effects.rotation.y += delta * (actor.powerKind === "frenzy" ? 2.5 : 0.85);
          actor.effectMeshes.forEach((mesh, effectIndex) => {
            mesh.visibility = Math.min(1, elapsed * 3.4) * Math.min(1, (4 - elapsed) * 2.5);
            if (actor.powerKind === "harp" || actor.powerKind === "shield") {
              const spread = 1 + elapsed * (0.18 + effectIndex * 0.025);
              mesh.scaling.x = spread;
              mesh.scaling.z = spread;
            }
            if (actor.powerKind === "waters") mesh.position.x += Math.sign(mesh.position.x) * delta * 0.08;
          });
        });
      });

      const resize = () => engine.resize();
      window.addEventListener("resize", resize);
      engine.runRenderLoop(() => scene.render());
      onProgress?.(86, "Preparando poderes e cartas");
      scene.executeWhenReady(() => {
        if (disposed) return;
        onProgress?.(100, "Tudo pronto");
        onReady?.();
      });

      cleanup = () => {
        window.removeEventListener("resize", resize);
        scene.dispose();
        engine.dispose();
      };
    }).catch(() => {
      onProgress?.(100, "Modo compatível preparado");
      onReady?.();
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [champions, mode, onProgress, onReady]);

  return <canvas ref={canvasRef} aria-label={mode === "loading" ? "Portal realista de carregamento" : "Quatro personagens humanos no Salão dos Campeões"} />;
}
