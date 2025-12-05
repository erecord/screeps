import roleManager from "role_manager";
import { planInitialStructures } from "build_planner";

const gameManager = {
  run() {
    const spawn = Game.spawns["Spawn1"] ?? Object.values(Game.spawns)[0];
    if (spawn) {
      planInitialStructures(spawn);
    }

    roleManager.run();
  },
};

export default gameManager;
