import { planInitialStructures } from "policy/build_planner";
import logger from "utils/logger";
import { planRoads } from "roads/planner";

export function planStructures(spawn: StructureSpawn) {
  // Place planned structures (currently extensions) while leaving the spawn loop clean.
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

  planRoads(spawn.room);
}
