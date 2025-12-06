import { ROLE_PRIORITY } from "core/config";
import { ROLES, RoleId } from "roles/constants";
import { desiredRolesWithContext } from "policy/spawn_policy";
import { trySpawnCreep } from "spawn/boot";
import { roleRegistry } from "roles/role_registry";
import { RoleStrategy } from "roles/types";
import { runWithComponents } from "roles/components";
import logger from "utils/logger";

function computeRoleCounts(spawn: StructureSpawn): Partial<Record<RoleId, number>> {
  const counts = _.countBy(Game.creeps, creep => creep.memory.role as RoleId);
  const spawning = spawn.spawning;
  if (spawning) {
    const pendingRole = Memory.creeps[spawning.name]?.role as RoleId | undefined;
    if (pendingRole) counts[pendingRole] = (counts[pendingRole] ?? 0) + 1;
  }
  return counts;
}

function ensureMinimumCreeps(
  spawn: StructureSpawn,
  roleCounts: Partial<Record<RoleId, number>>,
  desiredCounts: Partial<Record<RoleId, number>>
) {
  if (!spawn || spawn.spawning) return;
  const totalCreeps = Object.keys(Game.creeps).length;
  if (!Memory.spawns) Memory.spawns = {};
  if (!Memory.spawns[spawn.name]) Memory.spawns[spawn.name] = {};
  const spawnMem = Memory.spawns[spawn.name] as any;

  for (const role of ROLE_PRIORITY) {
    const desired = desiredCounts[role] ?? 0;
    const current = roleCounts[role] ?? 0;
    if (current < desired) {
      const spawned = trySpawnCreep(spawn, role, totalCreeps, spawnMem);
      if (spawned) return;
      // If spawn failed (energy/busy), stop trying further roles this tick
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

    const roleCounts = computeRoleCounts(spawn);
    const desiredCounts = desiredRolesWithContext(spawn);

    ensureMinimumCreeps(spawn, roleCounts, desiredCounts);
    _.forEach(Game.creeps, runRole);

    // console.log("RoleManager.run() 🟢");
  },
};

export default roleManager;
