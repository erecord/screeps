import {
  deliverToSpawnAndExtensions,
  drawPathToTarget,
  fallbackBuildOrUpgrade,
  refuelTowers,
  runWithComponents,
  RoleContext,
} from "roles/components";
import { ROLE_STATE } from "roles/constants";
import { RoleStrategy } from "roles/types";
import { updateRoleState } from "roles/role_state";
import { getOrAssignSource } from "roles/source_target";

const harvesterAct = (context: RoleContext) => {
  const { creep } = context;
  const state = updateRoleState(creep);

  if (state === ROLE_STATE.GATHER) {
    const source = getOrAssignSource(creep);
    if (source) {
      context.target = source;
      const harvestResult = creep.harvest(source);
      if (harvestResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
    }
    return;
  }

  // When full (state === DELIVER): deposit to structures if carrying energy
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) return;
};

const roleHarvester: RoleStrategy = {
  act: harvesterAct,
  components: [
    refuelTowers,
    deliverToSpawnAndExtensions,
    fallbackBuildOrUpgrade,
    drawPathToTarget,
  ],
};

export default roleHarvester;
