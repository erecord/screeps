# Room Orchestration Plan (Living Document)

What we’re building (British English)
- A central “room director” that reads a room snapshot, selects a phase (bootstrap → economy → defence → expansion), and applies a chain of validators to place structures safely.
- Phase configs are data-driven: structure targets, role targets, and validator chains are re-orderable.
- Placement uses a chain-of-responsibility (bounds/terrain, clearance around spawn/roads, conflict checks, path length caps) to avoid bad sites.
- Workforce targets per phase are derived from plan deltas (build/repair/upgrade/harvest/defend) with awareness of fallbacks.
- Body policy will evolve: TODO to support attack/armored variants (e.g., 50/50) swapping WORK for ATTACK/TOUGH for natural defensive cohorts.

Current state (scaffolded)
- Snapshot builder collects room info (spawns, sources, hostiles, energy, structures/sites, role counts).
- Phase config with defaults and a validator chain exists; phases now inform role targets (merged with spawn policy). Phase structure targets are now used for placement with the validator chain (extensions/towers first), while roads are prioritised separately.
- Road planner, spawn policy (construction/defense aware), tower control, and refuel/delivery components are active.
- Defense mode spawns defenders; tower control repairs/attacks; builders/harvesters/upgraders have clearer priorities.

How to extend
- Extend phase-driven placement to all structure types (storage, labs, factory, power/nuke) and keep Memory lean with pruning/completion tracking.
- Implement phase advancement criteria and role/structure priorities per phase.
- Add attack/armored body variant selection per a configurable ratio (see TODO in body_policy).
- Add structure validators for labs/links/layouts and future road/remote plans.

Recovery guidance for future agents
- Check `src/planner/phases.ts` for current phases and validator chains; adjust configs there.
- `src/planner/validators.ts` holds the chain-of-responsibility validators.
- `src/planner/snapshot.ts` builds the room snapshot; extend it if you need more signals.
- `src/policy/spawn_policy.ts` and `src/defense/defense_manager.ts` handle role targets; adjust for new phases/roles.
- `src/policy/body_policy.ts` contains the TODO for attack/armored variants.
- `src/tower/tower_control.ts`, `src/roads/`, `src/spawn/`, and `src/roles/` cover current automation.

Please keep this file updated as you add phases/features so the next agent can continue. 
