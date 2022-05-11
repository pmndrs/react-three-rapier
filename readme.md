<h1 align="center">use-rapier 🗡</h1>

<p align="center">⚠️ Under heavy development. All APIs are subject to change. ⚠️</p>

## Alpha Usage

Hooks:

```tsx
import { Box } from "@react-three/drei";
import { useCuboid } from "use-rapier";

const RigidBox = () => {
  // Generates a RigidBody and attaches a BoxCollider to it, returns a ref
  const [box, rigidBody, collider] = useCuboid(
    { position: [1, 1, 1] },
    { args: [0.5, 0.5, 0.5] }
  );

  return <Box ref={box} />;
};
```

Or, using components:  
This is equivalent to the above 👆

```tsx
import { Box } from "@react-three/drei";

const Scene = () => {
  return (
    <RigidBody position={[1, 1, 1]}>
      <Box />
      <CuboidCollider args={[0.5, 0.5, 0.5]} />
    </RigidBody>
  );
};
```

Objects work inside other transformed objects as well. Simulation runs in world space and is transformed to the objects local space, so that things act as you'd expect.

```tsx
import { Box } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";

const Scene = () => {
  return (
    <group position={[2, 5, 0]} rotation={[0, 0.3, 2]}>
      <RigidBody>
        <Box />
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
      </RigidBody>
    </group>
  );
};
```

## Roadmap

In order, but also not necessarily:

- [x] Draft of all base shapes
- [x] Draft of all base joints
- [x] Nested objects retain world transforms
- [ ] Nested objects retain correct collider scale
- [ ] Translation and rotational constraints
- [ ] Collision events
- [ ] Docs
- [ ] CodeSandbox examples
- [ ] Helpers, for things like Vehicle, Rope, Player, etc
