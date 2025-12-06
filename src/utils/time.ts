const TICKS_PER_SECOND = 2.8; // approximate on shard; adjust if you have exact tick length

export function formatTickAgo(targetTick: number, now: number = Game.time): string {
  const delta = now - targetTick;
  if (delta <= 0) return "just now";

  // Roughly translate ticks to seconds
  const seconds = delta / TICKS_PER_SECOND;
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;

  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;

  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;

  const days = hours / 24;
  return `${Math.floor(days)}d ago`;
}
