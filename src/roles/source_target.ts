export function getOrAssignSource(creep: Creep): Source | null {
  if (creep.memory.harvestTargetId) {
    const existingSource = Game.getObjectById(creep.memory.harvestTargetId);
    if (existingSource && existingSource.energy > 0) {
      return existingSource;
    }
    // Clear if empty or missing
    creep.memory.harvestTargetId = undefined;
  }

  const closestActiveSource = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  if (closestActiveSource) {
    creep.memory.harvestTargetId = closestActiveSource.id;
    return closestActiveSource;
  }

  return null;
}
