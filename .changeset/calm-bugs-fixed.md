---
"@react-three/rapier": patch
"@react-three/rapier-addons": patch
---

Bug fixes for 3.0:

- Forwarded refs on `RigidBody`, colliders and `InstancedRigidBodies` instances are now cleared when the underlying rapier object is destroyed, instead of pointing at freed objects (#780)
- Trimesh and convex hull colliders now read geometry positions correctly for interleaved, normalized and quantized attributes, and indices are converted to `Uint32Array`; failing to build a collider now throws a descriptive error (#781, #627)
- Heightfield collider args are scaled per axis and no longer mutated in place, which compounded scale on remount (#564)
- `mass`, `density` and `massProperties` collider props now update after mount (#711)
- Re-export `ActiveCollisionTypes`, `ActiveEvents`, `ActiveHooks` and `QueryFilterFlags` from the package index (#703)
- Add a regression test for changing the `RigidBody` `type` after mount (#314)
- `InstancedRigidBodies` no longer spreads `key` into JSX, which warned on React 19 (#691)
- `InstancedRigidBodies` disables frustum culling on its instanced mesh, since cached bounds go stale as bodies move (#683)
- Replace `three-stdlib` with `three/examples/jsm` imports and remove the dependency (#698)
- Document `HeightfieldArgs` (`heights` must have `(rows + 1) * (cols + 1)` values) and warn in development when the length mismatches (#730)
