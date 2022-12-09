<p align="center">
  <a href="#"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/hero.svg" alt="@react-three/rapier" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@react-three/rapier"><img src="https://img.shields.io/npm/v/@react-three/rapier?style=for-the-badge&colorA=0099DA&colorB=ffffff" /></a>
  <a href="https://discord.gg/ZZjjNvJ"><img src="https://img.shields.io/discord/740090768164651008?style=for-the-badge&colorA=0099DA&colorB=ffffff&label=discord&logo=discord&logoColor=ffffff" /></a>
</p>

<p align="center">⚠️ Under heavy development. All APIs are subject to change. ⚠️</p>

For contributions, please read the [contributing guide](https://github.com/pmndrs/react-three-rapier/blob/main/packages/react-three-rapier/CONTRIBUTING.md).

## Basic Usage

```tsx
import { Box, Torus } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, Debug } from "@react-three/rapier";

const App = () => {
  return (
    <Canvas>
      <Suspense>
        <Physics>
          <RigidBody colliders={"hull"} restitution={2}>
            <Torus />
          </RigidBody>

          <CuboidCollider position={[0, -2, 0]} args={[20, .5, 20]}>

          <Debug />
        </Physics>
      </Suspense>
    </Canvas>
  );
};
```

---

## Readme Topics

- [Basic Usage](#basic-usage)
- [Readme Topics](#readme-topics)
- [The Physics Component](#the-physics-component)
- [Automatic colliders](#automatic-colliders)
  - [Collider Examples](#collider-examples)
- [Instanced Meshes](#instanced-meshes)
- [Debug](#debug)
- [Collision Events](#collision-events)
  - [Configuring collision and solver groups](#configuring-collision-and-solver-groups)
- [Contact force events](#contact-force-events)
- [Sensors](#sensors)
  - [Sensors Example](#sensors-example)
- [Attractors](#attractors)
  - [Attractors Example](#attractors-example)
- [Configuring Time Step Size](#configuring-time-step-size)
- [Manual stepping](#manual-stepping)
- [Joints](#joints)
  - [Joints Example](#joints-example)

---

## The Physics Component
The `<Physics />` component is the root component of your physics world. It is responsible for creating the physics world and managing the simulation. It relies on lazily initiating `Rapier` and needs to be wrapped in `<Suspense />`.

```tsx
  // The gravity of the physics workd
  gravity?: Vector3Array; // default [0, -9.81, 0]

  // Which collider shape to generate for meshes by default
  colliders?: RigidBodyAutoCollider; // default "cuboid"

  // The number of physics steps per second
  timeStep?: number | "vary"; // default 1/60

  // Pause the physic simulation
  paused?: boolean; // default false

  // Which order to run the physics simulation
  updatePriority?: number;

  // If the physics updates slower than the monitor refreshes,
  // interpolation will smooth out the steps between frames
  interpolate?: boolean; // default true
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

If part of our meshes are invisible and you want to include them in the collider creation, use the `includeInvisible` flag.

```tsx
<RigidBody colliders="hull" includeInvisible>
  <object3D>
    <Suzanne visible={false} />
  </object3D>
</RigidBody>
```

### Collider Examples
<a href="https://codesandbox.io/s/react-three-rapier-auto-colliders-b4coz1"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-auto-colliders.jpg" width="240" /></a>
<a href="https://codesandbox.io/s/react-three-rapier-compound-colliders-ol5ybn"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-compound-shapes.jpg" width="240" /></a>

## Instanced Meshes

Instanced meshes can also be used and have automatic colliders generated from their mesh.

By wrapping the `InstancedMesh` in `<InstancedRigidBodies />`, each instance will be attached to an individual `RigidBody`.

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
    Math.random()
  ]);

  const scales = Array.from({ length: COUNT }, (_, index) => [
    Math.random(),
    Math.random(),
    Math.random()
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
        <sphereGeometry args={[0.2]} />
        <meshPhysicalGeometry color="blue" />

        <CuboidCollider args={[0.1, 0.2, 0.1]} />
      </instancedMesh>
    </InstancedRigidBodies>
  );
};
```

## Debug

Use the Debug component to see live representations of all colliders in a scene, using the live debug buffer from the physics engine.

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

## Collision Events

You can subscribe to collision and state events on a RigidBody:

```tsx
const RigidBottle = () => {
  const [isAsleep, setIsAsleep] = useState(false);

  return (
    <RigidBody
      colliders="hull"
      onSleep={() => setIsAsleep(true)}
      onWake={() => setIsAsleep(false)}
      name="Bally McBallFace"
      onCollisionEnter={({ manifold, target, other }) => {
        console.log(
          "Collision at world position ",
          manifold.solverContactPoint(0)
        );

        if (other.rigidBodyObject) {
          console.log(
            // this rigid body's Object3D
            target.rigidBodyObject.name,
            " collided with ",
            // the other rigid body's Object3D
            other.rigidBodyObject.name
          );
        }
      }}
    >
      <Sphere>
        <meshPhysicalMaterial color={isAsleep ? "white" : "blue"} />
      </Sphere>
    </RigidBody>
  );
};
```

You may also subscribe to collision events on individual Colliders:

```tsx
<CuboidCollider
  onCollisionEnter={(payload) => {
    /* ... */
  }}
  onCollisionExit={(payload) => {
    /* ... */
  }}
/>
```

The `payload` object for all collision callbacks contains the following properties:

- `target`  
  `CollisionTarget` of the object firing the event.
- `other`  
  `CollisionTarget` of the other object involved in the event.
- `manifold` (onCollisionEnter only)  
  The [contact manifold](https://rapier.rs/javascript3d/classes/TempContactManifold.html) generated by the collision event.
- `flipped` (onCollisionEnter only)  
  `true` if the data in the `manifold` [is flipped](https://rapier.rs/javascript3d/classes/World.html#contactPair).

A `CollisionTarget` is an object containing references to objects involved in a collision event. It has the following properties:

- `rigidBody` (if exists): `Rapier.RigidBody`
- `rigidBodyObject` (if exists): `Three.Object3D`
- `collider`: `Rapier.Collider`
- `colliderObject`: `Three.Object3D`

### Configuring collision and solver groups

Both `<RigidBody>` as well as all collider components allow you to configure `collisionsGroups` and `solverGroups` properties that configures which groups the colliders are in, and what other groups they should interact with in potential collision and solving events (you will find more details on this in the [Rapier documentation](https://rapier.rs/docs/user_guides/javascript/colliders/#collision-groups-and-solver-groups).)

Since these are set as bitmasks and bitmasks can get a bit unwieldy to generate, this library provides a helper called `interactionGroups` that can be used to generate bitmasks from numbers and arrays of groups, where groups are identified using numbers from 0 to 15.

The first argument is the group, or an array of groups, that the collider is a member of; the second argument is the group, or an array of groups, that the collider should interact with.

Here the collider is in group 0, and interacts with colliders from groups 0, 1 and 2:

```tsx
<CapsuleCollider collisionGroups={interactionGroups(0, [0, 1, 2])} />
```

This collider is in multiple groups, but only interacts with colliders from a single group:

```tsx
<CapsuleCollider collisionGroups={interactionGroups([0, 5], 7)} />
```

When the second argument is omitted, the collider will interact with all groups:

```tsx
<CapsuleCollider collisionGroups={interactionGroups(12)} />
```

> **Note** Please remember that in Rapier, for a collision (or solving) event to occur, both colliders involved in the event must match the related interaction groups -- a one-way match will be ignored.

> **Note** By default, colliders are members of all groups, and will interact with all other groups.

## Contact force events

Contact force events are triggered on `<RigidBody>` and any collider components when two objects collider.

```tsx
<RigidBody
  colliders="ball"
  onContactForce={(payload) => {
    console.log(`The total force generated was: ${payload.totalForce}`);
  }}>
  <Sphere>
    <meshPhysicalMaterial color={'grey'}>
  </Sphere>
</RigidBody>
```

The payload for the contact force event contains the following properties:

- `target`  
  `CollisionTarget` of the object firing the event
- `other`  
  `CollisionTarget` of the other object involved in the event
- `totalForce`  
  The sum of all the forces between the two colliders
- `totalForceMagnitude`  
  The sum of the magnitudes of each force between the two colliders
- `maxForceDirection`  
  The magnitude of the largest force at a contact point of this contact pair
- `maxForceMagnitude`  
  The world-space (unit) direction of the force with strongest magnitude

More information about each property can be found in the rapier [TempContactForceEvent API documentation](https://rapier.rs/javascript3d/classes/TempContactForceEvent.html).

You can also add the `onContactForce` event to any collider.

```tsx
<CapsuleCollider
  onContactForce={(payload) => {
    /* ... */
  }}
/>
```

## Sensors

A Collider can be set to be a sensor, which means that it will not generate any contact points, and will not be affected by forces. This is useful for detecting when a collider enters or leaves another collider, without affecting the other collider.

To detect when a collider enters or leaves another collider, you can use the `onIntersectionEnter` and `onIntersectionExit` events on the collider.

```tsx
<RigidBody>
  <GoalPosts />

  <CuboidCollider
    args={[5, 5, 1]}
    sensor
    onIntersectionEnter={() => console.log("Goal!")}
  />
</RigidBody>
```

### Sensors Example
<a href="https://codesandbox.io/s/react-three-rapier-sensors-byjmsk"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-sensors.jpg" width="240" /></a>

## Attractors

An attractor simulates a source of gravity. Any `RigidBody` within range will be _pulled_ (attracted) toward the attractor.  
Setting the `strength` to a negative value will cause the `RigidBody` to be _pushed_ (repelled) away from the attractor.

The force applied to rigid-bodies within range is calculated differently depending on the `type`.

```tsx
// Standard attractor
<Attractor range={10} strength={5} type="linear" position={[5, -5, 0]} />

// An attractor with negative strength, repels RigidBodies
<Attractor range={10} strength={-5} position={[5, -5, 0]} />

// You can also assign InteractionGroups.
// An attractor belonging to group 0 only affecting bodies in group 2, and 3
<Attractor range={10} strength={10} position={[5, -5, 0]} collisionGroups={interactionGroups(0, [2,3])} />
```

Gravity types:

- "static" (Default)  
  Static gravity means that the same force (`strength`) is applied on all rigid-bodies within range, regardless of distance.

- "linear"  
  Linear gravity means that force is calculated as `strength * distance / range`. That means the force applied decreases the farther a rigid-body is from the attractor position.

- "newtonian"  
  Newtonian gravity uses the traditional method of calculating gravitational force (`F = GMm/r^2`) and as such force is calculated as `gravitationalConstant * mass1 * mass2 / Math.pow(distance, 2)`.
  - `gravitationalConstant` defaults to 6.673e-11 but you can provide your own
  - `mass1` here is the "mass" of the Attractor, which is just the `strength` property
  - `mass2` is the mass of the rigid-body at the time of calculation. Note that rigid-bodies with colliders will use the mass provided to the collider. This is not a value you can control from the attractor, only from wherever you're creating rigid-body components in the scene.
  - `distance` is the distance between the attractor and rigid-body at the time of calculation

### Attractors Example
<a href="https://codesandbox.io/s/react-three-rapier-attractors-oyj640"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-attractors.jpg" width="240" /></a>

## Configuring Time Step Size

By default, `<Physics>` will simulate the physics world at a fixed rate of 60 frames per second. This can be changed by setting the `timeStep` prop on `<Physics>`:

```tsx
<Physics timeStep={1 / 30}>{/* ... */}</Physics>
```

The `timeStep` prop may also be set to `"vary"`, which will cause the simulation's time step to adjust to every frame's frame delta:

```tsx
<Physics timeStep="vary">{/* ... */}</Physics>
```

> **Note** This is useful for games that run at variable frame rates, but may cause instability in the simulation. It also prevents the physics simulation from being fully deterministic. Please use with care!

## Manual stepping

You can also manually step the physics simulation by calling the `step` method from the `useRapier` hook.

```tsx
const { step } = useRapier();

step(1 / 60);
```

## Joints

- WIP

### Joints Example
<a href="https://codesandbox.io/s/react-three-rapier-joints-mhhbd4"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-joints.jpg" width="240" /></a>