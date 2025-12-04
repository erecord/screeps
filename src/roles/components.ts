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
