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

  const intents: BuildIntent[] = [];
  // Try a growing ring search around the spawn for each needed extension.
  for (let range = 1; range <= 7 && intents.length < needed; range++) {
    for (let dx = -range; dx <= range && intents.length < needed; dx++) {
      for (let dy = -range; dy <= range && intents.length < needed; dy++) {
        if (Math.abs(dx) !== range && Math.abs(dy) !== range) continue; // only outer ring
        const candidate = new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, spawn.pos.roomName);
        if (!isPlaceable(candidate)) continue;
        intents.push({ structureType: STRUCTURE_EXTENSION, pos: candidate });
      }
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
