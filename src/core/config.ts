import { ROLES, RoleId } from "roles/constants";

// Order matters: fill harvesters, then ensure a builder exists, then upgraders.
export const ROLE_PRIORITY: RoleId[] = [ROLES.HARVESTER, ROLES.BUILDER, ROLES.UPGRADER];
