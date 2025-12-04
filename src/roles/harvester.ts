import { drawPathToTarget, runWithComponents, RoleContext } from "roles/components";

const harvesterAct = (context: RoleContext) => {
  const { creep } = context;

  if (creep.memory.working && creep.store.getFreeCapacity() === 0) {
    creep.memory.working = false;
  } else if (!creep.memory.working && creep.store.getUsedCapacity() === 0) {
    creep.memory.working = true;
  }

  if (creep.memory.working) {
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

  const spawn = Game.spawns["Spawn1"] ?? Object.values(Game.spawns)[0];
  if (!spawn) return;

  context.target = spawn;
  const transferResult = creep.transfer(spawn, RESOURCE_ENERGY);

  if (transferResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(spawn);
    return;
  }

  // If the spawn is full, fall back to any structure that can accept energy
  if (transferResult === ERR_FULL) {
    const altTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure =>
        (structure.structureType === STRUCTURE_EXTENSION ||
          structure.structureType === STRUCTURE_SPAWN) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });

    if (altTarget) {
      context.target = altTarget;
      const altTransfer = creep.transfer(altTarget, RESOURCE_ENERGY);
      if (altTransfer === ERR_NOT_IN_RANGE) {
        creep.moveTo(altTarget);
      }
    }
  }
};

const roleHarvester = {
  run(creep: Creep) {
    runWithComponents(creep, harvesterAct, [drawPathToTarget]);
  },
};

export default roleHarvester;
