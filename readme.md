<h1 align="center">@react-three/rapier 🗡</h1>

<p align="center">⚠️ Under heavy development. All APIs are subject to change. ⚠️</p>

## Usage

```tsx
import { Box } from "@react-three/drei";

const Scene = () => {
  return (
    <RigidBody>
      <Box />
    </RigidBody>
  );
};
```

## Automatic colliders

RigidBodies generate automatic colliders by default for all meshes that it contains. You can control the default collider by setting the `colliders` prop on a `<RigidBody />`, or change it globally by setting `colliders` on `<Physics />`. Setting `colliders={false}` disables auto-generation.

Current supported auto collider shapes:

- cuboid
- ball
- trimesh
- hull

Generate ConvexHull colliders for all meshes in a RigidBody by default:

```tsx
const scene = (
  <Physics colliders="hull">
    <RigidBody>
      <Box />
    </RigidBody>
    <RigidBody position={[0, 10, 0]}>
      <Sphere />
    </RigidBody>
  </Physics>
);
```

Turn off automatic collider generation globally:

```tsx
const scene = (
  <Physics colliders={false}>
    <RigidBody colliders="cuboid">
      <Box />
    </RigidBody>

    <RigidBody position={[0, 10, 0]} colliders="ball">
      <Sphere />
    </RigidBody>

    <RigidBody position={[0, 10, 0]}>
      <Sphere />
      <BallCollider args={0.5} />
      <BallCollider args={0.5} position={[1, 0, 0]} />
    </RigidBody>
  </Physics>
);
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

## Debug

Use the Debug component to see live representations of all colliders in a scene.

> Note: Experimental. Not all shapes are supported.

```tsx
import { Box, Sphere } from "@react-three/drei";
import { RigidBody, Debug } from "@react-three/rapier";

const Scene = () => {
  return (
    <Physics>
      <Debug />

      <RigidBody>
        <Box />
      </RigidBody>
      <RigidBody>
        <Sphere />
      </RigidBody>
    </Physics>
  );
};
```

## Hooks

You can also use hooks to generate rigid bodies and colliders, but it's not encouraged.

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

## Roadmap?

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
