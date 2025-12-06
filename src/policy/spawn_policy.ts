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

export function desiredRolesWithContext(
  spawn: StructureSpawn
): Partial<Record<RoleId, number>> {
  const base = desiredRoleCountsForSpawn(spawn);
  return adjustForConstruction(spawn, base);
}

function adjustForConstruction(
  spawn: StructureSpawn,
  desired: Partial<Record<RoleId, number>>
): Partial<Record<RoleId, number>> {
  const sites = spawn.room.find(FIND_CONSTRUCTION_SITES);
  if (!sites.length) return desired;

  const adjusted = { ...desired };
  const currentBuilders = adjusted[ROLES.BUILDER] ?? 0;

  // Scale builders modestly with active sites; ensure at least 2 when building.
  const extra = Math.min(2, Math.ceil(sites.length / 5));
  adjusted[ROLES.BUILDER] = Math.max(currentBuilders, currentBuilders + extra, 2);

  return adjusted;
}
