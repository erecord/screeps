import { ErrorMapper } from "utils/error_mapper";
import gameManager from "game_manager";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definition alone.
          You must also give them an implementation if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
    spawns: { [name: string]: SpawnMemory };
    defendMode?: boolean;
    roads?: Record<
      string,
      {
        roundabout: Array<{ x: number; y: number; roomName: string }>;
        routes: Record<string, Array<{ x: number; y: number; roomName: string }>>;
        lastPlanned: number;
      }
    >;
    structurePlans?: Record<
      string,
      {
        structures: Partial<
          Record<BuildableStructureConstant, Array<{ x: number; y: number; roomName: string }>>
        >;
      }
    >;
    structurePlanFailures?: Record<string, { failures: Record<string, number> }>;
    debug: {
      drawPaths: boolean;
      ticksPerSecond?: number;
      tickRate?: {
        lastGameTime: number;
        lastRealTime: number;
        ticksPerSecond: number;
      };
      showNameTags?: boolean;
      lastStatsLog?: number;
    };
  }

  interface CreepMemory {
    role: string;
    room: string;
    state?: "gather" | "deliver";
    refueling?: boolean;
    refuelTargetId?: Id<StructureTower>;
    refuelCooldown?: number;
    harvestTargetId?: Id<Source>;
    energyDeliveryThreshold?: number;
  }

}
// Syntax for adding properties to `global` (ex "global.log")
declare const global: {
  log: any;
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  if (!Memory.debug) {
    Memory.debug = {
      drawPaths: false,
    };
  }
  gameManager.run();
});
