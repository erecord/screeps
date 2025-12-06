// Planner-wide constants and defaults.
// Max path length we allow when validating routes for planned structures (in steps).
export const MAX_ROUTE_LENGTH = 30;

// Limit how many construction sites we place per tick for phase-driven structures.
export const PHASE_SITES_PER_TICK = 3;
// Max site budget per tick even after scaling with controller level.
export const PHASE_SITES_PER_TICK_MAX = 8;
// How many times we tolerate a placement failure before pruning that planned slot.
export const PLAN_FAILURE_RETRIES = 2;
