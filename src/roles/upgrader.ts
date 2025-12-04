import { drawPathToTarget, runWithComponents, RoleContext } from "roles/components";

const upgraderAct = (context: RoleContext) => {
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

  // Spend energy upgrading the controller
  const controller = creep.room.controller;
  if (!controller) return;

  context.target = controller;
  const upgradeResult = creep.upgradeController(controller);
  if (upgradeResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  }
};

const roleUpgrader = {
  run(creep: Creep) {
    runWithComponents(creep, upgraderAct, [drawPathToTarget]);
  },
};

export default roleUpgrader;
