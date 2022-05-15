<h1 align="center">@react-three/rapier 🗡</h1>

<p align="center">⚠️ Under heavy development. All APIs are subject to change. ⚠️</p>

## Usage

Hooks:

```tsx
import { Box } from "@react-three/drei";
import { useCuboid } from "@react-three/rapier";

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
    </RigidBody>
  );
};
```

## Automatic colliders

RigidBodies generate automatic colliders by default for all meshes that it contains. You can control the default collider by setting the `colliders` prop on a `<RigidBody />`, or change it globally by setting `colliders` on `<Physics />`. Setting `colliders={false}` disables auto-generation.

Generate ConvexHull colliders for all meshes in a RigidBody by default:

```tsx
<Physics colliders={RapierAutoColliderShape.ConvexHull}>
  <RigidBody>
    <Box />
  </RigidBody>
  <RigidBody position={[0, 10, 0]}>
    <Sphere />
  </RigidBody>
</Physics>
```

Turn off automatic collider generation globally:

```tsx
<Physics colliders={false}>
  <RigidBody colliders={RapierAutoColliderShape.Cuboid}>
    <Box />
  </RigidBody>
  <RigidBody position={[0, 10, 0]} colliders={RapierAutoColliderShape.Ball}>
    <Sphere />
  </RigidBody>
  // Use defined colliders
  <RigidBody position={[0, 10, 0]}>
    <Sphere />
    <BallCollider args={0.5} />
    <BallCollider args={0.5} position={[1, 0, 0]} />
  </RigidBody>
</Physics>
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
- [x] Nested objects retain correct collider scale
- [x] Automatic colliders based on rigidbody children
- [ ] Translation and rotational constraints
- [ ] Collision events
- [ ] InstancedMesh support
- [ ] Docs
- [ ] CodeSandbox examples
- [ ] Helpers, for things like Vehicle, Rope, Player, etc
