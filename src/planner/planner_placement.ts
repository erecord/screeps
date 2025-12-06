import { RoomSnapshot } from "planner/planner_snapshot";
import { PhaseConfig } from "planner/planner_phases";
import { applyValidators, PlacementCandidate } from "planner/planner_validators";
import {
  PHASE_SITES_PER_TICK,
  PHASE_SITES_PER_TICK_MAX,
  PLAN_FAILURE_RETRIES,
} from "planner/planner_constants";
import {
  loadStructurePlan,
  posToStored,
  saveStructurePlan,
  storedToPos,
  StructurePlan,
} from "planner/planner_plan_state";
import {
  cleanupEmptyPlan,
  loadFailureTracker,
  saveFailureTracker,
} from "planner/planner_plan_state";
import { loadRoadPlan, storedToPos as roadStoredToPos } from "roads/state";
import { posKey } from "roads/paths";

// Place a limited number of phase-planned structures each tick, respecting controller limits
// and validator chain. Roads are handled separately and prioritised elsewhere.
export function placePhaseStructures(
  spawn: StructureSpawn,
  snapshot: RoomSnapshot,
  phase: PhaseConfig
) {
  const plan = loadStructurePlan(spawn.room);
  const failures = loadFailureTracker(spawn.room);
  const controllerLevel = spawn.room.controller?.level ?? 1;
  const siteBudget =
    controllerLevel < 3
      ? 1
      : Math.min(
          PHASE_SITES_PER_TICK_MAX,
          PHASE_SITES_PER_TICK + Math.max(0, controllerLevel - 2)
        );
  let planChanged = false;
  let placed = 0;

  for (const [type, desiredCount] of Object.entries(phase.structureTargets)) {
    if (placed >= siteBudget) break;
    const structureType = type as StructureConstant;
    const controllerLevel = spawn.room.controller?.level ?? 0;
    const allowed =
      ((CONTROLLER_STRUCTURES as Record<string, { [level: number]: number }>)[structureType] &&
        (CONTROLLER_STRUCTURES as Record<string, { [level: number]: number }>)[structureType][
          controllerLevel
        ]) ??
      0;
    if (allowed === 0) continue;

    const targetCount = Math.min(desiredCount, allowed);
    const plannedList = ensurePlanList(plan, type as BuildableStructureConstant);
    const existingCount = countBuiltAndSites(snapshot.room, structureType);
    const desiredPlanned = Math.max(targetCount - existingCount, 0);

    // Prune stale extras if we already have enough planned.
    if (plannedList.length > desiredPlanned) {
      plannedList.length = desiredPlanned;
      planChanged = true;
    }

    const missing = targetCount - (existingCount + plannedList.length);

    if (missing > 0) {
      const added = planNewPositions(
        spawn,
        snapshot,
        phase.validators,
        type as BuildableStructureConstant,
        plannedList,
        missing
      );
      if (added > 0) planChanged = true;
    }

    const result = placeFromPlan(
      spawn,
      snapshot,
      phase.validators,
      type as BuildableStructureConstant,
      plannedList,
      Math.min(siteBudget - placed, targetCount),
      failures
    );
    placed += result.placed;
    if (result.planChanged) planChanged = true;
  }

  if (planChanged) {
    saveStructurePlan(spawn.room, plan);
  }
  saveFailureTracker(spawn.room, failures);
  cleanupEmptyPlan(spawn.room, plan);
}

function ensurePlanList(plan: StructurePlan, type: BuildableStructureConstant) {
  if (!plan.structures[type]) {
    plan.structures[type] = [];
  }
  return plan.structures[type]!;
}

function countBuiltAndSites(room: Room, type: StructureConstant): number {
  const built = room.find(FIND_STRUCTURES, { filter: s => s.structureType === type }).length;
  const sites = room.find(FIND_CONSTRUCTION_SITES, { filter: s => s.structureType === type }).length;
  return built + sites;
}

// Add new planned positions for a structure type using a simple ring search.
function planNewPositions(
  spawn: StructureSpawn,
  snapshot: RoomSnapshot,
  validators: PhaseConfig["validators"],
  structureType: BuildableStructureConstant,
  plannedList: ReturnType<typeof ensurePlanList>,
  missing: number
): number {
  let added = 0;
  const existingKeys = new Set(plannedList.map(stored => posKey(storedToPos(stored))));
  const roadPositions =
    snapshot.myStructures.find(s => s.type === STRUCTURE_ROAD)?.positions ?? [];

  // Keep placements aligned to the planned road spine (roundabout + POI routes)
  const plannedRoadPositions = loadRoadPlan(spawn.room);
  const spineRoads: RoomPosition[] = [];
  plannedRoadPositions.roundabout.forEach(pos => spineRoads.push(roadStoredToPos(pos)));
  Object.values(plannedRoadPositions.routes).forEach(route =>
    route.forEach(pos => spineRoads.push(roadStoredToPos(pos)))
  );
  const controllerPos = spawn.room.controller?.pos;
  const sources = snapshot.sources;
  const candidates: Array<{ pos: RoomPosition; score: number }> = [];
  const MAX_CANDIDATES = 200;

  // TODO: replace ring search with layout-aware placement (POI-aligned roads/blocks).
  const radiusMax = 8;
  for (let r = 2; r <= radiusMax && added < missing; r++) {
    for (let dx = -r; dx <= r && added < missing; dx++) {
      for (let dy = -r; dy <= r && added < missing; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // ring only
        if (candidates.length >= MAX_CANDIDATES) break;
        const pos = new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, spawn.pos.roomName);
        const candidate: PlacementCandidate = { pos, structureType };
        const key = posKey(pos);
        if (existingKeys.has(key)) continue;
        if (!applyValidators(candidate, snapshot, validators)) continue;
        candidates.push({
          pos,
          score: scoreCandidate(
            pos,
            spawn.pos,
            roadPositions,
            spineRoads,
            controllerPos,
            sources
          ),
        });
      }
    }
  }

  candidates
    .sort((a, b) => a.score - b.score)
    .slice(0, missing)
    .forEach(({ pos }) => {
      plannedList.push(posToStored(pos));
      existingKeys.add(posKey(pos));
      added++;
    });

  return added;
}

// Place from the stored plan; prune entries that are now built/blocked/unplaceable.
function placeFromPlan(
  spawn: StructureSpawn,
  snapshot: RoomSnapshot,
  validators: PhaseConfig["validators"],
  structureType: BuildableStructureConstant,
  plannedList: ReturnType<typeof ensurePlanList>,
  budget: number,
  failures: ReturnType<typeof loadFailureTracker>
): { placed: number; planChanged: boolean } {
  let placed = 0;
  let planChanged = false;
  const remaining: typeof plannedList = [];

  for (const stored of plannedList) {
    const pos = storedToPos(stored);
    const candidate: PlacementCandidate = { pos, structureType };

    // Drop entries that are now invalid.
    if (!applyValidators(candidate, snapshot, validators)) {
      planChanged = true;
      continue;
    }

    const structures = pos.lookFor(LOOK_STRUCTURES);
    if (structures.some(s => s.structureType === structureType)) {
      clearFailure(failures, posKey(pos));
      planChanged = true; // already built
      continue;
    }
    if (structures.length) {
      if (shouldDrop(failures, posKey(pos))) {
        planChanged = true; // blocked long-term, prune
      } else {
        remaining.push(stored);
      }
      continue;
    }

    const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
    if (sites.some(site => site.structureType === structureType)) {
      clearFailure(failures, posKey(pos));
      planChanged = true; // already queued as a site
      continue;
    }
    if (sites.length) {
      if (shouldDrop(failures, posKey(pos))) {
        planChanged = true; // blocked long-term, prune
      } else {
        remaining.push(stored);
      }
      continue;
    }

    if (placed >= budget) {
      remaining.push(stored);
      continue;
    }

    const result = spawn.room.createConstructionSite(pos, structureType);
    if (result === OK) {
      clearFailure(failures, posKey(pos));
      placed++;
      planChanged = true;
    } else {
      // If we cannot place here (e.g., terrain or blocking), drop only after a few retries.
      if (shouldDrop(failures, posKey(pos))) {
        planChanged = true;
      } else {
        remaining.push(stored);
      }
    }
  }

  plannedList.length = 0;
  plannedList.push(...remaining);

  return { placed, planChanged };
}

function shouldDrop(failures: ReturnType<typeof loadFailureTracker>, key: string): boolean {
  const count = failures.failures[key] ?? 0;
  failures.failures[key] = count + 1;
  return failures.failures[key] > PLAN_FAILURE_RETRIES;
}

function clearFailure(failures: ReturnType<typeof loadFailureTracker>, key: string) {
  if (failures.failures[key]) {
    delete failures.failures[key];
  }
}

function scoreCandidate(
  pos: RoomPosition,
  spawnPos: RoomPosition,
  roadPositions: RoomPosition[],
  spineRoads: RoomPosition[],
  controllerPos: RoomPosition | undefined,
  sources: Source[]
): number {
  const WEIGHTS = {
    road: 0.3,
    spine: 0.5,
    controller: 0.25,
    source: 0.2,
  };

  const spawnRange = pos.getRangeTo(spawnPos);
  const roadRange =
    roadPositions.length > 0
      ? Math.min(...roadPositions.map(rp => pos.getRangeTo(rp)))
      : spawnRange;
  const spineRange =
    spineRoads.length > 0 ? Math.min(...spineRoads.map(rp => pos.getRangeTo(rp))) : roadRange;
  const controllerRange = controllerPos ? pos.getRangeTo(controllerPos) : spawnRange;
  const sourceRange =
    sources.length > 0 ? Math.min(...sources.map(src => pos.getRangeTo(src.pos))) : spawnRange;

  // Lower is better: prefer near roads/spawn and POIs; avoid isolating away from sources.
  // Extra bias to stay near planned road spines to keep layouts connected/diagonal-friendly.
  return (
    spawnRange +
    roadRange * WEIGHTS.road +
    spineRange * WEIGHTS.spine +
    controllerRange * WEIGHTS.controller +
    sourceRange * WEIGHTS.source
  );
}
