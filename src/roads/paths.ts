import { posToStored } from "roads/state";

export function planRoundabout(spawn: StructureSpawn): RoomPosition[] {
  const positions: RoomPosition[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      positions.push(new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, spawn.pos.roomName));
    }
  }
  return positions;
}

export function planRoute(from: RoomPosition, to: RoomPosition): RoomPosition[] {
  if (from.roomName !== to.roomName) return [];
  const result = PathFinder.search(
    from,
    { pos: to, range: 1 },
    {
      swampCost: 3,
      plainCost: 2,
      roomCallback: roomName => {
        const room = Game.rooms[roomName];
        if (!room) return false;
        const costs = new PathFinder.CostMatrix();
        room.find(FIND_STRUCTURES).forEach(struct => {
          if (struct.structureType === STRUCTURE_ROAD) {
            costs.set(struct.pos.x, struct.pos.y, 1);
          } else if (
            struct.structureType !== STRUCTURE_CONTAINER &&
            struct.structureType !== STRUCTURE_RAMPART
          ) {
            costs.set(struct.pos.x, struct.pos.y, 0xff);
          }
        });
        room.find(FIND_CONSTRUCTION_SITES).forEach(site => {
          if (site.structureType !== STRUCTURE_ROAD) {
            costs.set(site.pos.x, site.pos.y, 0xff);
          }
        });
        return costs;
      },
    }
  );

  if (result.incomplete) return [];
  return result.path;
}

export function dedupePositions(positions: RoomPosition[]): RoomPosition[] {
  const seen = new Set<string>();
  const out: RoomPosition[] = [];
  positions.forEach(pos => {
    const key = posKey(pos);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(pos);
  });
  return out;
}

export function posKey(pos: RoomPosition): string {
  return `${pos.roomName}:${pos.x}:${pos.y}`;
}

export function toStoredList(positions: RoomPosition[]) {
  return positions.map(posToStored);
}
