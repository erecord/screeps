import { ROLES, RoleId } from "roles/constants";
import { adjustDesiredForDefense } from "defense/defense_manager";
import { adjustForConstruction } from "construction/construction_manager";

export function desiredRoleCountsForSpawn(
  spawn: StructureSpawn
): Partial<Record<RoleId, number>> {
  const capacity = spawn.room.energyCapacityAvailable;

  if (capacity >= 800) {
    return {
      [ROLES.HARVESTER]: 3,
      [ROLES.UPGRADER]: 2,
      [ROLES.BUILDER]: 2,
      [ROLES.DEFENDER]: spawn.room.controller && spawn.room.controller.level >= 2 ? 1 : 0,
    };
  }

  if (capacity >= 550) {
    return {
      [ROLES.HARVESTER]: 2,
      [ROLES.UPGRADER]: 2,
      [ROLES.BUILDER]: 1,
      [ROLES.DEFENDER]: spawn.room.controller && spawn.room.controller.level >= 2 ? 1 : 0,
    };
  }

  if (capacity >= 300) {
    return {
      [ROLES.HARVESTER]: 2,
      [ROLES.UPGRADER]: 1,
      [ROLES.BUILDER]: 1,
      [ROLES.DEFENDER]: 0,
    };
  }

  return {
    [ROLES.HARVESTER]: 1,
    [ROLES.UPGRADER]: 1,
    [ROLES.DEFENDER]: 0,
  };
}

export function desiredRolesWithContext(
  spawn: StructureSpawn
): Partial<Record<RoleId, number>> {
  const base = desiredRoleCountsForSpawn(spawn);
  const withConstruction = adjustForConstruction(spawn, base);
  return adjustDesiredForDefense(withConstruction, spawn.room);
}
