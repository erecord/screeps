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

interface FailureTracker {
  failures: Record<string, number>;
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

export function loadFailureTracker(room: Room): FailureTracker {
  if (!Memory.structurePlanFailures) Memory.structurePlanFailures = {};
  if (!Memory.structurePlanFailures[room.name]) {
    Memory.structurePlanFailures[room.name] = { failures: {} };
  }
  return Memory.structurePlanFailures[room.name] as FailureTracker;
}

export function saveFailureTracker(room: Room, tracker: FailureTracker) {
  if (!Memory.structurePlanFailures) Memory.structurePlanFailures = {};
  Memory.structurePlanFailures[room.name] = tracker;
}

export function posToStored(pos: RoomPosition): StoredPosition {
  return { x: pos.x, y: pos.y, roomName: pos.roomName };
}

export function storedToPos(pos: StoredPosition): RoomPosition {
  return new RoomPosition(pos.x, pos.y, pos.roomName);
}

export function cleanupEmptyPlan(room: Room, plan: StructurePlan) {
  Object.entries(plan.structures).forEach(([type, list]) => {
    if (!list?.length) {
      delete plan.structures[type as BuildableStructureConstant];
    }
  });
  if (Object.keys(plan.structures).length === 0 && Memory.structurePlans) {
    delete Memory.structurePlans[room.name];
  }

  if (Memory.structurePlanFailures && Memory.structurePlanFailures[room.name]) {
    const tracker = Memory.structurePlanFailures[room.name] as FailureTracker;
    const validKeys = new Set<string>();
    Object.values(plan.structures).forEach(list => {
      list?.forEach(pos => validKeys.add(`${pos.roomName}:${pos.x}:${pos.y}`));
    });

    Object.entries(tracker.failures).forEach(([key, count]) => {
      if (count <= 0 || !validKeys.has(key)) delete tracker.failures[key];
    });
    if (Object.keys(tracker.failures).length === 0) {
      delete Memory.structurePlanFailures[room.name];
    }
  }
}
