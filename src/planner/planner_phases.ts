import { PlacementValidator, boundsAndTerrainValidator, conflictValidator, moatAndRoadClearanceValidator, pathLengthValidator, existingStructureValidator } from "planner/planner_validators";
import { RoomSnapshot } from "planner/planner_snapshot";
import { ROLES, RoleId } from "roles/constants";

export interface PhaseConfig {
  name: string;
  enterWhen: (snapshot: RoomSnapshot) => boolean;
  validators: PlacementValidator[];
  structureTargets: Record<string, number>; // type -> desired count
  roleTargets: Partial<Record<RoleId, number>>;
}

export const DEFAULT_PHASES: PhaseConfig[] = [
  {
    name: "bootstrap",
    enterWhen: snapshot => snapshot.controllerLevel < 3,
    validators: defaultValidators(),
    structureTargets: {
      extension: 5,
      road: 10,
    },
    roleTargets: {
      [ROLES.HARVESTER]: 2,
      [ROLES.BUILDER]: 2,
      [ROLES.UPGRADER]: 1,
      [ROLES.DEFENDER]: 1,
    },
  },
  {
    name: "economy",
    enterWhen: snapshot => snapshot.controllerLevel >= 3 && snapshot.controllerLevel < 6,
    validators: defaultValidators(),
    structureTargets: {
      extension: 20,
      tower: 2,
      storage: 1,
    },
    roleTargets: {
      [ROLES.HARVESTER]: 3,
      [ROLES.BUILDER]: 2,
      [ROLES.UPGRADER]: 2,
      [ROLES.DEFENDER]: 1,
    },
  },
  {
    name: "defense",
    enterWhen: snapshot => snapshot.hostiles.length > 0,
    validators: defaultValidators(),
    structureTargets: {
      tower: 2,
      rampart: 10,
      wall: 20,
    },
    roleTargets: {
      [ROLES.DEFENDER]: 3,
      [ROLES.HARVESTER]: 2,
      [ROLES.BUILDER]: 2,
      [ROLES.UPGRADER]: 1,
    },
  },
  {
    name: "expansion",
    enterWhen: snapshot => snapshot.controllerLevel >= 6,
    validators: defaultValidators(),
    structureTargets: {
      extension: 50,
      tower: 4,
      storage: 1,
      terminal: 1,
      factory: 1,
      observer: 1,
    },
    roleTargets: {
      [ROLES.HARVESTER]: 3,
      [ROLES.BUILDER]: 3,
      [ROLES.UPGRADER]: 3,
      [ROLES.DEFENDER]: 2,
    },
  },
];

export function selectPhase(phases: PhaseConfig[], snapshot: RoomSnapshot): PhaseConfig {
  // Always honour defence if hostiles are present.
  const defencePhase = phases.find(p => p.name === "defense");
  if (snapshot.hostiles.length > 0 && defencePhase) {
    return defencePhase;
  }

  for (const phase of phases) {
    if (phase.enterWhen(snapshot)) return phase;
  }
  return phases[phases.length - 1];
}

function defaultValidators(): PlacementValidator[] {
  return [
    boundsAndTerrainValidator,
    moatAndRoadClearanceValidator,
    conflictValidator,
    existingStructureValidator,
    pathLengthValidator,
  ];
}
