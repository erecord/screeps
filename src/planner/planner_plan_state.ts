// Persisted structure plan per room so we can prune completed/blocked sites between ticks
// and keep structure placement deterministic across reloads.
export interface StoredPosition {
  x: number;
  y: number;
  roomName: string;
}

export interface StructurePlan {
  structures: Partial<Record<BuildableStructureConstant, StoredPosition[]>>;
}

export function loadStructurePlan(room: Room): StructurePlan {
  if (!Memory.structurePlans) Memory.structurePlans = {};
  if (!Memory.structurePlans[room.name]) {
    Memory.structurePlans[room.name] = { structures: {} };
  }
  return Memory.structurePlans[room.name] as StructurePlan;
}

export function saveStructurePlan(room: Room, plan: StructurePlan) {
  if (!Memory.structurePlans) Memory.structurePlans = {};
  Memory.structurePlans[room.name] = plan;
}

export function posToStored(pos: RoomPosition): StoredPosition {
  return { x: pos.x, y: pos.y, roomName: pos.roomName };
}

export function storedToPos(pos: StoredPosition): RoomPosition {
  return new RoomPosition(pos.x, pos.y, pos.roomName);
}
