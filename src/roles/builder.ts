import {
  deliverToSpawnAndExtensions,
  drawPathToTarget,
  fallbackBuildOrUpgrade,
  refuelTowersPeriodic,
  runWithComponents,
  RoleContext,
} from "roles/components";
import { ROLE_STATE } from "roles/constants";
import { RoleStrategy } from "roles/types";
import { updateRoleState } from "roles/role_state";
import { getOrAssignSource } from "roles/source_target";

const builderAct = (context: RoleContext) => {
  const { creep } = context;
  const state = updateRoleState(creep);

  if (state === ROLE_STATE.GATHER) {
    // Harvest until full
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

  // In work mode with energy: delegate to fallback component (build or upgrade)
};

const roleBuilder: RoleStrategy = {
  act: builderAct,
  components: [
    refuelTowersPeriodic(20),
    fallbackBuildOrUpgrade,
    drawPathToTarget,
  ],
};

export default roleBuilder;
