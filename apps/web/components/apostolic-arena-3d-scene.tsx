"use client";

import { useEffect, useRef } from "react";
import type { TransformNode } from "@babylonjs/core";

type SceneMode = "loading" | "menu";

export type ArenaSceneChampion = {
  id: number;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "champion";
  faith: number;
  type: string;
};

type ChampionArchetype = "ranged" | "guardian" | "support" | "scout";

type AnimatedActor = {
  root: TransformNode;
  action: TransformNode;
  baseY: number;
  archetype: ChampionArchetype;
  wings: TransformNode[];
};

const DEFAULT_CHAMPIONS: ArenaSceneChampion[] = [
  { id: 1, name: "Davi e a Funda", rarity: "common", faith: 2, type: "Tropa terrestre" },
  { id: 2, name: "Soldados de Israel", rarity: "common", faith: 3, type: "Horda" },
  { id: 5, name: "Arqueiros de Judá", rarity: "rare", faith: 3, type: "Tropa de distância" },
  { id: 11, name: "Sacerdote Levita", rarity: "epic", faith: 3, type: "Suporte terrestre" }
];

function championArchetype(champion: ArenaSceneChampion): ChampionArchetype {
  const descriptor = `${champion.name} ${champion.type}`.toLocaleLowerCase("pt");
  if (/aérea|pomba|codorn|ave|águia|animal/.test(descriptor)) return "scout";
  if (/suporte|cura|sacerd|profeta|oração|sabedoria|levita/.test(descriptor)) return "support";
  if (/distância|arqueir|funda|fundib|atirador|vigia|lança/.test(descriptor)) return "ranged";
  return "guardian";
}

export function ApostolicArena3DScene({ mode, champions = DEFAULT_CHAMPIONS, onProgress, onReady }: {
  mode: SceneMode;
  champions?: ArenaSceneChampion[];
  onProgress?: (progress: number, label: string) => void;
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    onProgress?.(12, "Abrindo o Salão dos Campeões");

    void import("@babylonjs/core").then((BABYLON) => {
      if (disposed || !canvasRef.current) return;
      onProgress?.(42, "Reunindo os quatro heróis do baralho");

      const canvas = canvasRef.current;
      const engine = new BABYLON.Engine(canvas, true, {
        antialias: true,
        preserveDrawingBuffer: false,
        stencil: true,
        powerPreference: "high-performance"
      });
      engine.setHardwareScalingLevel(window.devicePixelRatio > 1.5 ? 1.35 : 1);
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0.015, 0.035, 0.07, 1);
      scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
      scene.fogDensity = 0.008;
      scene.fogColor = new BABYLON.Color3(0.04, 0.09, 0.16);

      const camera = new BABYLON.ArcRotateCamera(
        "arena-menu-camera",
        -Math.PI / 2,
        1.08,
        mode === "loading" ? 23 : 20.5,
        new BABYLON.Vector3(0, 2.3, 0),
        scene
      );
      camera.lowerRadiusLimit = 16;
      camera.upperRadiusLimit = 26;
      camera.lowerBetaLimit = 0.82;
      camera.upperBetaLimit = 1.25;
      camera.wheelPrecision = 80;
      camera.panningSensibility = 0;
      camera.attachControl(canvas, true);

      const sky = new BABYLON.HemisphericLight("sky", new BABYLON.Vector3(0, 1, 0), scene);
      sky.intensity = 0.9;
      sky.diffuse = new BABYLON.Color3(0.54, 0.7, 1);
      sky.groundColor = new BABYLON.Color3(0.16, 0.08, 0.035);
      const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.35, -1, 0.55), scene);
      sun.intensity = 2.2;
      sun.diffuse = new BABYLON.Color3(1, 0.68, 0.32);

      const material = (name: string, diffuse: [number, number, number], emissive?: [number, number, number]) => {
        const value = new BABYLON.StandardMaterial(name, scene);
        value.diffuseColor = new BABYLON.Color3(...diffuse);
        value.specularColor = new BABYLON.Color3(0.25, 0.22, 0.16);
        if (emissive) value.emissiveColor = new BABYLON.Color3(...emissive);
        return value;
      };
      const sandstone = material("sandstone", [0.39, 0.25, 0.12]);
      const darkStone = material("dark-stone", [0.075, 0.1, 0.15]);
      const bronze = material("bronze", [0.43, 0.24, 0.08], [0.08, 0.035, 0.005]);
      const portalMaterial = material("portal", [0.02, 0.22, 0.55], [0.08, 0.62, 1]);
      const gold = material("gold", [0.75, 0.43, 0.08], [0.24, 0.11, 0.01]);
      const skin = material("skin", [0.52, 0.28, 0.14]);
      const rarityMaterials = {
        common: material("rarity-common", [0.03, 0.28, 0.62], [0.04, 0.28, 0.75]),
        rare: material("rarity-rare", [0.04, 0.42, 0.2], [0.03, 0.25, 0.1]),
        epic: material("rarity-epic", [0.35, 0.08, 0.56], [0.2, 0.04, 0.38]),
        legendary: material("rarity-legendary", [0.58, 0.04, 0.07], [0.34, 0.02, 0.03]),
        champion: material("rarity-champion", [0.78, 0.45, 0.06], [0.38, 0.19, 0.01])
      };

      const floor = BABYLON.MeshBuilder.CreateCylinder("champion-hall", { diameter: 22, height: 0.65, tessellation: 48 }, scene);
      floor.position.y = -0.35;
      floor.material = sandstone;
      const innerFloor = BABYLON.MeshBuilder.CreateCylinder("light-platform", { diameter: 12.5, height: 0.24, tessellation: 48 }, scene);
      innerFloor.position.y = 0.08;
      innerFloor.material = darkStone;

      const ring = BABYLON.MeshBuilder.CreateTorus("platform-ring", { diameter: 11.3, thickness: 0.14, tessellation: 72 }, scene);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.24;
      ring.material = gold;

      const portal = BABYLON.MeshBuilder.CreateTorus("portal", { diameter: 8.2, thickness: 0.48, tessellation: 72 }, scene);
      portal.position = new BABYLON.Vector3(0, 4.5, 3.4);
      portal.material = portalMaterial;
      const portalInner = BABYLON.MeshBuilder.CreateDisc("portal-light", { radius: 3.75, tessellation: 72 }, scene);
      portalInner.position = new BABYLON.Vector3(0, 4.5, 3.44);
      portalInner.material = rarityMaterials.common;
      portalInner.visibility = 0.7;

      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        const column = BABYLON.MeshBuilder.CreateCylinder(`column-${index}`, { diameter: 1, height: 5.8, tessellation: 10 }, scene);
        column.position = new BABYLON.Vector3(Math.cos(angle) * 9.2, 2.55, Math.sin(angle) * 9.2);
        column.material = sandstone;
        const cap = BABYLON.MeshBuilder.CreateCylinder(`cap-${index}`, { diameter: 1.35, height: 0.35, tessellation: 10 }, scene);
        cap.position = column.position.add(new BABYLON.Vector3(0, 3.02, 0));
        cap.material = bronze;
        if (index % 2 === 0) {
          const gem = BABYLON.MeshBuilder.CreatePolyhedron(`crystal-${index}`, { type: 1, size: 0.62 }, scene);
          gem.position = column.position.add(new BABYLON.Vector3(0, 3.85, 0));
          gem.material = rarityMaterials.common;
        }
      }

      const actors: AnimatedActor[] = [];
      const makeChampion = (champion: ArenaSceneChampion, index: number) => {
        const archetype = championArchetype(champion);
        const root = new BABYLON.TransformNode(`deck-champion-${champion.id}`, scene);
        const positions = [-4.65, -1.55, 1.55, 4.65];
        root.position = new BABYLON.Vector3(positions[index] ?? 0, 0.28, index % 2 === 0 ? -0.35 : 0.15);
        root.scaling.setAll(index === 1 || index === 2 ? 1.04 : 0.94);
        const accent = rarityMaterials[champion.rarity];

        const pedestal = BABYLON.MeshBuilder.CreateCylinder(`pedestal-${champion.id}`, { diameter: 2.25, height: 0.22, tessellation: 40 }, scene);
        pedestal.parent = root;
        pedestal.position.y = -0.1;
        pedestal.material = accent;
        const action = new BABYLON.TransformNode(`action-${champion.id}`, scene);
        action.parent = root;
        const wings: TransformNode[] = [];

        if (archetype === "scout") {
          root.position.y = 1.05;
          const body = BABYLON.MeshBuilder.CreateSphere(`scout-body-${champion.id}`, { diameter: 1.15, segments: 16 }, scene);
          body.parent = root;
          body.position.y = 1.55;
          body.scaling = new BABYLON.Vector3(1, 0.72, 1.35);
          body.material = accent;
          const head = BABYLON.MeshBuilder.CreateSphere(`scout-head-${champion.id}`, { diameter: 0.62, segments: 12 }, scene);
          head.parent = root;
          head.position = new BABYLON.Vector3(0, 1.72, -0.72);
          head.material = accent;
          for (const side of [-1, 1]) {
            const wingRoot = new BABYLON.TransformNode(`wing-${champion.id}-${side}`, scene);
            wingRoot.parent = root;
            wingRoot.position = new BABYLON.Vector3(side * 0.48, 1.62, 0);
            const wing = BABYLON.MeshBuilder.CreateSphere(`wing-mesh-${champion.id}-${side}`, { diameter: 1.1, segments: 12 }, scene);
            wing.parent = wingRoot;
            wing.scaling = new BABYLON.Vector3(1.4, 0.18, 0.55);
            wing.position.x = side * 0.45;
            wing.material = gold;
            wings.push(wingRoot);
          }
        } else {
          const robe = BABYLON.MeshBuilder.CreateCylinder(`robe-${champion.id}`, { diameterTop: 1.05, diameterBottom: 1.72, height: 2.25, tessellation: 12 }, scene);
          robe.parent = root;
          robe.position.y = 1.3;
          robe.material = accent;
          const torso = BABYLON.MeshBuilder.CreateCapsule(`torso-${champion.id}`, { radius: 0.58, height: 1.7 }, scene);
          torso.parent = root;
          torso.position.y = 2.38;
          torso.material = sandstone;
          const head = BABYLON.MeshBuilder.CreateSphere(`head-${champion.id}`, { diameter: 0.9, segments: 16 }, scene);
          head.parent = root;
          head.position.y = 3.48;
          head.material = skin;

          if (archetype === "guardian") {
            const shield = BABYLON.MeshBuilder.CreateCylinder(`shield-${champion.id}`, { diameter: 1.72, height: 0.2, tessellation: 30 }, scene);
            shield.parent = action;
            shield.position = new BABYLON.Vector3(0.72, 2.05, -0.18);
            shield.rotation.z = Math.PI / 2;
            shield.material = bronze;
            const spear = BABYLON.MeshBuilder.CreateCylinder(`spear-${champion.id}`, { diameter: 0.09, height: 3.7, tessellation: 8 }, scene);
            spear.parent = root;
            spear.position = new BABYLON.Vector3(-0.72, 2.1, 0);
            spear.material = gold;
          } else if (archetype === "support") {
            const staff = BABYLON.MeshBuilder.CreateCylinder(`staff-${champion.id}`, { diameter: 0.11, height: 3.6, tessellation: 8 }, scene);
            staff.parent = action;
            staff.position = new BABYLON.Vector3(-0.72, 2.05, 0);
            staff.material = gold;
            const orb = BABYLON.MeshBuilder.CreateSphere(`orb-${champion.id}`, { diameter: 0.5, segments: 16 }, scene);
            orb.parent = action;
            orb.position = new BABYLON.Vector3(-0.72, 3.9, 0);
            orb.material = accent;
          } else {
            const sling = BABYLON.MeshBuilder.CreateTorus(`sling-${champion.id}`, { diameter: 0.7, thickness: 0.07, tessellation: 24 }, scene);
            sling.parent = action;
            sling.position = new BABYLON.Vector3(-0.78, 2.55, -0.05);
            sling.rotation.x = Math.PI / 2;
            sling.material = gold;
            const stone = BABYLON.MeshBuilder.CreateSphere(`stone-${champion.id}`, { diameter: 0.25, segments: 10 }, scene);
            stone.parent = action;
            stone.position = new BABYLON.Vector3(-0.78, 2.55, -0.05);
            stone.material = bronze;
          }
        }

        actors.push({ root, action, baseY: root.position.y, archetype, wings });
      };

      if (mode === "menu") {
        const roster = champions.length ? champions.slice(0, 4) : DEFAULT_CHAMPIONS;
        roster.forEach(makeChampion);
      }

      const glow = new BABYLON.GlowLayer("arena-glow", scene, { blurKernelSize: 32 });
      glow.intensity = 0.72;

      let clock = 0;
      scene.onBeforeRenderObservable.add(() => {
        const delta = engine.getDeltaTime() / 1000;
        clock += delta;
        portal.rotation.z += delta * (mode === "loading" ? 0.5 : 0.18);
        portalInner.rotation.z -= delta * 0.09;
        ring.scaling.setAll(1 + Math.sin(clock * 1.6) * 0.018);
        for (const mesh of scene.meshes) {
          if (mesh.name.startsWith("crystal-")) {
            mesh.rotation.y += delta * 0.65;
            mesh.position.y += Math.sin(clock * 1.8 + mesh.uniqueId) * 0.0008;
          }
        }
        actors.forEach((actor, index) => {
          const idle = Math.sin(clock * 1.65 + index * 0.8);
          const actionWave = Math.max(0, Math.sin(clock * 1.18 - index * 0.72));
          actor.root.position.y = actor.baseY + idle * (actor.archetype === "scout" ? 0.16 : 0.025);
          actor.root.rotation.y = idle * 0.045;
          actor.action.rotation.set(0, 0, 0);
          if (actor.archetype === "ranged") actor.action.rotation.z = actionWave * 0.65;
          if (actor.archetype === "guardian") actor.action.rotation.y = -actionWave * 0.5;
          if (actor.archetype === "support") {
            actor.action.position.y = actionWave * 0.25;
            actor.action.rotation.z = -actionWave * 0.12;
          }
          if (actor.archetype === "scout") {
            actor.wings.forEach((wing, wingIndex) => {
              wing.rotation.z = (wingIndex === 0 ? -1 : 1) * (0.35 + Math.sin(clock * 7.5) * 0.5);
            });
          }
        });
      });

      const resize = () => engine.resize();
      window.addEventListener("resize", resize);
      engine.runRenderLoop(() => scene.render());
      onProgress?.(86, "Preparando cartas e recompensas");
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

  return <canvas ref={canvasRef} aria-label={mode === "loading" ? "Portal 3D de carregamento" : "Quatro personagens do baralho no Salão dos Campeões"} />;
}
