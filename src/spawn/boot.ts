import { ROLES, RoleId } from "roles/constants";
import { bodyCost, bodyPlanForRole, EMERGENCY_BODY } from "policy/body_policy";
import logger from "utils/logger";
import { formatTickAgo } from "utils/time";

function nextRoleId(role: RoleId): string {
  const regex = new RegExp(`^${role}(\\d+)$`);
  let maxSuffix = 0;

  const consider = (name: string) => {
    const match = regex.exec(name);
    if (!match) return;
    const num = parseInt(match[1], 10);
    if (!Number.isNaN(num)) {
      maxSuffix = Math.max(maxSuffix, num);
    }
  };

  Object.keys(Game.creeps).forEach(consider);
  Object.keys(Memory.creeps).forEach(consider);

  return `${role}${maxSuffix + 1}`;
}

function clearWaiting(spawnMem: any) {
  spawnMem.waitingSince = undefined;
  spawnMem.waitingForBody = undefined;
  spawnMem.waitingPeakEnergy = undefined;
  if (spawnMem.waitLog) {
    spawnMem.waitLog = {};
  }
}

function spawnEmergency(
  spawn: StructureSpawn,
  role: RoleId,
  spawnMem: any,
  totalCreeps: number,
  energyAvailable: number
): boolean {
  if (totalCreeps > 0) return false;
  const emergencyCost = bodyCost(EMERGENCY_BODY);
  if (energyAvailable < emergencyCost) return false;
  const emergencyName = `${role}_emergency_${Game.time}`;
  const emergencyResult = spawn.spawnCreep(EMERGENCY_BODY, emergencyName, {
    memory: {
      role,
      room: spawn.room.name,
    },
  });
  if (emergencyResult === OK) {
    logger.warn(`Emergency spawn ${emergencyName} with minimal body`);
    clearWaiting(spawnMem);
    return true;
  }
  logger.warn(`Emergency spawn failed for ${emergencyName}: ${emergencyResult}`);
  return false;
}

function spawnWithTarget(
  spawn: StructureSpawn,
  role: RoleId,
  spawnMem: any,
  plan: ReturnType<typeof bodyPlanForRole>
): boolean {
  const newName = nextRoleId(role);
  const result = spawn.spawnCreep(plan.target, newName, {
    memory: {
      role,
      room: spawn.room.name,
    },
  });
  if (result === OK) {
    clearWaiting(spawnMem);
    return true;
  }
  logger.warn(`Spawn failed for ${newName}: ${result}`);
  return false;
}

function spawnFallback(
  spawn: StructureSpawn,
  role: RoleId,
  spawnMem: any,
  plan: ReturnType<typeof bodyPlanForRole>,
  waited: number
): boolean {
  const fallbackName = `${role}_fallback_${Game.time}`;
  const result = spawn.spawnCreep(plan.minimum, fallbackName, {
    memory: {
      role,
      room: spawn.room.name,
    },
  });
  if (result === OK) {
    logger.warn(
      `Fallback spawn ${fallbackName} with minimum body after waiting ${waited} ticks for target`
    );
    clearWaiting(spawnMem);
    return true;
  }
  logger.warn(`Fallback spawn failed for ${fallbackName}: ${result}`);
  return false;
}

export function trySpawnCreep(
  spawn: StructureSpawn,
  role: RoleId,
  totalCreeps: number,
  spawnMem: any
): boolean {
  const plan = bodyPlanForRole(spawn, role);
  const targetCost = bodyCost(plan.target);
  const minCost = bodyCost(plan.minimum);
  const energyAvailable = spawn.room.energyAvailable;

  if (spawnEmergency(spawn, role, spawnMem, totalCreeps, energyAvailable)) {
    return true;
  }

  if (energyAvailable >= targetCost) {
    return spawnWithTarget(spawn, role, spawnMem, plan);
  }

  // If we can't afford target but can afford minimum, allow fallback after waiting some ticks.
  spawnMem.waitingSince = spawnMem.waitingSince ?? Game.time;
  spawnMem.waitingForBody = plan.target;
  const waited = Game.time - (spawnMem.waitingSince as number);
  const ratio = targetCost / Math.max(minCost, 1);
  // Be more lenient before falling back to a smaller body so we don't downgrade too eagerly.
  const fallbackWait = Math.min(300, Math.max(80, Math.floor(ratio * 40)));
  const WAIT_LOG_COOLDOWN = 5;

  // Track the peak energy seen during this wait; only fallback if we never get close to target.
  spawnMem.waitingPeakEnergy = Math.max(spawnMem.waitingPeakEnergy ?? 0, energyAvailable);
  const nearTarget = spawnMem.waitingPeakEnergy >= targetCost * 0.8;

  if (energyAvailable >= minCost && waited >= fallbackWait && !nearTarget) {
    return spawnFallback(spawn, role, spawnMem, plan, waited);
  }

  spawnMem.waitLog = spawnMem.waitLog ?? {};
  const lastLog = spawnMem.waitLog[role] ?? 0;
  if (Game.time - lastLog >= WAIT_LOG_COOLDOWN) {
    logger.info(
      `Waiting to accumulate energy for ${role}; target ${targetCost}, have ${energyAvailable}, waited ${waited} ticks (~${formatTickAgo(
        Game.time - waited
      )})`
    );
    spawnMem.waitLog[role] = Game.time;
  }
  return false;
}
