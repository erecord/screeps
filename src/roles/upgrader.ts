import {
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

const upgraderAct = (context: RoleContext) => {
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
