export interface BuildIntent {
  structureType: BuildableStructureConstant;
  pos: RoomPosition;
}

function isPlaceable(pos: RoomPosition): boolean {
  const terrain = Game.map.getRoomTerrain(pos.roomName);
  if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) return false;
  if (pos.x <= 0 || pos.x >= 49 || pos.y <= 0 || pos.y >= 49) return false;
  const blockers = pos.lookFor(LOOK_STRUCTURES);
  if (blockers.length) return false;
  const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
  if (sites.length) return false;
  return true;
}

export function planInitialStructures(spawn: StructureSpawn): BuildIntent[] {
  const controller = spawn.room.controller;
  if (!controller || controller.level < 2) return [];

  const existingExtensions = spawn.room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_EXTENSION,
  }).length;
  const pendingExtensions = spawn.room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: site => site.structureType === STRUCTURE_EXTENSION,
  }).length;

  const allowedCount = CONTROLLER_STRUCTURES.extension?.[controller.level] ?? 0;
  const needed = Math.max(allowedCount - (existingExtensions + pendingExtensions), 0);
  if (needed <= 0) return [];

  // Keep a clear moat around spawn (no extensions adjacent).
  const moat = 2;

  // Choose a farm direction away from controller (if present), otherwise east.
  const directions: Array<{ dx: number; dy: number }> = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  let farmDir = directions[0];
  if (controller) {
    const vx = spawn.pos.x - controller.pos.x;
    const vy = spawn.pos.y - controller.pos.y;
    farmDir =
      Math.abs(vx) >= Math.abs(vy)
        ? vx >= 0
          ? { dx: 1, dy: 0 }
          : { dx: -1, dy: 0 }
        : vy >= 0
        ? { dx: 0, dy: 1 }
        : { dx: 0, dy: -1 };
  }

  const intents: BuildIntent[] = [];
  // Build a 3xN strip starting moat tiles away in the farm direction.
  const startX = spawn.pos.x + farmDir.dx * moat;
  const startY = spawn.pos.y + farmDir.dy * moat;

  for (let offset = 0; offset < needed * 2 && intents.length < needed; offset++) {
    for (let lateral = -1; lateral <= 1 && intents.length < needed; lateral++) {
      const x = startX + farmDir.dx * offset + (farmDir.dy !== 0 ? lateral : 0);
      const y = startY + farmDir.dy * offset + (farmDir.dx !== 0 ? lateral : 0);
      const candidate = new RoomPosition(x, y, spawn.pos.roomName);
      const dist = Math.abs(candidate.x - spawn.pos.x) + Math.abs(candidate.y - spawn.pos.y);
      if (dist < moat) continue;
      if (!isPlaceable(candidate)) continue;
      intents.push({ structureType: STRUCTURE_EXTENSION, pos: candidate });
    }
  }

  if (intents.length > 0) return intents;

  // Could not find a spot; surface a visual hint near the spawn.
  spawn.room.visual.text("No extension spot", spawn.pos.x, spawn.pos.y + 1, {
    color: "red",
    font: 0.6,
    opacity: 0.8,
  });
  return [];
}
