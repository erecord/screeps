import { planInitialStructures } from "policy/build_planner";
import logger from "utils/logger";
import { planRoads } from "roads/road_planner";
import { buildRoomSnapshot } from "planner/planner_snapshot";
import { DEFAULT_PHASES, selectPhase } from "planner/planner_phases";
import { placePhaseStructures } from "planner/planner_placement";

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

  const snapshot = buildRoomSnapshot(spawn.room);
  const phase = selectPhase(DEFAULT_PHASES, snapshot);
  // Use phase structure targets with validator chain; roads already prioritised separately.
  placePhaseStructures(spawn, snapshot, phase);
}
