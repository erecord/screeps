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
};

export interface BodyPlan {
  target: BodyPartConstant[];
  minimum: BodyPartConstant[];
}

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
  return { target, minimum };
}
