export const ROLES = {
  HARVESTER: "harvester",
  UPGRADER: "upgrader",
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];
