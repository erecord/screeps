import { drawPathToTarget, fallbackBuildOrUpgrade, runWithComponents, RoleContext } from "roles/components";
import { ROLE_STATE } from "roles/constants";
import { RoleStrategy } from "roles/types";
import { updateRoleState } from "roles/role_state";

const builderAct = (context: RoleContext) => {
  const { creep } = context;
  const state = updateRoleState(creep);

  if (state === ROLE_STATE.GATHER) {
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
