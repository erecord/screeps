import { drawPathToTarget, runWithComponents, RoleContext } from "roles/components";
import { ROLES } from "roles/constants";

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

  // Build if a site exists; otherwise help upgrade
  const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  if (site) {
    context.target = site;
    const buildResult = creep.build(site);
    if (buildResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(site);
    }
    return;
  }

  // If nothing to build, help upgrade the controller.
  const controller = creep.room.controller;
  if (controller) {
    context.target = controller;
    const upgradeResult = creep.upgradeController(controller);
    if (upgradeResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    }
  }
};

const roleBuilder = {
  run(creep: Creep) {
    runWithComponents(creep, builderAct, [drawPathToTarget]);
  },
};

export default roleBuilder;
