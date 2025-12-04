import { drawPathToTarget, fallbackBuildOrUpgrade, runWithComponents, RoleContext } from "roles/components";

const builderAct = (context: RoleContext) => {
  const { creep } = context;

  if (creep.memory.working && creep.store.getFreeCapacity() === 0) {
    creep.memory.working = false;
  } else if (!creep.memory.working && creep.store.getUsedCapacity() === 0) {
    creep.memory.working = true;
  }

  if (creep.memory.working) {
    // Harvest until full
    const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    if (source) {
      context.target = source;
      const harvestResult = creep.harvest(source);
      if (harvestResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
    }
    return;
  }

  // In work mode with energy: delegate to fallback component (build or upgrade)
};

const roleBuilder = {
  run(creep: Creep) {
    runWithComponents(creep, builderAct, [fallbackBuildOrUpgrade, drawPathToTarget]);
  },
};

export default roleBuilder;
