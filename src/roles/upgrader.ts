import { drawPathToTarget, fallbackBuildOrUpgrade, runWithComponents, RoleContext } from "roles/components";
import { ROLE_STATE } from "roles/constants";
import { RoleStrategy } from "roles/types";

const upgraderAct = (context: RoleContext) => {
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

  // Spend energy upgrading the controller
  const controller = creep.room.controller;
  if (!controller) return;

  context.target = controller;
  const upgradeResult = creep.upgradeController(controller);
  if (upgradeResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  }
};

const roleUpgrader: RoleStrategy = {
  act: upgraderAct,
  components: [fallbackBuildOrUpgrade, drawPathToTarget],
};

export default roleUpgrader;
