import { ROLES, RoleId } from "roles/constants";

type BodyMap = Record<RoleId, BodyPartConstant[]>;

// Returns a body tuned to current room energy capacity.
export function bodyForRole(spawn: StructureSpawn, role: RoleId): BodyPartConstant[] {
  const capacity = spawn.room.energyCapacityAvailable;

  if (capacity >= 550) {
    const bodies: BodyMap = {
      [ROLES.HARVESTER]: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE], // 500
      [ROLES.UPGRADER]: [WORK, WORK, WORK, CARRY, CARRY, MOVE], // 500
      [ROLES.BUILDER]: [WORK, WORK, CARRY, CARRY, MOVE, MOVE], // 400
    };
    return bodies[role] ?? [WORK, CARRY, MOVE];
  }

  if (capacity >= 400) {
    const bodies: BodyMap = {
      [ROLES.HARVESTER]: [WORK, WORK, WORK, CARRY, MOVE], // 350
      [ROLES.UPGRADER]: [WORK, WORK, CARRY, CARRY, MOVE], // 350
      [ROLES.BUILDER]: [WORK, WORK, CARRY, CARRY, MOVE], // 350
    };
    return bodies[role] ?? [WORK, CARRY, MOVE];
  }

  const baseline: BodyMap = {
    [ROLES.HARVESTER]: [WORK, WORK, CARRY, MOVE], // 250
    [ROLES.UPGRADER]: [WORK, CARRY, CARRY, MOVE], // 200
    [ROLES.BUILDER]: [WORK, CARRY, CARRY, MOVE], // 200
  };

  return baseline[role] ?? [WORK, CARRY, MOVE];
}
