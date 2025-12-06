import roleManager from "role_manager";
import { monitorSpawn } from "core/spawn_control";
import { planStructures } from "spawn/structures";
import { updateTickRate } from "utils/tick_rate";
import { logRoomStats } from "utils/stats";
import { runTowers } from "tower/tower_control";
import { buildRoomSnapshot } from "planner/planner_snapshot";
import { DEFAULT_PHASES, selectPhase } from "planner/planner_phases";
import logger from "utils/logger";
import { isDefenseMode } from "defense/defense_manager";

const gameManager = {
  run() {
    // Cleanup missing creeps from memory before any counting/spawning
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
    }

    const spawn = Game.spawns["Spawn1"] ?? Object.values(Game.spawns)[0];
    if (spawn) {
      monitorSpawn(spawn);
      planStructures(spawn);
      runTowers(spawn.room);
      logStatsPeriodic(spawn.room);
      logPhaseOverview(spawn);
    }

    roleManager.run();
    updateTickRate();
  },
};

export default gameManager;

function logStatsPeriodic(room: Room) {
  const cooldown = 100;
  const last = Memory.debug?.lastStatsLog ?? 0;
  if (Game.time - last < cooldown) return;
  logRoomStats(room);
  if (Memory.debug) {
    Memory.debug.lastStatsLog = Game.time;
  }
}

function logPhaseOverview(spawn: StructureSpawn) {
  const cooldown = 200;
  const last = Memory.debug?.lastPhaseLog ?? 0;
  if (Game.time - last < cooldown) return;

  const snapshot = buildRoomSnapshot(spawn.room);
  const phase = selectPhase(DEFAULT_PHASES, snapshot);
  const roleSummary = Object.entries(snapshot.roleCounts)
    .map(([role, count]) => `${role}:${count}`)
    .join(", ");
  const defenseTag = isDefenseMode(spawn.room) ? "defence" : "normal";
  const targetsSummary = Object.entries(phase.structureTargets)
    .map(([type, count]) => `${type}:${count}`)
    .join(", ");

  logger.info(
    `[Phase] ${phase.name} (${defenseTag}) RCL${snapshot.controllerLevel} | energy ${spawn.room.energyAvailable}/${spawn.room.energyCapacityAvailable} | sites ${snapshot.sites.length} | targets ${targetsSummary} | roles ${roleSummary}`
  );

  if (Memory.debug) {
    Memory.debug.lastPhaseLog = Game.time;
  }
}
