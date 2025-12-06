export type TargetLike = RoomPosition | { pos: RoomPosition };

export interface RoleContext {
  creep: Creep;
  target?: TargetLike;
}

export type RoleComponent = (context: RoleContext) => void;

export function composeComponents(...components: RoleComponent[]): RoleComponent {
  return context => components.forEach(component => component(context));
}

export function runWithComponents(
  creep: Creep,
  act: (context: RoleContext) => void,
  components: RoleComponent[] = []
) {
  const context: RoleContext = { creep };
  act(context);
  components.forEach(component => component(context));
  if (Memory.debug?.showNameTags) {
    creep.room.visual.text(creep.name, creep.pos.x, creep.pos.y + 1, {
      color: "white",
      font: 0.4,
      opacity: 0.8,
    });
  }
}

export const drawPathToTarget: RoleComponent = ({ creep, target }) => {
  if (!Memory.debug?.drawPaths) return;
  if (!target) return;
  const targetPos = target instanceof RoomPosition ? target : target.pos;
  creep.room.visual.line(creep.pos, targetPos, { color: "yellow", opacity: 0.3 });
};

export const refuelTowers: RoleComponent = context => {
  const { creep } = context;
  if (!shouldDeliver(creep) || creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.refueling = false;
    creep.memory.refuelTargetId = undefined;
    return;
  }

  if (creep.memory.refueling && creep.memory.refuelTargetId) {
    const target = Game.getObjectById(creep.memory.refuelTargetId);
    if (target && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    transferEnergy(context, target);
    return;
  }
  // Target filled or missing
  creep.memory.refueling = false;
  creep.memory.refuelTargetId = undefined;
  }

  // Assign a new refuel target if cooldown expired
  if (creep.memory.refuelCooldown && creep.memory.refuelCooldown > Game.time) return;
  const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_TOWER &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  }) as StructureTower | null;

  if (target) {
    creep.memory.refueling = true;
    creep.memory.refuelTargetId = target.id;
    creep.memory.refuelCooldown = Game.time + 50; // don't retarget too often
    transferEnergy(context, target);
  }
};

export const refuelTowersPeriodic = (interval: number): RoleComponent => {
  return context => {
    if (Game.time % interval !== 0) return;
    refuelTowers(context);
  };
};

export const deliverToSpawnAndExtensions: RoleComponent = context => {
  const { creep } = context;
  if (!shouldDeliver(creep) || creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) return;

  const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_EXTENSION) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  }) as StructureSpawn | StructureExtension | null;

  if (!target) return;

  transferEnergy(context, target);
};

function transferEnergy(
  context: RoleContext,
  target: StructureSpawn | StructureExtension | StructureTower
) {
  context.target = target;
  const result = context.creep.transfer(target, RESOURCE_ENERGY);
  if (result === ERR_NOT_IN_RANGE) {
    context.creep.moveTo(target);
  }
}

function shouldDeliver(creep: Creep): boolean {
  return creep.memory.state === "deliver";
}

// Fallback: if a role did not pick a target, try to build first, then upgrade.
export const fallbackBuildOrUpgrade: RoleComponent = context => {
  const { creep, target } = context;
  if (target) return; // primary action already chosen
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) return;

  const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  if (site) {
    context.target = site;
    const buildResult = creep.build(site);
    if (buildResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(site);
    }
    return;
  }

  const controller = creep.room.controller;
  if (controller) {
    context.target = controller;
    const upgradeResult = creep.upgradeController(controller);
    if (upgradeResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    }
  }
};
