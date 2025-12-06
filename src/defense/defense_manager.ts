import { ROLES, RoleId } from "roles/constants";

// Computes whether the room should be in defense posture and adjusts desired defender counts.
export function isDefenseMode(room: Room): boolean {
  if (Memory.defendMode) return true;
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  return hostiles.length > 0;
}

export function adjustDesiredForDefense(
  desired: Partial<Record<RoleId, number>>,
  room: Room
): Partial<Record<RoleId, number>> {
  if (!isDefenseMode(room)) return desired;
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  if (!hostiles.length) return desired;

  const adjusted = { ...desired };
  const defendersTarget = Math.min(
    hostiles.length,
    Math.max(1, Math.floor(room.energyCapacityAvailable / 300))
  );

  adjusted[ROLES.DEFENDER] = Math.max(adjusted[ROLES.DEFENDER] ?? 0, defendersTarget);
  return adjusted;
}
