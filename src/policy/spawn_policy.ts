import { ROLES, RoleId } from "roles/constants";

export function desiredRoleCountsForSpawn(
  spawn: StructureSpawn
): Partial<Record<RoleId, number>> {
  const capacity = spawn.room.energyCapacityAvailable;

  if (capacity >= 800) {
    return {
      [ROLES.HARVESTER]: 3,
      [ROLES.UPGRADER]: 2,
      [ROLES.BUILDER]: 2,
    };
  }

  if (capacity >= 550) {
    return {
      [ROLES.HARVESTER]: 2,
      [ROLES.UPGRADER]: 2,
      [ROLES.BUILDER]: 1,
    };
  }

  if (capacity >= 400) {
    return {
      [ROLES.HARVESTER]: 2,
      [ROLES.UPGRADER]: 2,
      [ROLES.BUILDER]: 1,
    };
  }

  if (capacity >= 300) {
    return {
      [ROLES.HARVESTER]: 2,
      [ROLES.UPGRADER]: 1,
      [ROLES.BUILDER]: 1,
    };
  }

  return {
    [ROLES.HARVESTER]: 1,
    [ROLES.UPGRADER]: 1,
  };
}
