import roleManager from "role_manager";
import { monitorSpawn } from "core/spawn_control";
import { planStructures } from "spawn/structures";
import { updateTickRate } from "utils/tick_rate";

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
    }

    roleManager.run();
    updateTickRate();
  },
};

export default gameManager;
