---
"@react-three/rapier": major
---

Step physics on the react-three-fiber v10 scheduler.

- With `updateLoop="follow"` (default) and a numeric `timeStep`, each world steps in its own fixed-timestep scheduler phase (`rapier:fixed:<n>`), which runs after r3f's `physics` phase. Changing `timeStep` or `maxSubSteps` retimes that phase in place, and phases are reused when worlds remount. Rendered transforms are synced once per frame in a new `rapier` phase, before `update`, and interpolated by the phase's overstep. A `rapier:late` pass right before `render` re-applies them if an ancestor moved during `update`. The shared `physics` phase timestep is never changed, and multiple `<Physics>` worlds with different `timeStep`s work side by side. Without scheduler fixed-phase support (`@pmndrs/scheduler` < 0.3), the same behaviour runs on an internal accumulator.
- New `maxSubSteps` prop (default `5`) caps the fixed steps a single frame may run. Surplus time is dropped instead of queued, so slow frames can no longer spiral (#697).
- **Breaking:** `updatePriority` now only orders this world's jobs within their scheduler phase (higher runs first, the r3f v10 convention). It no longer takes over r3f's render loop. Physics always steps before `update`, and r3f keeps rendering.
- `paused` banks no time, so resuming does not burst. `step()` from `useRapier()` works while paused and syncs meshes immediately.
- `useBeforePhysicsStep` and `useAfterPhysicsStep` callbacks receive `(world, dt)`, where `dt` is the step length. Existing single-argument callbacks keep working.
- Collision, contact-force and soft-body tear events are drained after every substep instead of once per frame.
- Bodies are synced parent-first into their parent's current space every frame, so moving, rotating or re-parenting an ancestor of a `<RigidBody>` after mount keeps its visual on the simulated body (#36), and nested bodies no longer lag the body that carries them.
- Interpolation no longer lerps across teleports made in `useBeforePhysicsStep`, manual `step()` calls, `setWorld()`, or `paused`/`interpolate` changes.
- `<Debug>` reuses one geometry and disposes it on unmount, instead of allocating one per frame and leaking on toggle (#666).
- With `frameloop="demand"`, the canvas is invalidated once per frame while any non-fixed body is awake.
- The world is freed after the unmount commit, so child cleanups run against a live world and StrictMode remounts are safe.
