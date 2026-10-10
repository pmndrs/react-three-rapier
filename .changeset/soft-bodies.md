---
"@react-three/rapier": minor
---

Add soft bodies: `<SoftBody>` and `useSoftBody`, built on Rapier 0.21's deformable bodies.

Build cloth, rope and volumetric (jelly) bodies from the geometry of a `<mesh>` or `<line>`. Vertices are welded on position only, and the simulated positions are written into the geometry in the parent's local space after every physics step, with normals and bounds recomputed. Supports pinned particles, attachments to rigid bodies, stiffness/damping/mass, collisions with rigid bodies, and an `onTear` event.

```tsx
import { SoftBody } from "@react-three/rapier/soft-bodies";

<SoftBody type="cloth" pinned={(p) => p.y > 0.49} stiffness={12}>
  <mesh position={[0, 3, 0]}>
    <planeGeometry args={[1, 1, 20, 20]} />
  </mesh>
</SoftBody>;
```

The API lives in the `@react-three/rapier/soft-bodies` entry point. `RapierContext` gains an internal `softBodyTearCallbacks` set, and `<Physics>` drains Rapier's soft body tear events into it after each step.
