import { MAX_ROUTE_LENGTH } from "planner/planner_constants";
import { RoomSnapshot } from "planner/planner_snapshot";
import { posKey } from "roads/paths";

export interface PlacementCandidate {
  pos: RoomPosition;
  structureType: BuildableStructureConstant;
}

export type ValidatorResult = "accept" | "reject";

export type PlacementValidator = (
  candidate: PlacementCandidate,
  snapshot: RoomSnapshot
) => ValidatorResult;

export function applyValidators(
  candidate: PlacementCandidate,
  snapshot: RoomSnapshot,
  validators: PlacementValidator[]
): boolean {
  for (const validate of validators) {
    if (validate(candidate, snapshot) === "reject") return false;
  }
  return true;
}

export const boundsAndTerrainValidator: PlacementValidator = candidate => {
  const { pos } = candidate;
  if (pos.x <= 0 || pos.x >= 49 || pos.y <= 0 || pos.y >= 49) return "reject";
  const terrain = Game.map.getRoomTerrain(pos.roomName);
  if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) return "reject";
  return "accept";
};

export const moatAndRoadClearanceValidator: PlacementValidator = (candidate, snapshot) => {
  const { pos } = candidate;
  // Keep clear around spawn moat (2-tile radius) and existing roads.
  const spawns = snapshot.spawns;
  if (
    spawns.some(spawn => Math.max(Math.abs(pos.x - spawn.pos.x), Math.abs(pos.y - spawn.pos.y)) < 2)
  ) {
    return "reject";
  }

  const roads = snapshot.myStructures.find(s => s.type === STRUCTURE_ROAD);
  if (
    roads &&
    roads.positions.some(roadPos => roadPos.x === pos.x && roadPos.y === pos.y) // avoid overlapping planned roads
  ) {
    return "reject";
  }

  return "accept";
};

export const pathLengthValidator: PlacementValidator = (candidate, snapshot) => {
  // Skip pathfinding-heavy validation in early bootstrap to save CPU.
  if (snapshot.controllerLevel < 3) return "accept";
  const spawn = snapshot.spawns[0];
  if (!spawn) return "accept";
  const result = PathFinder.search(spawn.pos, { pos: candidate.pos, range: 1 });
  if (result.incomplete) return "reject";
  if (result.path.length > MAX_ROUTE_LENGTH) return "reject";
  return "accept";
};

export const conflictValidator: PlacementValidator = candidate => {
  const structures = candidate.pos.lookFor(LOOK_STRUCTURES);
  if (structures.some(s => s.structureType !== STRUCTURE_ROAD)) return "reject";
  const sites = candidate.pos.lookFor(LOOK_CONSTRUCTION_SITES);
  if (sites.length) return "reject";
  return "accept";
};

export const existingStructureValidator: PlacementValidator = (candidate, snapshot) => {
  const key = posKey(candidate.pos);
  if (!snapshot.occupied.has(key)) return "accept";
  // Allow if same structure type already exists
  const structs = candidate.pos.lookFor(LOOK_STRUCTURES);
  if (structs.some(s => s.structureType === candidate.structureType)) return "accept";
  // Otherwise avoid colliding with existing build
  return "reject";
};
