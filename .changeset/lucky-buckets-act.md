---
"@react-three/rapier": minor
---

feat: bump @dimforge/rapier3d-compat from v0.15.0 to v0.19.2 (@driescroons)

See the rapier.js changelog for details: https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md

**Notable Improvements:**
- **Performance:** Significant improvements for scenes with many contact constraints, CCD-enabled bodies, and large voxel maps
- **Voxel Support:** Sparse storage for voxels allows orders of magnitudes larger maps without hitting 4GB WASM memory limit
- **New Features:** Added `World.timing*` functions for performance profiling when `World.profilerEnabled = true`
- **New Features:** Added `World.maxCcdSubsteps` getter/setter for CCD substep configuration
- **New Features:** Added `Collider.translationWrtParent()` and `Collider.rotationWrtParent()` for collider transforms relative to parent rigid-body
- **Memory Management:** Added `RAPIER.reserveMemory` to pre-allocate memory for future operations

**Bug Fixes:**
- Fixed kinematic bodies not waking up when setting velocity
- Fixed slow-moving kinematic bodies falling asleep
- Fixed point-projection on voxel shapes
- Fixed crash when removing colliders in specific order
- Fixed sensor events not triggering when hitting voxel colliders
- Fixed infinite loop in `collider.setVoxel`
- Fixed rollup configuration for proper TypeScript types export
- Fixed determinism issue on Apple M1 processors

**Breaking Changes:**
- Removed `numAdditionalFrictionIterations` from IntegrationParameters (legacy PGS solver method)
- Removed legacy PGS solver methods: `switchToStandardPgsSolver`, `switchToSmallStepsPgsSolver`, `switchToSmallStepsPgsSolverWithoutWarmstart`
- Renamed `RigidBody.invPrincipalInertiaSqrt` and `.effectiveWorldInvInertiaSqrt` to `invPrincipalInertia` and `effectiveWorldInvInertia` (removed `Sqrt` suffix - now returns actual inverse angular inertia matrix instead of square root)
- rapier-compat file extensions changed from `.cjs.js`/`.es.js` to `.cjs`/`.mjs` for better NPM compatibility
