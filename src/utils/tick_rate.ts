/**
 * Track ticks per second by comparing Game.time to real time.
 * Stores the latest estimate in Memory.debug.tickRate and returns it.
 */
const DEFAULT_TPS = 1.0;
const SMOOTHING = 0.3;

interface TickRateMemory {
  lastGameTime: number;
  lastRealTime: number;
  ticksPerSecond: number;
}

function initTickRate(): TickRateMemory {
  return {
    lastGameTime: Game.time,
    lastRealTime: Date.now(),
    ticksPerSecond: Memory.debug?.ticksPerSecond ?? DEFAULT_TPS,
  };
}

export function updateTickRate(): number {
  if (!Memory.debug) return DEFAULT_TPS;
  if (!Memory.debug.tickRate) {
    Memory.debug.tickRate = initTickRate();
  }

  const tickRate = Memory.debug.tickRate as TickRateMemory;
  const now = Date.now();
  const gameNow = Game.time;
  const deltaTicks = gameNow - tickRate.lastGameTime;
  const deltaSeconds = (now - tickRate.lastRealTime) / 1000;

  if (deltaTicks > 0 && deltaSeconds > 0) {
    const estimate = deltaTicks / deltaSeconds;
    tickRate.ticksPerSecond = tickRate.ticksPerSecond * (1 - SMOOTHING) + estimate * SMOOTHING;
    Memory.debug.ticksPerSecond = tickRate.ticksPerSecond;
  }

  tickRate.lastGameTime = gameNow;
  tickRate.lastRealTime = now;
  Memory.debug.tickRate = tickRate;
  return tickRate.ticksPerSecond;
}
