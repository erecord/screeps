export type TargetLike = RoomPosition | { pos: RoomPosition };

export interface RoleContext {
  creep: Creep;
  target?: TargetLike;
}

export type RoleComponent = (context: RoleContext) => void;

export function runWithComponents(
  creep: Creep,
  act: (context: RoleContext) => void,
  components: RoleComponent[] = []
) {
  const context: RoleContext = { creep };
  act(context);
  components.forEach(component => component(context));
}

export const drawPathToTarget: RoleComponent = ({ creep, target }) => {
  if (!target) return;
  const targetPos = target instanceof RoomPosition ? target : target.pos;
  creep.room.visual.line(creep.pos, targetPos, { color: "yellow", opacity: 0.3 });
};

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
