import { ROLE_STATE, RoleState } from "roles/constants";

export function updateRoleState(creep: Creep): RoleState {
  if (!creep.memory.state) {
    creep.memory.state = creep.store.getUsedCapacity() > 0 ? ROLE_STATE.DELIVER : ROLE_STATE.GATHER;
  }

  if (creep.memory.state === ROLE_STATE.DELIVER && creep.store.getUsedCapacity() === 0) {
    creep.memory.state = ROLE_STATE.GATHER;
  }

  if (creep.memory.state === ROLE_STATE.GATHER && creep.store.getFreeCapacity() === 0) {
    creep.memory.state = ROLE_STATE.DELIVER;
  }

  return creep.memory.state;
}
