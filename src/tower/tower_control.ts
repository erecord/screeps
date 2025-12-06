interface RepairThresholds {
  wallHits: number;
  rampartHits: number;
}

const DEFAULT_REPAIR_THRESHOLDS: RepairThresholds = {
  wallHits: 10000,
  rampartHits: 5000,
};

const MIN_ENERGY_TO_ACT = 200;

export function runTowers(room: Room) {
  // Gather all owned towers in the room; bail if none.
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_TOWER,
  }) as StructureTower[];

  if (!towers.length) return;

  const thresholds = DEFAULT_REPAIR_THRESHOLDS;

  // Hostile handling takes priority over repairs: all towers attack the first hostile.
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  if (hostiles.length) {
    towers.forEach(tower => tower.attack(hostiles[0]));
    return;
  }

  towers.forEach(tower => {
    // Skip repairs if the tower is too low on energy.
    if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < MIN_ENERGY_TO_ACT) return;

    const damaged = findRepairTarget(tower.room, thresholds);
    if (damaged) {
      tower.repair(damaged);
    }
  });
}

function findRepairTarget(room: Room, thresholds: RepairThresholds): Structure | null {
  const structures = room.find(FIND_STRUCTURES, {
    filter: s => {
      if (s.hits === undefined || s.hitsMax === undefined) return false;
      // Walls/ramparts get capped repairs to avoid over-spending energy.
      if (s.structureType === STRUCTURE_WALL) {
        return s.hits < thresholds.wallHits;
      }
      if (s.structureType === STRUCTURE_RAMPART) {
        return s.hits < thresholds.rampartHits;
      }
      // Other structures repaired when below 50%.
      return s.hits < s.hitsMax * 0.5;
    },
  });

  if (!structures.length) return null;

  return structures.sort((a, b) => (a.hits ?? 0) - (b.hits ?? 0))[0];
}
