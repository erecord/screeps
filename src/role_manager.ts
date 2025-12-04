import roleHarvester from "roles/harvester";
import roleUpgrader from "roles/upgrader";
import roleBuilder from "roles/builder";
import { ROLES, RoleId } from "roles/constants";
import { desiredRoleCountsForSpawn } from "spawn_policy";
console.log("test.ts imported");

const roleStrategies: Partial<Record<RoleId, { run(creep: Creep): void }>> = {
  [ROLES.HARVESTER]: roleHarvester,
  [ROLES.UPGRADER]: roleUpgrader,
  [ROLES.BUILDER]: roleBuilder,
};

function ensureMinimumCreeps(
  spawn: StructureSpawn,
  roleCounts: Partial<Record<RoleId, number>>,
  desiredCounts: Partial<Record<RoleId, number>>
) {
  if (!spawn) return;

  const queueSpawn = (body: BodyPartConstant[], role: RoleId, working: boolean) => {
    const currentCount = roleCounts[role] ?? 0;
    const newName = `${role}${currentCount + 1}`;
    spawn.spawnCreep(body, newName, {
      memory: {
        role,
        room: spawn.room.name,
        working,
      },
    });
    roleCounts[role] = currentCount + 1;
  };

  const rolesInPriority: RoleId[] = [ROLES.HARVESTER, ROLES.UPGRADER, ROLES.BUILDER];

  for (const role of rolesInPriority) {
    const desired = desiredCounts[role] ?? 0;
    const current = roleCounts[role] ?? 0;
    if (current < desired) {
      queueSpawn([MOVE, WORK, CARRY], role, false);
      return;
    }
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
    const spawn = Game.spawns["Spawn1"] ?? Object.values(Game.spawns)[0];
    if (!spawn) return;

    const roleCounts = _.countBy(Game.creeps, creep => creep.memory.role as RoleId);
    const desiredCounts = desiredRoleCountsForSpawn(spawn);

    ensureMinimumCreeps(spawn, roleCounts, desiredCounts);
    _.forEach(Game.creeps, runRole);

    console.log("RoleManager.run() 🟢")
  },
};

export default roleManager;
