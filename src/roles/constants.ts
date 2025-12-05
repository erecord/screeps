export const ROLES = {
  HARVESTER: "harvester",
  UPGRADER: "upgrader",
  BUILDER: "builder",
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

export const ROLE_STATE = {
  GATHER: "gather",
  DELIVER: "deliver",
} as const;

export type RoleState = typeof ROLE_STATE[keyof typeof ROLE_STATE];
