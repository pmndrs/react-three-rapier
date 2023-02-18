---
"@react-three/rapier": major
---

Performance improvement:

Memoise the instances of <InstancedRigidBodies>, so that only the affected instances trigger a render.

Required to forward a `Map` instead of an `Array` for `<InstancedRigidBodies>`.