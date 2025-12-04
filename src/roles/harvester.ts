import { drawPathToTarget, runWithComponents, RoleContext } from "roles/components";

const harvesterAct = (context: RoleContext) => {
  const { creep } = context;

  if (creep.memory.working && creep.store.getFreeCapacity() === 0) {
    creep.memory.working = false;
  } else if (!creep.memory.working && creep.store.getUsedCapacity() === 0) {
    creep.memory.working = true;
  }

  if (creep.memory.working) {
    // Harvest until energy storage is full
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

  // When full: deposit to spawn if possible; otherwise upgrade or feed other sinks
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.working = true;
    return;
  }

  const spawnPreferred = Game.spawns["Spawn1"];
  const spawnWithRoom =
    (spawnPreferred && spawnPreferred.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      ? spawnPreferred
      : undefined) ??
    _.find(Object.values(Game.spawns), s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

  if (spawnWithRoom) {
    context.target = spawnWithRoom;
    const transferResult = creep.transfer(spawnWithRoom, RESOURCE_ENERGY);
    if (transferResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(spawnWithRoom);
    }
    return;
  }

  const controller = creep.room.controller;
  if (controller) {
    context.target = controller;
    const upgradeResult = creep.upgradeController(controller);
    if (upgradeResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    }
    return;
  }

  const alternativeSink = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_EXTENSION ||
        structure.structureType === STRUCTURE_SPAWN) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  });

  if (alternativeSink) {
    context.target = alternativeSink;
    const transferResult = creep.transfer(alternativeSink, RESOURCE_ENERGY);
    if (transferResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(alternativeSink);
    }
  }
};

const roleHarvester = {
  run(creep: Creep) {
    runWithComponents(creep, harvesterAct, [drawPathToTarget]);
  },
};

export default roleHarvester;
