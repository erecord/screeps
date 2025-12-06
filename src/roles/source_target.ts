export function getOrAssignSource(creep: Creep): Source | null {
  if (creep.memory.harvestTargetId) {
    const existingSource = Game.getObjectById(creep.memory.harvestTargetId);
    if (existingSource && existingSource.energy > 0) {
      return existingSource;
    }
    // Clear if empty or missing
    creep.memory.harvestTargetId = undefined;
  }

  const sources = creep.room.find(FIND_SOURCES_ACTIVE);
  if (!sources.length) return null;

  const counts = countAssignments(creep.room);
  const selected =
    _.reduce(
      sources,
      (best, src) => {
        if (!best) return src;
        const bestCount = counts[best.id] ?? 0;
        const thisCount = counts[src.id] ?? 0;
        return thisCount < bestCount ? src : best;
      },
      null as Source | null
    ) ?? sources[0];

  creep.memory.harvestTargetId = selected.id;
  return selected;
}

function countAssignments(room: Room): Record<Id<Source>, number> {
  const counts: Record<Id<Source>, number> = {};
  _.forEach(Game.creeps, c => {
    if (c.room.name !== room.name) return;
    const id = c.memory.harvestTargetId as Id<Source> | undefined;
    if (!id) return;
    counts[id] = (counts[id] ?? 0) + 1;
  });
  return counts;
}
