import { ROLES, RoleId } from "roles/constants";

export interface StructureSummary {
  type: StructureConstant;
  positions: RoomPosition[];
}

export interface RoomSnapshot {
  room: Room;
  controllerLevel: number;
  energyAvailable: number;
  energyCapacity: number;
  sources: Source[];
  spawns: StructureSpawn[];
  hostiles: Creep[];
  myStructures: StructureSummary[];
  sites: ConstructionSite[];
  roleCounts: Partial<Record<RoleId, number>>;
  occupied: Set<string>; // tiles with structures or sites (for collision checks)
}

export function buildRoomSnapshot(room: Room): RoomSnapshot {
  const spawns = room.find(FIND_MY_SPAWNS);
  const myStructures = summarizeStructures(room.find(FIND_MY_STRUCTURES));
  const roleCounts = _.countBy(Game.creeps, c => c.memory.role as RoleId);
  const occupied = new Set<string>();
  myStructures.forEach(s => s.positions.forEach(pos => occupied.add(posKey(pos))));
  room.find(FIND_CONSTRUCTION_SITES).forEach(site => occupied.add(posKey(site.pos)));

  return {
    room,
    controllerLevel: room.controller?.level ?? 0,
    energyAvailable: room.energyAvailable,
    energyCapacity: room.energyCapacityAvailable,
    sources: room.find(FIND_SOURCES),
    spawns,
    hostiles: room.find(FIND_HOSTILE_CREEPS),
    myStructures,
    sites: room.find(FIND_CONSTRUCTION_SITES),
    roleCounts,
    occupied,
  };
}

function summarizeStructures(structures: Structure[]): StructureSummary[] {
  const grouped = _.groupBy(structures, s => s.structureType);
  return Object.entries(grouped).map(([type, structs]) => ({
    type: type as StructureConstant,
    positions: (structs as Structure[]).map(s => s.pos),
  }));
}

function posKey(pos: RoomPosition): string {
  return `${pos.roomName}:${pos.x}:${pos.y}`;
}
