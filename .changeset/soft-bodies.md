---
"@react-three/rapier": minor
---

Add soft bodies: `<SoftBody>` and `useSoftBody`, built on Rapier 0.21's deformable bodies.

Build cloth, rope and volumetric (jelly) bodies from the geometry of a `<mesh>` or `<line>`. Vertices are welded on position only, and the simulated positions are written into the geometry in the parent's local space once per rendered frame, interpolated with the same alpha as the rigid bodies (so cloth attached to an interpolated body stays on it), with normals and bounds recomputed. Tears are handled after every physics substep. Supports pinned particles, attachments to rigid bodies, stiffness/damping/mass, collisions with rigid bodies, and an `onTear` event.

```tsx
import { SoftBody } from "@react-three/rapier/soft-bodies";

<SoftBody type="cloth" pinned={(p) => p.y > 0.49} stiffness={12}>
  <mesh position={[0, 3, 0]}>
    <planeGeometry args={[1, 1, 20, 20]} />
  </mesh>
</SoftBody>;
```

The API lives in the `@react-three/rapier/soft-bodies` entry point (a separate bundle that imports core from `@react-three/rapier`). `RapierContext` gains two internal sets: `softBodyTearCallbacks`, which `<Physics>` fills from Rapier's soft body tear events after each step, and `frameSyncCallbacks`, which `<Physics>` calls once per frame with the interpolation alpha after writing the rigid bodies.
