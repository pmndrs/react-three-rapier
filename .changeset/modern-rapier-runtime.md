---
"@react-three/rapier": minor
---

Upgrade `@dimforge/rapier3d-compat` from 0.19.2 to 0.21.0 and update the development and CI runtime to Node.js 24.

### Migration notes

- `minIslandSize` is deprecated and ignored because Rapier removed this setting.
- Fast dynamic bodies now use CCD against fixed colliders automatically. The `ccd` prop enables additional sweeps against kinematic and dynamic bodies; `ccd={false}` no longer disables all CCD. Use `<Physics maxCcdSubsteps={0}>` to disable CCD entirely.
- `additionalSolverIterations` now adds whole solver substeps for the constraint-connected bodies, rather than only extra iterations.
- Sleeping, restitution, contact forces, and velocity limits changed upstream. Existing scenes may need retuning, and numerical trajectories can differ.
- `<Physics>` retains its existing `allowedLinearError={0.001}` and `predictionDistance={0.002}` defaults. Rapier's new native defaults are `0.005` and `0.02`, respectively; set these props explicitly to adopt them.
- Collision-event manifolds expose `friction()` and `restitution()` instead of `solverContactFriction(index)` and `solverContactRestitution(index)`. `solverContactPoint(index)` now returns the world-space midpoint of the two per-body surface points. Read manifold data inside the event callback, since manifolds are temporary.
- Use the public `@dimforge/rapier3d-compat` entry point for imports. Package files moved into `dist/`, so old deep imports and pinned CDN file URLs must be updated.
- Code accessing Rapier's low-level pipelines or sets through `useRapier()` must account for the new `SoftBodySet` arguments. `NarrowPhase.contactPair` also requires the rigid-body set. The wrapper uses the unchanged `World` convenience methods.
- Snapshots from older Rapier versions cannot be restored with Rapier 0.21.0. Recreate saved snapshots after upgrading and store the Rapier version alongside persisted snapshot data.
- Soft bodies and per-axis spherical-joint motors are available through Rapier's API, but this upgrade does not add React soft-body components or automatic deformable-mesh synchronization.

See the [TypeScript binding changelog](https://github.com/dimforge/rapier/blob/master/bindings/typescript/CHANGELOG.md) and [engine changelog](https://github.com/dimforge/rapier/blob/master/CHANGELOG.md) for details.
