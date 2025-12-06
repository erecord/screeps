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
  let placed = 0;
  const positions: RoomPosition[] = [];
  plan.roundabout.forEach(pos => positions.push(storedToPos(pos)));
  Object.values(plan.routes).forEach(list => {
    list.forEach(pos => positions.push(storedToPos(pos)));
  });

  const unique = dedupePositions(positions);

  for (const pos of unique) {
    if (placed >= SITES_PER_TICK) break;
    if (!isBuildable(pos)) continue;
    const look = pos.lookFor(LOOK_STRUCTURES);
    if (look.some(s => s.structureType === STRUCTURE_ROAD)) continue;
    const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
    if (sites.length) continue;
    const result = room.createConstructionSite(pos, STRUCTURE_ROAD);
    if (result === OK) placed++;
  }
}

function isBuildable(pos: RoomPosition): boolean {
  const terrain = Game.map.getRoomTerrain(pos.roomName);
  if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) return false;
  return true;
}
