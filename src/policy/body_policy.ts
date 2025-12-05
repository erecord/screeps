import { ROLES, RoleId } from "roles/constants";

type BodyTiers = Record<RoleId, BodyPartConstant[][]>;

export function bodyCost(body: BodyPartConstant[]): number {
  return body.reduce((sum, part) => sum + BODYPART_COST[part], 0);
}

// Returns the best body we can afford right now, preferring larger tiers when energy allows.
export function bodyForRole(spawn: StructureSpawn, role: RoleId): BodyPartConstant[] {
  const available = spawn.room.energyAvailable;

  const tiers: BodyTiers = {
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

  const roleTiers = tiers[role] ?? [[WORK, CARRY, MOVE]];
  for (const body of roleTiers) {
    if (bodyCost(body) <= available) {
      return body;
    }
  }

  // If nothing is affordable yet (e.g. room energy still refilling), return the smallest as a target.
  return roleTiers[roleTiers.length - 1];
}
