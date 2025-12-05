import { drawPathToTarget, fallbackBuildOrUpgrade, runWithComponents, RoleContext } from "roles/components";
import { ROLE_STATE } from "roles/constants";
import { RoleStrategy } from "roles/types";

const builderAct = (context: RoleContext) => {
  const { creep } = context;

  if (!creep.memory.state) {
    creep.memory.state = creep.store.getUsedCapacity() > 0 ? ROLE_STATE.DELIVER : ROLE_STATE.GATHER;
  }
  if (creep.memory.state === ROLE_STATE.DELIVER && creep.store.getUsedCapacity() === 0) {
    creep.memory.state = ROLE_STATE.GATHER;
  }
  if (creep.memory.state === ROLE_STATE.GATHER && creep.store.getFreeCapacity() === 0) {
    creep.memory.state = ROLE_STATE.DELIVER;
  }

  if (creep.memory.state === ROLE_STATE.GATHER) {
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

const roleBuilder: RoleStrategy = {
  act: builderAct,
  components: [fallbackBuildOrUpgrade, drawPathToTarget],
};

export default roleBuilder;
