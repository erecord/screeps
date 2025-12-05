import { ROLES, RoleId } from "roles/constants";
import roleHarvester from "roles/harvester";
import roleUpgrader from "roles/upgrader";
import roleBuilder from "roles/builder";
import { RoleStrategy } from "roles/types";

export const roleRegistry: Partial<Record<RoleId, RoleStrategy>> = {
  [ROLES.HARVESTER]: roleHarvester,
  [ROLES.UPGRADER]: roleUpgrader,
  [ROLES.BUILDER]: roleBuilder,
};
