import { drawPathToTarget, runWithComponents, RoleContext } from "roles/components";
import { RoleStrategy } from "roles/types";

const defenderAct = (context: RoleContext) => {
  const { creep } = context;

  const hostile = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
  if (hostile) {
    context.target = hostile;
    if (creep.attack(hostile) === ERR_NOT_IN_RANGE) {
      creep.moveTo(hostile, { reusePath: 3 });
    }
    return;
  }

  const flag = Game.flags["Defend"];
  if (flag) {
    creep.moveTo(flag.pos, { reusePath: 5 });
  } else {
    // idle near spawn
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
    if (spawn) creep.moveTo(spawn.pos, { range: 3 });
  }
};

const roleDefender: RoleStrategy = {
  act: defenderAct,
  components: [drawPathToTarget],
};

export default roleDefender;
