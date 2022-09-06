<p align="center">
  <img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/hero.svg" alt="@react-three/rapier" />
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@react-three/rapier?style=for-the-badge&colorA=0099DA&colorB=ffffff" />
  <img src="https://img.shields.io/discord/740090768164651008?style=for-the-badge&colorA=0099DA&colorB=ffffff&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/ZZjjNvJ" />
</p>

<p align="center">⚠️ Under heavy development. All APIs are subject to change. ⚠️</p>

## Usage

```tsx
import { Box, Torus } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";

const App = () => {
  return (
    <Canvas>
      <Suspense>
        <Physics>
          <RigidBody colliders={"hull"} restitution={2}>
            <Torus />
          </RigidBody>

          <RigidBody position={[0, -2, 0]} type="kinematicPosition">
            <Box args={[20, 0.5, 20]} />
          </RigidBody>
        </Physics>
      </Suspense>
    </Canvas>
  );
};
```

## Automatic colliders

RigidBodies generate automatic colliders by default for all meshes that it contains. You can control the default collider by setting the `colliders` prop on a `<RigidBody />`, or change it globally by setting `colliders` on `<Physics />`. Setting `colliders={false}` disables auto-generation.

Supported values:

- `"cuboid"`, creates a CuboidCollider based on the bounding box of the mesh
- `"ball"`, creates a SphereCollider based on the bounding sphere of the mesh
- `"trimesh"`, creates a TrimeshCollider based on the mesh's geometry -- note trimeshes are massless by default (https://rapier.rs/docs/user_guides/javascript/common_mistakes#rigid-body-isnt-affected-by-gravity)
- `"hull"`, creates a ConvexHullCollider based on the mesh's geometry
- `false`, disables auto-generation

Generate ConvexHull colliders for all meshes in a RigidBody by default:

```tsx
const Scene = () => (
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

Turn off automatic collider generation globally, but apply auto generation locally:

```tsx
const Scene = () => (
  <Physics colliders={false}>
    {/* Use an automatic CuboidCollider for all meshes inside this RigidBody */}
    <RigidBody colliders="cuboid">
      <Box />
    </RigidBody>

    {/* Use an automatic BallCollider for all meshes inside this RigidBody */}
    <RigidBody position={[0, 10, 0]} colliders="ball">
      <Sphere />
    </RigidBody>

    {/* Make a compound shape with two custom BallColliders */}
    <RigidBody position={[0, 10, 0]}>
      <Sphere />
      <BallCollider args={[0.5]} />
      <BallCollider args={[0.5]} position={[1, 0, 0]} />
    </RigidBody>

    {/* Make a compound shape with two custom BallColliders, an automatic BallCollider,
        Two automatic MeshColliders, based on two different shape strategies */}
    <RigidBody position={[0, 10, 0]} colliders='ball'>
      <MeshCollider type="trimesh">
        <mesh ... />
      </MeshCollider>

      <MeshCollider type="hull">
        <mesh ... />
      </MeshCollider>

      <Sphere />

      <BallCollider args={[0.5]} />
      <BallCollider args={[0.5]} position={[1, 0, 0]} />
    </RigidBody>
  </Physics>
);
```

Objects work inside other transformed objects as well. Simulation runs in world space and is transformed to the objects local space, so that things act as you'd expect.

```tsx
import { Box } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";

const Scene = () => (
  <group position={[2, 5, 0]} rotation={[0, 0.3, 2]}>
    <RigidBody>
      <Box />
      <CuboidCollider args={[0.5, 0.5, 0.5]} />
    </RigidBody>
  </group>
);
```

## Instanced Meshes

Instanced meshes can also be used and have automatic colliders generated from their mesh.

By wrapping the `InstancedMesh` in `<InstancedRigidBodies />`, each instance will be attached to an individual `RigidBody`.

> Note: Custom colliders (compound shapes) for InstancedMesh is currently not supported

```tsx
import { InstancedRigidBodies } from "@react-three/rapier";

const COUNT = 1000;

const Scene = () => {
  const instancedApi = useRef<InstancedRigidBodyApi>(null);

  useEffect(() => {
    // You can access individual instanced by their index
    instancedApi.at(40).applyImpulse({ x: 0, y: 10, z: 0 });

    // Or update all instances as if they were in an array
    instancedApi.forEach((api) => {
      api.applyImpulse({ x: 0, y: 10, z: 0 });
    });
  }, []);

  // We can set the initial positions, and rotations, and scales, of
  // the instances by providing an array equal to the instance count
  const positions = Array.from({ length: COUNT }, (_, index) => [index, 0, 0]);

  const rotations = Array.from({ length: COUNT }, (_, index) => [
    Math.random(),
    Math.random(),
    Math.random(),
  ]);

  const scales = Array.from({ length: COUNT }, (_, index) => [
    Math.random(),
    Math.random(),
    Math.random(),
  ]);

  return (
    <InstancedRigidBodies
      ref={instancedApi}
      positions={positions}
      rotations={rotations}
      scales={scales}
      colliders="ball"
    >
      <instancedMesh args={[undefined, undefined, COUNT]}>
        <sphereBufferGeometry args={[0.2]} />
        <meshPhysicalGeometry color="blue" />

        <CuboidCollider args={[0.1, 0.2, 0.1]} />
      </instancedMesh>
    </InstancedRigidBodies>
  );
};
```

## Debug

Use the Debug component to see live representations of all colliders in a scene.

- The `color` prop sets the color of awake colliders that are affected by forces.
- The `sleepColor` prop set the color of a static (fixed, or kinematic) or sleeping collider.

> Note: Experimental. Not all shapes are supported. Unsupported shapes are always represented by cubes.

```tsx
import { Box, Sphere } from "@react-three/drei";
import { RigidBody, Debug } from "@react-three/rapier";

const Scene = () => {
  return (
    <Physics>
      <Debug color="red" sleepColor="blue" />

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

## Events

You can subscribe collision and state events on the RigidBody.

```tsx
const RigidBottle = () => {
  const [isAsleep, setIsAsleep] = useState(false);

return (
    <RigidBody
      colliders="hull"
      onSleep={() => setIsAsleep(true)}
      onWake={() => setIsAsleep(false)}
      onCollisionEnter={({manifold}) => {
        console.log('Collision at world position ', manifold.solverContactPoint(0))
      }}
    >
      <Sphere>
        <meshPhysicalMaterial color={isAsleep ? 'white' : 'blue'}>
      </Sphere>
    </RigidBody>
  )
}
```

## Joints

WIP

---

## Roadmap

In order, but also not necessarily:

- [x] RigidBodies, Colliders
- [x] Joints
- [x] Nested objects retain world transforms
- [x] Nested objects retain correct collider scale
- [x] Automatic colliders based on rigidbody children
- [x] Translation and rotational constraints
- [x] Collision events
- [x] Colliders outside RigidBodies
- [x] InstancedMesh support
- [x] Timestep improvements for determinism
- [ ] Normalize and improve collision events (add events to single Colliders, InstancedRigidBodies, etc)
- [ ] Docs
- [ ] CodeSandbox examples
- [ ] Helpers, for things like Vehicle, Rope, Player, etc
