import roleHarvester from "roles/harvester";
import roleUpgrader from "roles/upgrader";
import { ROLES, RoleId } from "roles/constants";
console.log("test.ts imported");

const roleStrategies: Partial<Record<RoleId, { run(creep: Creep): void }>> = {
  [ROLES.HARVESTER]: roleHarvester,
  [ROLES.UPGRADER]: roleUpgrader,
};

function ensureMinimumCreeps(roleCounts: Partial<Record<RoleId, number>>) {
  const spawn = Game.spawns["Spawn1"];
  if (!spawn) return;

  const queueSpawn = (body: BodyPartConstant[], namePrefix: string, role: RoleId, working: boolean) => {
    const currentCount = roleCounts[role] ?? 0;
    const newName = `${namePrefix}${currentCount + 1}`;
    spawn.spawnCreep(body, newName, {
      memory: {
        role,
        room: spawn.room.name,
        working,
      },
    });
    roleCounts[role] = currentCount + 1;
  };

  if ((roleCounts[ROLES.HARVESTER] ?? 0) < 1) {
    queueSpawn([MOVE, WORK, CARRY], "Harvester", ROLES.HARVESTER, false);
    return;
  }

  if ((roleCounts[ROLES.UPGRADER] ?? 0) < 1) {
    queueSpawn([MOVE, WORK, CARRY], "Upgrader", ROLES.UPGRADER, false);
  }
}

function runRole(creep: Creep) {
  const roleId = creep.memory.role as RoleId;
  const roleHandler = roleStrategies[roleId];
  if (roleHandler) roleHandler.run(creep);
}

const roleManager = {
  run() {
    console.log("RoleManager.run() 🟡")
    const roleCounts = _.countBy(Game.creeps, creep => creep.memory.role as RoleId);

    ensureMinimumCreeps(roleCounts);
    _.forEach(Game.creeps, runRole);

    console.log("RoleManager.run() 🟢")
  },
};

export default roleManager;
