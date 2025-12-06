import roleManager from "role_manager";
import { monitorSpawn } from "core/spawn_control";
import { planStructures } from "spawn/structures";
import { updateTickRate } from "utils/tick_rate";
import { logRoomStats } from "utils/stats";
import { runTowers } from "tower/tower_control";

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
