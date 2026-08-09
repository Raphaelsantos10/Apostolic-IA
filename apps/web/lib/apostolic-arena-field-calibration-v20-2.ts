export type PointV202 = { x: number; y: number };
export type ArenaFieldCalibrationV202 = {
  fieldId: string;
  lanes: readonly [number, number];
  bridges: readonly [number, number];
  river: { top: number; bottom: number };
  deploy: { minX: number; maxX: number; top: number; bottom: number };
  enemySpawnY: number;
  towers: { blueMain: PointV202; blueLeft: PointV202; blueRight: PointV202; redMain: PointV202; redLeft: PointV202; redRight: PointV202 };
  mobileFocus: string;
};

const profile = (fieldId: string, lanes: readonly [number,number], river: [number,number], towers: [number,number,number,number], deploy: [number,number] = [.53,.82]): ArenaFieldCalibrationV202 => ({
  fieldId, lanes, bridges: lanes, river:{top:river[0],bottom:river[1]}, deploy:{minX:.07,maxX:.93,top:deploy[0],bottom:deploy[1]}, enemySpawnY:.23,
  towers:{blueMain:{x:.5,y:towers[3]},blueLeft:{x:lanes[0],y:towers[2]},blueRight:{x:lanes[1],y:towers[2]},redMain:{x:.5,y:towers[0]},redLeft:{x:lanes[0],y:towers[1]},redRight:{x:lanes[1],y:towers[1]}}, mobileFocus:"50% 50%"
});

export const ARENA_FIELD_CALIBRATIONS_V202: Record<string,ArenaFieldCalibrationV202> = {
  "galilee-a":profile("galilee-a",[.31,.69],[.45,.55],[.12,.29,.69,.87]),
  "galilee-b":profile("galilee-b",[.32,.68],[.43,.56],[.13,.28,.70,.87]),
  "elah-a":profile("elah-a",[.30,.70],[.46,.54],[.12,.30,.68,.86]),
  "elah-b":profile("elah-b",[.28,.72],[.44,.56],[.11,.27,.71,.88]),
  "exodus-a":profile("exodus-a",[.30,.70],[.45,.55],[.11,.29,.69,.88]),
  "exodus-b":profile("exodus-b",[.29,.71],[.43,.57],[.12,.28,.70,.87]),
  "jericho-a":profile("jericho-a",[.31,.69],[.45,.55],[.12,.29,.69,.87]),
  "jericho-b":profile("jericho-b",[.29,.71],[.44,.56],[.11,.28,.70,.88]),
  "gideon-a":profile("gideon-a",[.30,.70],[.46,.54],[.13,.29,.69,.86]),
  "gideon-b":profile("gideon-b",[.28,.72],[.44,.56],[.12,.27,.71,.87]),
  "jerusalem-a":profile("jerusalem-a",[.31,.69],[.44,.56],[.12,.29,.69,.87]),
  "jerusalem-b":profile("jerusalem-b",[.30,.70],[.43,.57],[.11,.28,.70,.88]),
  "carmel-a":profile("carmel-a",[.29,.71],[.45,.55],[.12,.28,.70,.87]),
  "carmel-b":profile("carmel-b",[.30,.70],[.44,.56],[.11,.27,.71,.88]),
  "covenant-a":profile("covenant-a",[.32,.68],[.44,.56],[.12,.29,.69,.87]),
  "covenant-b":profile("covenant-b",[.31,.69],[.43,.57],[.11,.28,.70,.88])
};

export const arenaFieldCalibrationV202 = (fieldId:string) => ARENA_FIELD_CALIBRATIONS_V202[fieldId] ?? ARENA_FIELD_CALIBRATIONS_V202["galilee-a"]!;
