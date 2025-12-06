/**
 * Track ticks per second by comparing Game.time to real time.
 * Stores the latest estimate in Memory.debug.ticksPerSecond and tickRate.
 */
const DEFAULT_TPS = 1.0;

export function updateTickRate(): number {
  if (!Memory.debug) return DEFAULT_TPS;

  if (!Memory.debug.tickRate) {
    Memory.debug.tickRate = {
      lastGameTime: Game.time,
      lastRealTime: Date.now(),
      ticksPerSecond: Memory.debug.ticksPerSecond ?? DEFAULT_TPS,
    };
  }

  const tickRate = Memory.debug.tickRate as {
    lastGameTime: number;
    lastRealTime: number;
    ticksPerSecond: number;
  };

  const now = Date.now();
  const gameNow = Game.time;
  const deltaTicks = gameNow - tickRate.lastGameTime;
  const deltaSeconds = (now - tickRate.lastRealTime) / 1000;

  if (deltaTicks > 0 && deltaSeconds > 0) {
    const estimate = deltaTicks / deltaSeconds;
    const alpha = 0.3; // smoothing factor
    tickRate.ticksPerSecond = tickRate.ticksPerSecond * (1 - alpha) + estimate * alpha;
    Memory.debug.ticksPerSecond = tickRate.ticksPerSecond;
  }

  tickRate.lastGameTime = gameNow;
  tickRate.lastRealTime = now;
  Memory.debug.tickRate = tickRate;
  return tickRate.ticksPerSecond;
}
