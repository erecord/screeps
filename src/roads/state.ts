interface StoredPosition {
  x: number;
  y: number;
  roomName: string;
}

export interface RoadPlan {
  roundabout: StoredPosition[];
  routes: Record<string, StoredPosition[]>;
  lastPlanned: number;
}

const DEFAULT_PLAN: RoadPlan = { roundabout: [], routes: {}, lastPlanned: 0 };

export function loadRoadPlan(room: Room): RoadPlan {
  if (!Memory.roads) Memory.roads = {};
  if (!Memory.roads[room.name]) {
    Memory.roads[room.name] = DEFAULT_PLAN;
  }
  return Memory.roads[room.name] as RoadPlan;
}

export function saveRoadPlan(room: Room, plan: RoadPlan) {
  if (!Memory.roads) Memory.roads = {};
  Memory.roads[room.name] = plan;
}

export function posToStored(pos: RoomPosition): StoredPosition {
  return { x: pos.x, y: pos.y, roomName: pos.roomName };
}

export function storedToPos(pos: StoredPosition): RoomPosition {
  return new RoomPosition(pos.x, pos.y, pos.roomName);
}
