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

const RigidBox = () => {
  return (
    <RigidBody position={[1, 1, 1]}>
      <Box />
      <CuboidCollider args={[0.5, 0.5, 0.5]} />
    </RigidBody>
  );
};
```

## Roadmap

In order, but also not necessarily:

- [x] Draft of all base shapes
- [x] Draft of all base joints
- [ ] Translation and rotational constraints
- [ ] Collision events -- Rapier Event Queue
- [ ] Switch to using Vite for development?
- [ ] Docs
- [ ] CodeSandbox examples
- [ ] Helpers, for things like Vehicle, Rope, Player, etc
