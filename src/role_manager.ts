import { ROLE_BODIES, ROLE_PRIORITY } from "config";
import { ROLES, RoleId } from "roles/constants";
import { desiredRoleCountsForSpawn } from "spawn_policy";
import { roleRegistry } from "roles/registry";
import { RoleStrategy } from "roles/types";
import { runWithComponents } from "roles/components";
import logger from "utils/logger";

function ensureMinimumCreeps(
  spawn: StructureSpawn,
  roleCounts: Partial<Record<RoleId, number>>,
  desiredCounts: Partial<Record<RoleId, number>>
) {
  if (!spawn) return;

  const queueSpawn = (role: RoleId) => {
    const currentCount = roleCounts[role] ?? 0;
    const newName = `${role}${currentCount + 1}`;
    const body = ROLE_BODIES[role] ?? [WORK, CARRY, MOVE];
    spawn.spawnCreep(body, newName, {
      memory: {
        role,
        room: spawn.room.name,
      },
    });
    roleCounts[role] = currentCount + 1;
  };

  for (const role of ROLE_PRIORITY) {
    const desired = desiredCounts[role] ?? 0;
    const current = roleCounts[role] ?? 0;
    if (current < desired) {
      queueSpawn(role);
      return;
    }
  }
}

function runRole(creep: Creep) {
  const roleId = creep.memory.role as RoleId;
  const strategy = roleRegistry[roleId] as RoleStrategy | undefined;
  if (strategy) {
    runWithComponents(creep, strategy.act, strategy.components);
  } else {
    logger.warn(`No strategy for role ${roleId}`);
  }
}

const roleManager = {
  run() {
    const spawn = Game.spawns["Spawn1"] ?? Object.values(Game.spawns)[0];
    if (!spawn) return;

    const roleCounts = _.countBy(Game.creeps, creep => creep.memory.role as RoleId);
    const desiredCounts = desiredRoleCountsForSpawn(spawn);

    ensureMinimumCreeps(spawn, roleCounts, desiredCounts);
    _.forEach(Game.creeps, runRole);

    console.log("RoleManager.run() 🟢");
  },
};

export default roleManager;
