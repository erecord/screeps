import { planRoundabout, planRoute, dedupePositions, posKey, toStoredList } from "roads/paths";
import { loadRoadPlan, saveRoadPlan, storedToPos, RoadPlan } from "roads/state";

const REPLAN_INTERVAL = 1000;
const SITES_PER_TICK = 3;

export function planRoads(room: Room) {
  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (!spawn) return;

  let plan = loadRoadPlan(room);
  const stale = Game.time - plan.lastPlanned > REPLAN_INTERVAL;
  if (stale) {
    plan = recomputePlan(room, spawn);
    saveRoadPlan(room, plan);
  }

  syncRoads(plan, room);
}

function recomputePlan(room: Room, spawn: StructureSpawn): RoadPlan {
  const roundabout = planRoundabout(spawn);
  const routes: Record<string, ReturnType<typeof toStoredList>> = {};

  const targets = [
    ...room.find(FIND_SOURCES),
    ...(room.controller ? [room.controller] : []),
  ];

  targets.forEach(target => {
    const path = planRoute(spawn.pos, target.pos);
    if (path.length) {
      routes[target.id] = toStoredList(path);
    }
  });

  const storedRoundabout = toStoredList(dedupePositions(roundabout));

  return {
    roundabout: storedRoundabout,
    routes,
    lastPlanned: Game.time,
  };
}

function syncRoads(plan: RoadPlan, room: Room) {
  let planDirty = false;
  let placed = 0;
  const positions: RoomPosition[] = [];
  plan.roundabout.forEach(pos => positions.push(storedToPos(pos)));
  Object.values(plan.routes).forEach(list => {
    list.forEach(pos => positions.push(storedToPos(pos)));
  });

  const unique = dedupePositions(positions);
  const remainingKeys = new Set<string>();

  for (const pos of unique) {
    if (placed >= SITES_PER_TICK) break;
    if (!isBuildable(pos)) continue;
    const look = pos.lookFor(LOOK_STRUCTURES);
    if (look.some(s => s.structureType === STRUCTURE_ROAD)) {
      continue;
    }
    const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
    if (sites.length) {
      remainingKeys.add(posKey(pos));
      continue;
    }
    const result = room.createConstructionSite(pos, STRUCTURE_ROAD);
    if (result === OK) placed++;
    else remainingKeys.add(posKey(pos));
  }

  // Prune plan entries that are already built or unplaceable
  const filteredRoundabout = plan.roundabout.filter(pos =>
    remainingKeys.has(posKey(storedToPos(pos)))
  );
  if (filteredRoundabout.length !== plan.roundabout.length) {
    planDirty = true;
    plan.roundabout = filteredRoundabout;
  }

  const filteredRoutes: Record<string, typeof plan.routes[string]> = {};
  Object.entries(plan.routes).forEach(([id, list]) => {
    const remaining = list.filter(pos => remainingKeys.has(posKey(storedToPos(pos))));
    if (remaining.length > 0) {
      filteredRoutes[id] = remaining;
    } else {
      planDirty = true;
    }
  });
  plan.routes = filteredRoutes;

  if (planDirty) {
    saveRoadPlan(room, plan);
  }
}

function isBuildable(pos: RoomPosition): boolean {
  const terrain = Game.map.getRoomTerrain(pos.roomName);
  if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) return false;
  return true;
}
