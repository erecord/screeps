import roleManager from "role_manager";
import { planInitialStructures } from "build_planner";
import logger from "utils/logger";

const gameManager = {
  run() {
    const spawn = Game.spawns["Spawn1"] ?? Object.values(Game.spawns)[0];
    if (spawn) {
      const intents = planInitialStructures(spawn);
      intents.forEach(intent => {
        const result = spawn.room.createConstructionSite(intent.pos, intent.structureType);
        if (result === OK) {
          spawn.room.visual.text("Extension planned", intent.pos.x, intent.pos.y, {
            color: "yellow",
            font: 0.5,
            opacity: 0.8,
          });
          logger.notify(
            `Planned ${intent.structureType} at ${spawn.room.name} (${intent.pos.x},${intent.pos.y})`
          );
        }
      });
    }

    roleManager.run();

    // Cleanup missing creeps from memory
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
    }
  },
};

export default gameManager;
