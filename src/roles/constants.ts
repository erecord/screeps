export const ROLES = {
  HARVESTER: "harvester",
  UPGRADER: "upgrader",
  BUILDER: "builder",
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];
