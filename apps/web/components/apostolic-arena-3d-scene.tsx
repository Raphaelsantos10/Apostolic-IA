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
  portrait?: string;
};

export type ArenaPowerSignal = {
  championId: number;
  nonce: number;
};

type PowerKind = "waters" | "harp" | "frenzy" | "shield" | "generic";
type FeaturedVisual = { image: string; power: PowerKind; height: number };

const DASHBOARD_MODEL_ROOT = "/models/apostolic-arena/dashboard/";
const DAVI_MODEL_ROOT = "/models/apostolic-arena/characters/";

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
  117: { image: "/games/apostolic-arena/characters/menu-v7/117-moises-menu-v7.png", power: "waters", height: 4.2 },
  119: { image: "/games/apostolic-arena/characters/menu-v7/119-davi-menu-v7.png", power: "harp", height: 4.1 },
  121: { image: "/games/apostolic-arena/characters/menu-v7/121-sansao-menu-v7.png", power: "frenzy", height: 4.15 },
  125: { image: "/games/apostolic-arena/characters/menu-v7/125-debora-menu-v7.png", power: "shield", height: 4.1 }
};

const DEFAULT_CHAMPIONS: ArenaSceneChampion[] = [
  { id: 117, name: "Moisés, o Libertador", rarity: "champion", faith: 5, type: "Campeão líder" },
  { id: 119, name: "Davi, o Rei Campeão", rarity: "champion", faith: 5, type: "Campeão monarca" },
  { id: 121, name: "Sansão, o Inabalável", rarity: "champion", faith: 6, type: "Campeão tanque" },
  { id: 125, name: "Débora, a Juíza Campeã", rarity: "champion", faith: 4, type: "Campeã inspiradora" }
];

export function ApostolicArena3DScene({ mode, champions = DEFAULT_CHAMPIONS, powerSignal, gateSignal = 0, chestReady = false, onProgress, onReady }: {
  mode: SceneMode;
  champions?: ArenaSceneChampion[];
  powerSignal?: ArenaPowerSignal | null;
  gateSignal?: number;
  chestReady?: boolean;
  onProgress?: (progress: number, label: string) => void;
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const powerSignalRef = useRef(powerSignal);
  const gateSignalRef = useRef(gateSignal);
  const chestReadyRef = useRef(chestReady);

  useEffect(() => { powerSignalRef.current = powerSignal; }, [powerSignal]);
  useEffect(() => { gateSignalRef.current = gateSignal; }, [gateSignal]);
  useEffect(() => { chestReadyRef.current = chestReady; }, [chestReady]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    onProgress?.(12, "Abrindo o Salão dos Campeões");

    void Promise.all([import("@babylonjs/core"), import("@babylonjs/loaders/glTF")]).then(async ([BABYLON]) => {
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
      scene.imageProcessingConfiguration.contrast = 1.06;
      scene.imageProcessingConfiguration.exposure = 1.08;
      scene.imageProcessingConfiguration.toneMappingEnabled = true;

      const camera = new BABYLON.ArcRotateCamera(
        "champion-hall-camera",
        -Math.PI / 2,
        mode === "loading" ? 1.14 : 1.25,
        mode === "loading" ? 21.5 : 19.2,
        new BABYLON.Vector3(0, mode === "loading" ? 2.05 : 2.65, 0.6),
        scene
      );
      camera.lowerRadiusLimit = 17.5;
      camera.upperRadiusLimit = 23;
      camera.lowerBetaLimit = mode === "loading" ? 1.04 : 1.2;
      camera.upperBetaLimit = mode === "loading" ? 1.23 : 1.3;
      camera.lowerAlphaLimit = -1.68;
      camera.upperAlphaLimit = -1.46;
      camera.wheelPrecision = 120;
      camera.panningSensibility = 0;
      camera.attachControl(canvas, true);

      const sky = new BABYLON.HemisphericLight("sky", new BABYLON.Vector3(0, 1, 0), scene);
      sky.intensity = 0.52;
      sky.diffuse = new BABYLON.Color3(0.58, 0.72, 1);
      sky.groundColor = new BABYLON.Color3(0.2, 0.11, 0.045);
      const sunrise = new BABYLON.DirectionalLight("sunrise", new BABYLON.Vector3(-0.45, -1, 0.5), scene);
      sunrise.intensity = 0.88;
      sunrise.diffuse = new BABYLON.Color3(1, 0.67, 0.34);
      const heroKey = new BABYLON.DirectionalLight("hero-camera-key", new BABYLON.Vector3(0.08, -0.28, 1), scene);
      heroKey.intensity = mode === "menu" ? 2.05 : 0.85;
      heroKey.diffuse = new BABYLON.Color3(1, 0.86, 0.69);

      const standardMaterial = (name: string, color: [number, number, number], emissive?: [number, number, number], alpha = 1) => {
        const value = new BABYLON.StandardMaterial(name, scene);
        value.diffuseColor = new BABYLON.Color3(...color);
        value.specularColor = new BABYLON.Color3(0.32, 0.27, 0.18);
        value.alpha = alpha;
        if (emissive) value.emissiveColor = new BABYLON.Color3(...emissive);
        return value;
      };

      const backdropMaterial = new BABYLON.StandardMaterial("real-champion-hall-material", scene);
      const backdropPath = mode === "menu" ? "/games/apostolic-arena/dashboard/golden-mountains-sky-v24.webp" : "/games/apostolic-arena/scenes/champion-hall-clean-v7.png";
      const backdropTexture = new BABYLON.Texture(backdropPath, scene, true, true);
      backdropMaterial.diffuseTexture = backdropTexture;
      backdropMaterial.emissiveTexture = backdropTexture;
      backdropMaterial.emissiveColor = new BABYLON.Color3(0.62, 0.62, 0.62);
      backdropMaterial.disableLighting = true;
      backdropMaterial.backFaceCulling = false;
      const backdrop = BABYLON.MeshBuilder.CreatePlane("real-champion-hall", { width: 42, height: 23.63 }, scene);
      backdrop.position = new BABYLON.Vector3(0, 5.35, 8.8);
      backdrop.material = backdropMaterial;
      backdrop.applyFog = false;
      if (mode === "menu") {
        backdrop.setEnabled(true);
      }

      const resize = () => engine.resize();
      window.addEventListener("resize", resize);
      engine.runRenderLoop(() => scene.render());
      cleanup = () => {
        window.removeEventListener("resize", resize);
        scene.dispose();
        engine.dispose();
      };

      const darkStone = standardMaterial("dark-stone", [0.035, 0.05, 0.08]);
      const gold = standardMaterial("gold", [0.74, 0.39, 0.055], [0.2, 0.08, 0.004]);
      const blue = standardMaterial("portal-blue", [0.015, 0.24, 0.62], [0.04, 0.5, 1]);
      const aqua = standardMaterial("water-power", [0.02, 0.44, 0.78], [0.02, 0.42, 0.88], 0.72);
      const warmGold = standardMaterial("harp-power", [0.88, 0.55, 0.08], [0.55, 0.24, 0.015], 0.78);
      const frenzy = standardMaterial("frenzy-power", [0.88, 0.12, 0.03], [0.65, 0.06, 0.01], 0.76);
      const shield = standardMaterial("shield-power", [0.04, 0.7, 0.72], [0.04, 0.45, 0.72], 0.28);
      shield.backFaceCulling = false;

      let gateLeft: TransformNode | null = null;
      let gateRight: TransformNode | null = null;
      let gateLeftClosedX = 0;
      let gateRightClosedX = 0;
      let portalGlow: AbstractMesh | null = null;
      let portalGlowMaterial: StandardMaterial | null = null;
      let portalLight: { intensity: number } | null = null;
      let chestLid: TransformNode | null = null;
      const characterModels = new Map<number, TransformNode>();
      const stagePositions = champions.length === 1
        ? [new BABYLON.Vector3(0, 0.34, -1.6)]
        : [
            new BABYLON.Vector3(-5.9, 0.34, -1.85),
            new BABYLON.Vector3(-2.35, 0.34, -0.5),
            new BABYLON.Vector3(2.4, 0.34, -0.62),
            new BABYLON.Vector3(5.95, 0.34, -1.85)
          ];
      const fireLights: Array<{ light: { intensity: number }; phase: number }> = [];

      if (mode === "menu") {
        onProgress?.(48, "Carregando a cidadela unificada");
        const result = await BABYLON.SceneLoader.ImportMeshAsync(null, DASHBOARD_MODEL_ROOT, "apostolic-dashboard-final-v24.glb", scene);
        result.meshes.forEach((mesh) => {
          mesh.receiveShadows = true;
          mesh.alwaysSelectAsActiveMesh = false;
        });
        gateLeft = scene.getNodeByName("Gate_Door_L") as TransformNode | null;
        gateRight = scene.getNodeByName("Gate_Door_R") as TransformNode | null;
        gateLeftClosedX = gateLeft?.position.x ?? 0;
        gateRightClosedX = gateRight?.position.x ?? 0;
        const portalTexture = new BABYLON.DynamicTexture("portal-soft-texture", { width: 256, height: 512 }, scene, false);
        const portalContext = portalTexture.getContext();
        const portalGradient = portalContext.createRadialGradient(128, 256, 4, 128, 256, 128);
        portalGradient.addColorStop(0, "rgba(255,255,230,1)");
        portalGradient.addColorStop(0.16, "rgba(255,210,80,.92)");
        portalGradient.addColorStop(0.48, "rgba(255,118,15,.42)");
        portalGradient.addColorStop(1, "rgba(255,80,0,0)");
        portalContext.fillStyle = portalGradient;
        portalContext.fillRect(0, 0, 256, 512);
        portalTexture.hasAlpha = true;
        portalTexture.update();
        portalGlowMaterial = standardMaterial("portal-seam-light", [1, 0.72, 0.22], [1, 0.58, 0.08], 0.5);
        portalGlowMaterial.diffuseTexture = portalTexture;
        portalGlowMaterial.emissiveTexture = portalTexture;
        portalGlowMaterial.opacityTexture = portalTexture;
        portalGlowMaterial.useAlphaFromDiffuseTexture = true;
        portalGlowMaterial.disableLighting = true;
        portalGlowMaterial.backFaceCulling = false;
        portalGlow = BABYLON.MeshBuilder.CreatePlane("portal-seam", { width: 4.2, height: 6.2 }, scene);
        portalGlow.position = new BABYLON.Vector3(0, 2.6, 3.68);
        portalGlow.scaling.x = 0.08;
        portalGlow.material = portalGlowMaterial;
        const gateLight = new BABYLON.PointLight("portal-golden-light", new BABYLON.Vector3(0, 2.6, 3.25), scene);
        gateLight.diffuse = new BABYLON.Color3(1, 0.52, 0.08);
        gateLight.range = 10;
        gateLight.intensity = 0.58;
        portalLight = gateLight;
        chestLid = scene.getNodeByName("Chest_Lid") as TransformNode | null;
        const chest = scene.getNodeByName("Chest_Placement") as TransformNode | null;
        if (chest) {
          chest.position.y = -0.08;
          chest.position.z = -4.15;
          const chestGlow = new BABYLON.PointLight("chest-reward-glow", new BABYLON.Vector3(0, 0.75, -4.1), scene);
          chestGlow.diffuse = new BABYLON.Color3(1, 0.62, 0.1);
          chestGlow.intensity = 1.15;
          chestGlow.range = 5.5;
        }
        stagePositions.forEach((position, index) => {
          const pedestal = scene.getNodeByName(`Pedestal_${index + 1}_Placement`) as TransformNode | null;
          if (pedestal) {
            pedestal.position.x = position.x;
            pedestal.position.z = position.z;
          }
        });
        const towerRed = scene.getNodeByName("Tower_Red_Placement") as TransformNode | null;
        const towerBlue = scene.getNodeByName("Tower_Blue_Placement") as TransformNode | null;
        if (towerRed && towerBlue) {
          const redX = towerRed.position.x;
          towerRed.position.x = towerBlue.position.x;
          towerBlue.position.x = redX;
        }
        const characterAssets = [
          { id: 1, file: "119-davi-idle-v28.glb" },
          { id: 11, file: "11-sacerdote-levita-idle-v30.glb" }
        ];
        for (const asset of characterAssets) {
          try {
            const imported = await BABYLON.SceneLoader.ImportMeshAsync(null, DAVI_MODEL_ROOT, asset.file, scene);
            const model = imported.meshes[0] as TransformNode | null;
            if (model) {
              model.setEnabled(false);
              characterModels.set(asset.id, model);
            }
            imported.meshes.forEach((mesh) => {
              mesh.receiveShadows = true;
              mesh.alwaysSelectAsActiveMesh = true;
              const material = mesh.material;
              if (material instanceof BABYLON.PBRMaterial) {
                material.environmentIntensity = 2.1;
                material.metallic = Math.min(material.metallic ?? 0.16, 0.16);
                material.roughness = Math.max(material.roughness ?? 0.52, 0.52);
                material.emissiveColor = material.albedoColor.scale(0.1);
              }
            });
            imported.animationGroups[0]?.start(true, 1);
          } catch {
            characterModels.delete(asset.id);
          }
        }
        onProgress?.(72, "Acendendo braseiros e guardiões");
        for (const x of [-8.3, 8.3]) {
          const fire = new BABYLON.ParticleSystem(`brazier-fire-${x}`, 420, scene);
          fire.particleTexture = new BABYLON.Texture("/games/apostolic-arena/dashboard/flame-particle-v24.png", scene, true, false);
          fire.emitter = new BABYLON.Vector3(x, 0.72, 0.45);
          fire.minEmitBox = new BABYLON.Vector3(-0.17, 0, -0.17);
          fire.maxEmitBox = new BABYLON.Vector3(0.17, 0.1, 0.17);
          fire.color1 = new BABYLON.Color4(1, 0.82, 0.24, 1);
          fire.color2 = new BABYLON.Color4(1, 0.22, 0.025, 0.95);
          fire.colorDead = new BABYLON.Color4(0.17, 0.025, 0.005, 0);
          fire.minSize = 0.08;
          fire.maxSize = 0.31;
          fire.minLifeTime = 0.28;
          fire.maxLifeTime = 0.78;
          fire.emitRate = 105;
          fire.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
          fire.direction1 = new BABYLON.Vector3(-0.13, 1.35, -0.08);
          fire.direction2 = new BABYLON.Vector3(0.13, 2.15, 0.08);
          fire.minEmitPower = 0.72;
          fire.maxEmitPower = 1.35;
          fire.updateSpeed = 0.012;
          fire.gravity = new BABYLON.Vector3(0, 0.24, 0);
          fire.start();
          const flameLight = new BABYLON.PointLight(`brazier-light-${x}`, new BABYLON.Vector3(x, 1.18, 0.45), scene);
          flameLight.diffuse = new BABYLON.Color3(1, 0.32, 0.045);
          flameLight.range = 4.8;
          flameLight.intensity = 1.25;
          fireLights.push({ light: flameLight, phase: x < 0 ? 0 : Math.PI * 0.67 });
        }
        for (const tower of [{ x: -7.05, color: "red" as const }, { x: 7.05, color: "blue" as const }]) {
          const flame = new BABYLON.ParticleSystem(`tower-${tower.color}-flame`, 520, scene);
          flame.particleTexture = new BABYLON.Texture("/games/apostolic-arena/dashboard/flame-particle-v24.png", scene, true, false);
          flame.emitter = new BABYLON.Vector3(tower.x, 7.15, 4.1);
          flame.minEmitBox = new BABYLON.Vector3(-0.28, 0, -0.28);
          flame.maxEmitBox = new BABYLON.Vector3(0.28, 0.12, 0.28);
          flame.color1 = tower.color === "red" ? new BABYLON.Color4(1, 0.12, 0.02, 1) : new BABYLON.Color4(0.08, 0.55, 1, 1);
          flame.color2 = tower.color === "red" ? new BABYLON.Color4(1, 0.62, 0.08, 0.95) : new BABYLON.Color4(0.25, 0.9, 1, 0.95);
          flame.colorDead = new BABYLON.Color4(0.02, 0.02, 0.08, 0);
          flame.minSize = 0.22; flame.maxSize = 0.65; flame.minLifeTime = 0.35; flame.maxLifeTime = 0.95;
          flame.emitRate = 145; flame.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
          flame.direction1 = new BABYLON.Vector3(-0.18, 1.3, -0.12); flame.direction2 = new BABYLON.Vector3(0.18, 2.4, 0.12);
          flame.minEmitPower = 0.8; flame.maxEmitPower = 1.55; flame.updateSpeed = 0.012; flame.start();
          const towerLight = new BABYLON.PointLight(`tower-${tower.color}-light`, new BABYLON.Vector3(tower.x, 7.25, 4.1), scene);
          towerLight.diffuse = tower.color === "red" ? new BABYLON.Color3(1, 0.08, 0.02) : new BABYLON.Color3(0.02, 0.48, 1);
          towerLight.intensity = 2.25; towerLight.range = 8;
        }
      }

      const foreground = BABYLON.MeshBuilder.CreateCylinder("foreground-depth", { diameter: 15.8, height: 0.18, tessellation: 72 }, scene);
      foreground.position = new BABYLON.Vector3(0, -0.16, -0.2);
      foreground.scaling.z = 0.5;
      foreground.material = darkStone;
      foreground.setEnabled(mode !== "menu");
      const floorRing = BABYLON.MeshBuilder.CreateTorus("foreground-ring", { diameter: 13.8, thickness: 0.07, tessellation: 96 }, scene);
      floorRing.rotation.x = Math.PI / 2;
      floorRing.position.y = -0.04;
      floorRing.scaling.z = 0.52;
      floorRing.material = gold;
      floorRing.setEnabled(mode !== "menu");

      const actors: AnimatedActor[] = [];

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
        root.position.copyFrom(stagePositions[index] ?? BABYLON.Vector3.Zero());
        const action = new BABYLON.TransformNode(`real-action-${champion.id}`, scene);
        action.parent = root;
        const effects = new BABYLON.TransformNode(`real-effects-${champion.id}`, scene);
        effects.parent = root;

        const pedestal = BABYLON.MeshBuilder.CreateCylinder(`hero-pedestal-${champion.id}`, { diameter: 2.42, height: 0.18, tessellation: 48 }, scene);
        pedestal.parent = root;
        pedestal.position.y = -0.02;
        pedestal.material = blue;
        pedestal.setEnabled(mode !== "menu");
        const pedestalRing = BABYLON.MeshBuilder.CreateTorus(`hero-ring-${champion.id}`, { diameter: 2.18, thickness: 0.075, tessellation: 64 }, scene);
        pedestalRing.parent = root;
        pedestalRing.rotation.x = Math.PI / 2;
        pedestalRing.position.y = 0.05;
        pedestalRing.material = gold;
        pedestalRing.setEnabled(false);
        const altarColors = [new BABYLON.Color3(0.12, 0.55, 1), new BABYLON.Color3(1, 0.63, 0.12), new BABYLON.Color3(1, 0.2, 0.08), new BABYLON.Color3(0.28, 0.9, 0.48)];
        const altarColor = altarColors[index] ?? altarColors[1]!;
        const altarMaterial = new BABYLON.StandardMaterial(`altar-light-${champion.id}`, scene);
        altarMaterial.diffuseColor = altarColor;
        altarMaterial.emissiveColor = altarColor.scale(0.9);
        altarMaterial.alpha = 0.22;
        altarMaterial.disableLighting = true;
        const altarAura = BABYLON.MeshBuilder.CreateDisc(`altar-aura-${champion.id}`, { radius: 1.25, tessellation: 64 }, scene);
        altarAura.parent = root;
        altarAura.rotation.x = Math.PI / 2;
        altarAura.position.y = 0.08;
        altarAura.material = altarMaterial;
        altarAura.setEnabled(false);
        const altarLight = new BABYLON.PointLight(`altar-point-${champion.id}`, new BABYLON.Vector3(0, 0.55, -0.25), scene);
        altarLight.parent = root;
        altarLight.diffuse = altarColor;
        altarLight.intensity = 1.15;
        altarLight.range = 5.5;

        const characterModel = characterModels.get(champion.id);
        if (characterModel) {
          characterModel.setEnabled(true);
          characterModel.parent = action;
          characterModel.position.set(0, 0.12, 0);
          characterModel.scaling.setAll(champion.id === 11 ? 4.25 : 4.1);
          characterModel.rotationQuaternion = null;
          characterModel.rotation.x = 0;
          characterModel.rotation.y = Math.PI;
          const characterFill = new BABYLON.PointLight(`character-soft-fill-${champion.id}`, new BABYLON.Vector3(0, 2.4, -3.2), scene);
          characterFill.parent = root;
          characterFill.diffuse = new BABYLON.Color3(1, 0.84, 0.65);
          characterFill.intensity = 0.82;
          characterFill.range = 8;
        } else {
          const heroTexture = new BABYLON.Texture(visual.image, scene, true, true);
          heroTexture.hasAlpha = true;
          const heroMaterial = new BABYLON.StandardMaterial(`hero-material-${champion.id}`, scene);
          heroMaterial.diffuseTexture = heroTexture;
          heroMaterial.emissiveTexture = heroTexture;
          heroMaterial.opacityTexture = heroTexture;
          heroMaterial.useAlphaFromDiffuseTexture = true;
          heroMaterial.emissiveColor = new BABYLON.Color3(0.72, 0.72, 0.72);
          heroMaterial.disableLighting = true;
          heroMaterial.specularColor = BABYLON.Color3.Black();
          heroMaterial.backFaceCulling = false;
          heroMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHATESTANDBLEND;

          const hero = BABYLON.MeshBuilder.CreatePlane(`hero-figure-${champion.id}`, { width: visual.height * 0.75, height: visual.height, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
          hero.parent = action;
          hero.position.y = visual.height / 2 + 0.13;
          hero.position.z = -0.04;
          hero.material = heroMaterial;
          hero.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
        }

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
        root.position.copyFrom(stagePositions[index] ?? BABYLON.Vector3.Zero());
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
          const visual = FEATURED_VISUALS[champion.id] ?? (champion.portrait ? { image: champion.portrait, power: "generic" as const, height: 4.05 } : undefined);
          if (visual) makeFeaturedChampion(champion, index, visual);
          else makeFallbackChampion(champion, index);
        });
      }

      const glow = new BABYLON.GlowLayer("arena-glow", scene, { blurKernelSize: 48 });
      glow.intensity = 0.42;

      let clock = 0;
      let lastPowerNonce = -1;
      let lastGateSignal = gateSignalRef.current;
      let gateStartedAt = -100;
      scene.onBeforeRenderObservable.add(() => {
        const delta = engine.getDeltaTime() / 1000;
        clock += delta;
        floorRing.rotation.z += delta * 0.045;
        if (gateSignalRef.current !== lastGateSignal) {
          lastGateSignal = gateSignalRef.current;
          gateStartedAt = clock;
        }
        const gateElapsed = gateStartedAt >= 0 ? clock - gateStartedAt : -1;
        const gateProgress = gateElapsed >= 0 ? Math.min(1, gateElapsed / 2.15) : 0;
        const easedGate = 1 - Math.pow(1 - gateProgress, 3);
        if (gateLeft) gateLeft.rotation.y = -easedGate * 1.48;
        if (gateRight) gateRight.rotation.y = easedGate * 1.48;
        if (gateLeft) gateLeft.position.x = gateLeftClosedX - easedGate * 0.38;
        if (gateRight) gateRight.position.x = gateRightClosedX + easedGate * 0.38;
        if (portalGlow) portalGlow.scaling.x = 0.08 + easedGate * 0.92;
        if (portalGlowMaterial) portalGlowMaterial.alpha = 0.46 + easedGate * 0.42 + Math.sin(clock * 2.4) * 0.04;
        if (portalLight) portalLight.intensity = 0.52 + easedGate * 2.15 + Math.sin(clock * 2.1) * 0.08;
        if (gateElapsed >= 0 && gateElapsed < 2.4) {
          camera.radius = Math.max(15.8, (mode === "loading" ? 21.5 : 19.2) - easedGate * 3.4);
          camera.target.z = easedGate * 1.45;
        }
        if (chestLid) {
          const chestTarget = chestReadyRef.current ? -0.62 - Math.sin(clock * 1.7) * 0.045 : -0.12;
          chestLid.rotation.x += (chestTarget - chestLid.rotation.x) * Math.min(1, delta * 4.2);
        }
        fireLights.forEach(({ light, phase }) => {
          light.intensity = 1.08 + Math.sin(clock * 8.3 + phase) * 0.2 + Math.sin(clock * 13.7 + phase) * 0.1;
        });
        if (mode === "menu") {
          camera.alpha = -Math.PI / 2 + Math.sin(clock * 0.13) * 0.027;
          camera.beta = 1.245 + Math.sin(clock * 0.1) * 0.008;
          backdrop.scaling.setAll(1.012 + Math.sin(clock * 0.18) * 0.006);
          backdropTexture.uOffset = Math.sin(clock * 0.035) * 0.006;
          const glowLevel = 0.6 + Math.sin(clock * 1.05) * 0.035;
          backdropMaterial.emissiveColor.set(glowLevel, glowLevel, glowLevel);
        }

        const signal = powerSignalRef.current;
        if (signal && signal.nonce !== lastPowerNonce) {
          lastPowerNonce = signal.nonce;
          const actor = actors.find((entry) => entry.championId === signal.championId);
          if (actor) actor.powerStartedAt = clock;
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

      onProgress?.(86, "Preparando poderes e cartas");
      scene.executeWhenReady(() => {
        if (disposed) return;
        onProgress?.(100, "Tudo pronto");
        onReady?.();
      });

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
