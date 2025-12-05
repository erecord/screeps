import { ROLES, RoleId } from "roles/constants";

export const ROLE_BODIES: Record<RoleId, BodyPartConstant[]> = {
  [ROLES.HARVESTER]: [WORK, WORK, CARRY, MOVE],
  [ROLES.UPGRADER]: [WORK, CARRY, CARRY, MOVE],
  [ROLES.BUILDER]: [WORK, CARRY, CARRY, MOVE],
};

export const ROLE_PRIORITY: RoleId[] = [ROLES.HARVESTER, ROLES.UPGRADER, ROLES.BUILDER];
