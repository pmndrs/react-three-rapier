---
"@react-three/rapier": minor
---

Add a kinematic character controller built on Rapier's `KinematicCharacterController`.

- `useCharacterController(options)` creates and frees the controller (StrictMode safe), applies `offset`, `up`, `slide`, `maxSlopeClimbAngle`, `minSlopeSlideAngle`, `autostep`, `snapToGround`, `applyImpulsesToDynamicBodies`, `characterMass` and `normalNudgeFactor` reactively, and returns a stable `{ controller, move(rigidBody, desiredTranslation, opts) }` api. `move` computes the collision-resolved movement, calls `setNextKinematicTranslation` and returns a pooled `{ movement, grounded, collisions }`.
- `<CharacterController>` wraps a `kinematicPosition` `RigidBody`. Its ref exposes `{ controller, rigidBody, grounded, setVelocity(v), move(delta) }`; the desired motion is applied once per fixed physics step with the fixed `dt`, so it is framerate independent. It also accepts `onGrounded`, `onAirborne` (edge triggered) and `onCharacterCollision`.

Gravity and jumping are intentionally left to userland. See the `character-controller` demo.
