"use client";

import { useEffect, useRef } from "react";

type SceneMode = "loading" | "menu";

export function ApostolicArena3DScene({ mode, onProgress, onReady }: {
  mode: SceneMode;
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
      onProgress?.(42, "Acendendo cristais e portais");

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
        mode === "loading" ? 23 : 19,
        new BABYLON.Vector3(0, 2.25, 0),
        scene
      );
      camera.lowerRadiusLimit = 15;
      camera.upperRadiusLimit = 25;
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
      const royalBlue = material("royal-blue", [0.025, 0.14, 0.34], [0.01, 0.08, 0.2]);
      const crystal = material("crystal", [0.03, 0.28, 0.62], [0.05, 0.58, 1]);
      crystal.alpha = 0.92;
      const portalMaterial = material("portal", [0.02, 0.22, 0.55], [0.08, 0.62, 1]);
      const gold = material("gold", [0.75, 0.43, 0.08], [0.24, 0.11, 0.01]);

      const floor = BABYLON.MeshBuilder.CreateCylinder("champion-hall", { diameter: 22, height: 0.65, tessellation: 48 }, scene);
      floor.position.y = -0.35;
      floor.material = sandstone;
      const innerFloor = BABYLON.MeshBuilder.CreateCylinder("light-platform", { diameter: 7.2, height: 0.24, tessellation: 48 }, scene);
      innerFloor.position.y = 0.08;
      innerFloor.material = darkStone;

      const ring = BABYLON.MeshBuilder.CreateTorus("platform-ring", { diameter: 6.4, thickness: 0.14, tessellation: 72 }, scene);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.24;
      ring.material = gold;

      const portal = BABYLON.MeshBuilder.CreateTorus("portal", { diameter: 8.2, thickness: 0.48, tessellation: 72 }, scene);
      portal.position = new BABYLON.Vector3(0, 4.5, 2.6);
      portal.material = portalMaterial;
      const portalInner = BABYLON.MeshBuilder.CreateDisc("portal-light", { radius: 3.75, tessellation: 72 }, scene);
      portalInner.position = new BABYLON.Vector3(0, 4.5, 2.64);
      portalInner.material = royalBlue;
      portalInner.visibility = 0.78;

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
          gem.material = crystal;
        }
      }

      const makeChampion = () => {
        const root = new BABYLON.TransformNode("champion", scene);
        root.position = new BABYLON.Vector3(0, 0.25, -0.3);
        const robe = BABYLON.MeshBuilder.CreateCylinder("champion-robe", { diameterTop: 1.2, diameterBottom: 2.05, height: 2.5, tessellation: 12 }, scene);
        robe.parent = root; robe.position.y = 1.45; robe.material = royalBlue;
        const torso = BABYLON.MeshBuilder.CreateCapsule("champion-torso", { radius: 0.68, height: 2 }, scene);
        torso.parent = root; torso.position.y = 2.55; torso.material = sandstone;
        const head = BABYLON.MeshBuilder.CreateSphere("champion-head", { diameter: 1.05, segments: 16 }, scene);
        head.parent = root; head.position.y = 3.82; head.material = material("skin", [0.52, 0.28, 0.14]);
        const shield = BABYLON.MeshBuilder.CreateCylinder("champion-shield", { diameter: 2.05, height: 0.22, tessellation: 32 }, scene);
        shield.parent = root; shield.position = new BABYLON.Vector3(0.92, 2.3, -0.2); shield.rotation.z = Math.PI / 2; shield.material = bronze;
        const staff = BABYLON.MeshBuilder.CreateCylinder("champion-staff", { diameter: 0.12, height: 4.1, tessellation: 8 }, scene);
        staff.parent = root; staff.position = new BABYLON.Vector3(-1.02, 2.1, 0); staff.rotation.z = -0.09; staff.material = gold;
        const breathing = new BABYLON.Animation("champion-idle", "scaling.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        breathing.setKeys([{ frame: 0, value: 1 }, { frame: 45, value: 1.025 }, { frame: 90, value: 1 }]);
        root.animations = [breathing];
        scene.beginAnimation(root, 0, 90, true);
        return root;
      };
      if (mode === "menu") makeChampion();

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
  }, [mode, onProgress, onReady]);

  return <canvas ref={canvasRef} aria-label={mode === "loading" ? "Portal 3D de carregamento" : "Salão dos Campeões em 3D"} />;
}
