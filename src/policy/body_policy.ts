import { ROLES, RoleId } from "roles/constants";

type BodyTiers = Record<RoleId, BodyPartConstant[][]>;

export function bodyCost(body: BodyPartConstant[]): number {
  return body.reduce((sum, part) => sum + BODYPART_COST[part], 0);
}

export const EMERGENCY_BODY: BodyPartConstant[] = [WORK, MOVE]; // 150

const TIERS: BodyTiers = {
  [ROLES.HARVESTER]: [
    [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE], // 500
    [WORK, WORK, WORK, CARRY, MOVE], // 350
    [WORK, WORK, CARRY, MOVE], // 250
    [WORK, CARRY, MOVE], // 200
  ],
  [ROLES.UPGRADER]: [
    [WORK, WORK, WORK, CARRY, CARRY, MOVE], // 500
    [WORK, WORK, CARRY, CARRY, MOVE], // 350
    [WORK, CARRY, CARRY, MOVE], // 200
  ],
  [ROLES.BUILDER]: [
    [WORK, WORK, CARRY, CARRY, MOVE, MOVE], // 400
    [WORK, WORK, CARRY, CARRY, MOVE], // 350
    [WORK, CARRY, CARRY, MOVE], // 200
  ],
  [ROLES.DEFENDER]: [
    [TOUGH, TOUGH, MOVE, MOVE, ATTACK, ATTACK], // 260
    [MOVE, MOVE, ATTACK, ATTACK], // 260 alternative if tough not desired
    [MOVE, MOVE, ATTACK], // 190
    [MOVE, ATTACK], // 130
  ],
};

export interface BodyPlan {
  target: BodyPartConstant[];
  minimum: BodyPartConstant[];
}

// Chance to spawn an armoured variant per role (swaps WORK for ATTACK/TOUGH at higher RCL)
const ARMOURED_RATIOS: Partial<Record<RoleId, number>> = {
  [ROLES.HARVESTER]: 0.1,
  [ROLES.UPGRADER]: 0.1,
  [ROLES.BUILDER]: 0.1,
  // Defenders already attack-focused
};
const ARMOURED_MIN_RCL = 4; // Only apply armoured variants at or above this RCL

// Decide a target body based on energy capacity, and a minimum fallback to avoid deadlocks.
export function bodyPlanForRole(spawn: StructureSpawn, role: RoleId): BodyPlan {
  const capacity = spawn.room.energyCapacityAvailable;
  const tiers = TIERS[role] ?? [[WORK, CARRY, MOVE]];

  // Pick the largest tier we could ever pay given current capacity.
  let target = tiers[tiers.length - 1];
  for (const body of tiers) {
    if (bodyCost(body) <= capacity) {
      target = body;
      break;
    }
  }

  const minimum = tiers[tiers.length - 1];

  const maybeArmoured = maybeApplyArmouredVariant(target, role, capacity, spawn.room.controller?.level ?? 0);

  return { target: maybeArmoured, minimum };
}

function maybeApplyArmouredVariant(
  body: BodyPartConstant[],
  role: RoleId,
  capacity: number,
  controllerLevel: number
): BodyPartConstant[] {
  if (capacity < 550) return body;
  if (role === ROLES.DEFENDER) return body;
  if (controllerLevel < ARMOURED_MIN_RCL) return body;
  const ratio = ARMOURED_RATIOS[role] ?? 0;
  if (Math.random() > ratio) return body;

  const variant = [...body];
  const workIndex = variant.lastIndexOf(WORK);
  if (workIndex !== -1) {
    variant[workIndex] = ATTACK;
  }
  // Optionally add a tough by replacing a CARRY if present
  const carryIndex = variant.lastIndexOf(CARRY);
  if (carryIndex !== -1 && Math.random() > 0.5) {
    variant[carryIndex] = TOUGH;
  }
  return variant;
}
