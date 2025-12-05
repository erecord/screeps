const radiusOffsets = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], /*spawn*/ [1, 0],
  [-1, 1], [0, 1], [1, 1],
  [-2, 0], [2, 0], [0, -2], [0, 2],
];

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

export function planInitialStructures(spawn: StructureSpawn) {
  const controller = spawn.room.controller;
  if (!controller || controller.level < 2) return;

  const existingExtensions = spawn.room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_EXTENSION,
  }).length;
  const pendingExtensions = spawn.room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: site => site.structureType === STRUCTURE_EXTENSION,
  }).length;

  if (existingExtensions + pendingExtensions >= 1) return;

  for (const [dx, dy] of radiusOffsets) {
    const candidate = new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, spawn.pos.roomName);
    if (!isPlaceable(candidate)) continue;
    const result = spawn.room.createConstructionSite(candidate, STRUCTURE_EXTENSION);
    if (result === OK) {
      console.log(`Planned extension at ${candidate.x},${candidate.y}`);
      spawn.room.visual.text("Extension planned", candidate.x, candidate.y, {
        color: "yellow",
        font: 0.5,
        opacity: 0.8,
      });
      Game.notify(`Planned extension at ${spawn.room.name} (${candidate.x},${candidate.y})`);
    }
    return;
  }

  console.log("planInitialStructures() 🟢");
}
