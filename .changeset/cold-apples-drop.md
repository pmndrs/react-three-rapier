---
"@react-three/rapier": minor
---

feat: update @dimforge/rapier3d-compat to 0.12.0 (@0xtito, @isaac-mason)

- Change Physics component props to match the new rapier version's integration parameter changes.
  - There aren't direct alternatives for all old parameters. See the Physics component docs for more information on the new parameters: https://pmndrs.github.io/react-three-rapier/interfaces/PhysicsProps.html
- Add `additionalSolverIterations` prop to `RigidBodyOptions`.
  - See: https://pmndrs.github.io/react-three-rapier/interfaces/RigidBodyOptions.html#additionalSolverIterations
- Add `useSpringJoint`
- Add `useRopeJoint`