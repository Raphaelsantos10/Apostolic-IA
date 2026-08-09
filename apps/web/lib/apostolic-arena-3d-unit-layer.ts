import type { AnimationGroup, AssetContainer, Scene, TransformNode } from "@babylonjs/core";
import { arenaUnitModelFor, type ArenaUnitAnimation, type ArenaUnitModelDefinition } from "./apostolic-arena-3d-unit-registry";

export type ArenaRuntimeUnit = {
  id: number;
  cardId: number;
  team: "blue" | "red";
  x: number;
  y: number;
  lastAttack: number;
  hitAt?: number;
  defeatedAt?: number;
};

type UnitInstance = { root: TransformNode; animations: AnimationGroup[]; state?: ArenaUnitAnimation };
type BabylonModule = typeof import("@babylonjs/core");

const containerCache = new Map<string, Promise<AssetContainer>>();

const splitModelUrl = (modelUrl: string) => {
  const slash = modelUrl.lastIndexOf("/");
  return { rootUrl: modelUrl.slice(0, slash + 1), fileName: modelUrl.slice(slash + 1) };
};

export class ApostolicArena3DUnitLayer {
  private instances = new Map<number, UnitInstance>();
  private pending = new Set<number>();
  private disposed = false;

  constructor(private BABYLON: BabylonModule, private scene: Scene, private onVisibility: (unitId: number, visible3D: boolean) => void) {}

  sync(units: ArenaRuntimeUnit[]) {
    if (this.disposed) return;
    const liveIds = new Set(units.map((unit) => unit.id));
    this.instances.forEach((instance, unitId) => {
      if (liveIds.has(unitId)) return;
      instance.animations.forEach((animation) => animation.dispose());
      instance.root.dispose(false, true);
      this.instances.delete(unitId);
      this.onVisibility(unitId, false);
    });

    units.forEach((unit) => {
      const definition = arenaUnitModelFor(unit.cardId);
      if (!definition?.enabled) return;
      const instance = this.instances.get(unit.id);
      if (!instance) {
        void this.createInstance(unit, definition);
        return;
      }
      this.position(instance, unit, definition);
      this.animate(instance, unit, definition);
    });
  }

  private async createInstance(unit: ArenaRuntimeUnit, definition: ArenaUnitModelDefinition) {
    if (this.pending.has(unit.id) || this.disposed) return;
    this.pending.add(unit.id);
    try {
      let containerPromise = containerCache.get(definition.modelUrl);
      if (!containerPromise) {
        const { rootUrl, fileName } = splitModelUrl(definition.modelUrl);
        containerPromise = this.BABYLON.SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, this.scene);
        containerCache.set(definition.modelUrl, containerPromise);
      }
      const container = await containerPromise;
      if (this.disposed) return;
      const clone = container.instantiateModelsToScene((name) => `unit-${unit.id}-${name}`, false, { doNotInstantiate: false });
      const root = clone.rootNodes[0] as TransformNode | undefined;
      if (!root) throw new Error("Modelo GLB sem nó raiz");
      const instance = { root, animations: clone.animationGroups };
      this.instances.set(unit.id, instance);
      this.position(instance, unit, definition);
      this.animate(instance, unit, definition);
      this.onVisibility(unit.id, true);
    } catch {
      containerCache.delete(definition.modelUrl);
      this.onVisibility(unit.id, false);
    } finally {
      this.pending.delete(unit.id);
    }
  }

  private position(instance: UnitInstance, unit: ArenaRuntimeUnit, definition: ArenaUnitModelDefinition) {
    instance.root.position.set((unit.x - .5) * 18, .28, (unit.y - .5) * 32);
    instance.root.scaling.setAll(definition.scale);
    instance.root.rotationQuaternion = null;
    instance.root.rotation.y = definition.rotationY + (unit.team === "blue" ? Math.PI : 0);
  }

  private animate(instance: UnitInstance, unit: ArenaRuntimeUnit, definition: ArenaUnitModelDefinition) {
    const now = Date.now();
    const state: ArenaUnitAnimation = unit.defeatedAt ? "defeat" : unit.hitAt && now - unit.hitAt < 280 ? "hit" : now - unit.lastAttack < 320 ? "attack" : "walk";
    if (instance.state === state) return;
    instance.animations.forEach((animation) => animation.stop());
    const aliases = definition.animations[state];
    const selected = instance.animations.find((animation) => aliases.some((alias) => animation.name.toLowerCase().includes(alias.toLowerCase())));
    selected?.start(state === "walk", 1, selected.from, selected.to, false);
    instance.state = state;
  }

  dispose() {
    this.disposed = true;
    this.instances.forEach((instance) => {
      instance.animations.forEach((animation) => animation.dispose());
      instance.root.dispose(false, true);
    });
    this.instances.clear();
    this.pending.clear();
  }
}
