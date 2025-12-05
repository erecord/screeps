import { drawPathToTarget, fallbackBuildOrUpgrade, runWithComponents, RoleContext } from "roles/components";
import { ROLE_STATE } from "roles/constants";
import { RoleStrategy } from "roles/types";
import { updateRoleState } from "roles/state";

const harvesterAct = (context: RoleContext) => {
  const { creep } = context;
  const state = updateRoleState(creep);

  if (state === ROLE_STATE.GATHER) {
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

  // When full: deposit to spawn if possible; otherwise let components handle fallback
  // Deliver to closest spawn/extension with free capacity
  const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_EXTENSION) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  }) as StructureExtension | StructureSpawn | null;

  if (target) {
    context.target = target;
    const transferResult = creep.transfer(target, RESOURCE_ENERGY);
    if (transferResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
    }
  }
};

const roleHarvester: RoleStrategy = {
  act: harvesterAct,
  components: [fallbackBuildOrUpgrade, drawPathToTarget],
};

export default roleHarvester;
