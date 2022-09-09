---
"@react-three/rapier": patch
---

`api.setRotation()` and `api.setNextKinematicRotation()` now expects a Quaternion argument, to equal the return from `api.rotation()` and coincide with `rapier`s base api
