---
"@react-three/rapier": minor
---

feat: bump @dimforge/rapier3d-compat from v0.15.0 to v0.19.2 (@driescroons)

See the rapier.js changelog for details: https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md

Notable upstream rapier.js fixes:
- Fixed kinematic bodies not waking up when setting velocity
- Fixed slow-moving kinematic bodies falling asleep
- Fixed point-projection on voxel shapes

**Breaking Changes:**
- Removed `numAdditionalFrictionIterations` from IntegrationParameters (legacy PGS solver method)
- Removed legacy PGS solver methods: `switchToStandardPgsSolver`, `switchToSmallStepsPgsSolver`, `switchToSmallStepsPgsSolverWithoutWarmstart`
- Renamed `RigidBody.invPrincipalInertiaSqrt` and `.effectiveWorldInvInertiaSqrt` methods to remove the `Sqrt` suffix
