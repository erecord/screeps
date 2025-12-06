import { ROLES, RoleId } from "roles/constants";

// Adjust desired role counts based on current construction demand.
export function adjustForConstruction(
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
