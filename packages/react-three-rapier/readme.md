<p align="center">
  <a href="#"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/hero.svg" alt="@react-three/rapier" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@react-three/rapier"><img src="https://img.shields.io/npm/v/@react-three/rapier?style=for-the-badge&colorA=0099DA&colorB=ffffff" /></a>
  <a href="https://discord.gg/ZZjjNvJ"><img src="https://img.shields.io/discord/740090768164651008?style=for-the-badge&colorA=0099DA&colorB=ffffff&label=discord&logo=discord&logoColor=ffffff" /></a>
</p>

<p align="center">⚠️ Under heavy development. All APIs are subject to change. ⚠️
<br />
For contributions, please read the <a href="https://github.com/pmndrs/react-three-rapier/blob/main/packages/react-three-rapier/CONTRIBUTING.md">Contribution Guide</a>.
</p>

---

`react-three/rapier` (or `r3/rapier`) is a wrapper library around the Rapier (https://rapier.rs/docs/user_guides/javascript) WASM-based physics engine, designed to slot seamlessly into a `react-three/fiber` pipeline.

The goal of this library to is to provide a fast physics engine with minimal friction and small, straight forward API.


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

          <CuboidCollider position={[0, -2, 0]} args={[20, .5, 20]} />

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
- [The RigidBody Component](#the-rigidbody-component)
  - [RigidBody props](#rigidbody-props)
- [Automatic Colliders](#automatic-colliders)
- [Collider Components](#collider-components)
  - [Collider props](#collider-props)
  - [🖼 Collider Examples](#-collider-examples)
- [Instanced Meshes](#instanced-meshes)
- [Debug](#debug)
- [Collision Events](#collision-events)
  - [Configuring collision and solver groups](#configuring-collision-and-solver-groups)
- [Contact force events](#contact-force-events)
- [Sensors](#sensors)
  - [🖼 Sensors Example](#-sensors-example)
- [Attractors](#attractors)
  - [🖼 Attractors Example](#-attractors-example)
- [Configuring Time Step Size](#configuring-time-step-size)
- [Manual stepping](#manual-stepping)
- [Joints](#joints)
  - [Fixed Joint](#fixed-joint)
  - [Spherical Joint](#spherical-joint)
  - [Revolute Joint](#revolute-joint)
  - [Prismatic Joint](#prismatic-joint)
  - [Joint APIs](#joint-apis)
  - [🖼 Joints Example](#-joints-example)

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

## The RigidBody Component
The `<RigidBody />` component is used to add a `mesh` into the physics world. You use it by wrapping one or more `meshes` and setting desired props. By default, this will automatically generate `Colliders` based on the shape of the wrapped `meshes` (see [Automatic colliders](#automatic-colliders)).

```tsx
const RigidBodyMesh = () => (
  <RigidBody>
    <mesh />
  </RigidBody>
);
```

### RigidBody props
- `type`?: `string`  
Specify the type of this rigid body. Default: "dynamic".
  - "dynamic": The rigid body is fully dynamic.
  - "fixed": The rigid body is fully fixed.
  - "kinematicPosition": The rigid body is kinematic, and its forces are computed by changing position.
  - "kinematicVelocity": The rigid body is kinematic, and its forced are computed by changing velocit .
- `canSleep`?: `boolean`  
  Whether or not this body can sleep. Default: `true`.
- `linearDamping`?: `number`  
  The linear damping coefficient of this rigid body. Default: `0.0`.
- `angularDamping`?: `number`  
  The angular damping coefficient of this rigid body. Default: `0.0`.
- `linearVelocity`?: `[number, number, number]`  
  The initial linear velocity of this body. Default: `[0, 0, 0]`.
- `angularVelocity`?: `[number, number, number]`  
  The initial angular velocity of this body. Default: `[0, 0, 0]`.
- `gravityScale`?: `number` The scaling factor applied to the gravity affecting the rigid body. Default: `1.0`.
- `ccd`?: `boolean`  
  Whether or not Continous Collision Detection is enabled for this rigid body. Default: `false`.
- `position`?: `[number, number, number]` or `Vector3`  
  Initial position of the RigidBody.
- `rotation`?: `[number, number, number]` or `Euler`  
  Initial rotation of the RigidBody.
- `quaternion`?: `Quaternion`  
  Initial rotation of the RigidBody. Can be used in place of `rotation`.
- `colliders`?: `string` or `false`  
  Automatically generate colliders based on meshes inside this rigid body. See [Automatic colliders](#automatic-colliders).
- `friction`?: `number`  
  Set the friction of auto-generated colliders.
- `restitution`?: `number`  
  Set the restitution (bounciness) of auto-generated colliders. Does not affect any non-automatic child collider components.
- `collisionGroups`?: `InteractionGroups`   
  See [Configuring collision and solver groups](#configuring-collision-and-solver-groups).
- `solverGroups`?: `InteractionGroups`  
  See [Configuring collision and solver groups](#configuring-collision-and-solver-groups).
- `onSleep`?: `function`  
  Callback function that is called when the rigid body sleeps.
- `onWake`?: `function`  
  Callback function that is called when the rigid body wakes up.
- `enabledRotations`?: `[boolean, boolean, boolean]`  
  Allow rotation of this rigid body only along specific axes.
- `enabledTranslations`?: `[boolean, boolean, boolean]`  
  Allow translation of this rigid body only along specific axes.
- `userData`?: `any`  
  Passed down to the object3d representing this collider.
- `includeInvisible`?: `boolean`  
  Include invisible objects on the collider creation estimation.
- `onCollisionEnter`?: `function`  
  See [Collision Events](#collision-events).
- `onCollisionExit`?: `function`  
  See [Collision Events](#collision-events).

## Automatic Colliders

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
  </Physics>
);
```

## Collider Components

You can also create `Colliders` by hand and add them to a `RigidBody` to create compound colliders. This is useful for creating more complex shapes, for creating simplified shapes for performance reasons, or for detecting collisions on specific parts of a mesh.

Available `Collider` components:
- `<CuboidCollider args={[halfWidth, halfHeight, halfDepth]} />`  
  A cuboid collider.
- `<RoundCuboidCollider args={[halfWidth, halfHeight, halfDepth, borderRadius]} />`  
  A cuboid collider with rounded corners.
- `<BallCollider args={[radius]} />`  
  A ball collider.
- `<CapsuleCollider args={[halfHeight, radius]} />`  
  A capsule collider. The capsule is centered on the local-space Y axis.
- `<HeightfieldCollider args={[width, height, heights, scale]} />`  
  A heightfield collider is a heightmap represented by a grid of heights. The heightmap is centered on the local-space Y axis.
- `<TrimeshCollider args={[vertices, indices]} />`  
  A trimesh collider is a concave shape that is automatically computed from a set of points. It is more precise than a convex hull collider, but it is also more expensive to compute and to simulate.
- `<ConeCollider args={[halfHeight, radius]} />`  
  A cone collider. The cone is centered on the local-space Y axis.
- `<CylinderCollider args={[halfHeight, radius]} />`  
  A cylinder collider. The cylinder is centered on the local-space Y axis.
- `<ConvexHullCollider args={[vertices, indices]} />`  
  A convex hull collider is a convex shape that is automatically computed from a set of points. It is a good approximation of a concave shape, but it is not as precise as a trimesh collider. It is also more efficient to compute and to simulate.
- `<MeshCollider />`   
  Wraps one or more `meshes` to generate automatic colliders. Useful for combining with other primitive colliders where you need both simple and complex shapes.

### Collider props
- `principalAngularInertia`?: `[number, number, number]`  
  Principal angular inertia of this collider
- `restitution`?: `number`  
  Restitution (bounciness) of this collider
- restitutionCombineRule?: `CoefficientCombineRule`  
  What happens when two bodies meet. See https://rapier.rs/docs/user_guides/javascript/colliders#friction.
- `friction`?: `number`  
  Friction of this collider
- frictionCombineRule?: `CoefficientCombineRule`  
  What happens when two bodies meet. See https://rapier.rs/docs/user_guides/javascript/colliders#friction.
- `position`?: `[number, number, number]`  or `Vector3`  
  Position of the collider relative to the rigid body.
- `rotation`?: `[number, number, number]` or `Euler`  
  Rotation of the collider relative to the rigid body.
- `quaternion`?: `[number, number, number, number]` or `Quaternion`  
  Rotation of the collider relative to the rigid body.
- `scale`?: `[number, number, number]` or `Vector3`  
  Scale of the collider relative to the rigid body.
- onCollisionEnter?: `CollisionEnterHandler`  
  See [Collision Events](#collision-events).
- onCollisionExit?: `CollisionExitHandler`  
  See [Collision Events](#collision-events).
- `sensor`?: `boolean`  
  See [Sensors](#sensors).  
- onIntersectionEnter?: `IntersectionEnterHandler`  
  See [Sensors](#sensors).  
- onIntersectionExit?: `IntersectionExitHandler`  
  See [Sensors](#sensors).  
- solverGroups?: `InteractionGroups`  
  See [Solver Groups](#solver-groups).
- `collisionGroups`?: `InteractionGroups`  
  See [Collision Groups](#collision-groups).
- `density`?: `number`  
  Sets the uniform density of this collider. If this is set, other mass-properties like the angular inertia tensor are computed automatically from the collider's shape. More info https://rapier.rs/docs/user_guides/javascript/colliders#mass-properties
- `mass`?: `number`  
  Generally, it's not recommended to adjust the mass properties as it could lead to unexpected behaviors. Cannot be used at the same time as the density or massProperties values. More info https://rapier.rs/docs/user_guides/javascript/colliders#mass-properties
- `massProperties`?: `{ mass: number; centerOfMass: Vector; principalAngularInertia: Vector angularInertiaLocalFrame: Rotation; }`  
  The mass properties of this rigid body. Cannot be used at the same time as the density or mass values. More info https://rapier.rs/docs/user_guides/javascript/colliders#mass-properties


```tsx
const Scene = () => (<>
  {/* Make a compound shape with two custom BallColliders */}
  <RigidBody position={[0, 10, 0]}>
    <Sphere />
    <BallCollider args={[0.5]} />
    <BallCollider args={[0.5]} position={[1, 0, 0]} />
  </RigidBody>

  {/* Make a compound shape with two custom BallColliders, an automatic BallCollider,
      Two automatic MeshColliders, based on two different shape types */}
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
<>)
```

RigidBodies work inside other transformed objects as well. Simulation runs in world space and is transformed to the objects local space, so that things act as you'd expect.

> **Note** It's always best to create RigidBodies where the center of gravity is in the center of the object, otherwise you might get some unexpected behavior during simulation interpolation.

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

### 🖼 Collider Examples
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
    if (!instancedApi.current) {
      return
    }

    // You can access individual instanced by their index
    instancedApi.current.at(40).applyImpulse({ x: 0, y: 10, z: 0 });

    // Or update all instances as if they were in an array
    instancedApi.current.forEach((api) => {
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
    <meshPhysicalMaterial color={'grey'} />
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

### 🖼 Sensors Example
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

### 🖼 Attractors Example
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
Joints can be made between two `RigidBodies` to provide a way to restrict a motion of a body in relation to another.
> Read more about joints in Rapier: https://rapier.rs/docs/user_guides/javascript/joints

Joints are available in `r3/rapier` as hooks.

There are 4 different joint types available:
- Fixed (two bodies are fixed together)
- Spherical (two bodies are connected by a ball and socket, for things like arms or chains)
- Revolute (two bodies are connected by a hinge, for things like doors or wheels)
- Prismatic (two bodies are connected by a sliding joint, for things like pistons or sliders)

### Fixed Joint
A fixed joint ensures that two rigid-bodies don't move relative to each other. Fixed joints are characterized by one local frame (represented by an isometry) on each rigid-body. The fixed-joint makes these frames coincide in world-space.

```tsx
const JointedThing = () => {
  const joint = useFixedJoint(
    bodyA,
    bodyB,
    [
      [0, 0, 0], // Position of the joint in bodyA's local space
      [0, 0, 0, 1], // Orientation of the joint in bodyA's local space
      [0, 0, 0], // Position of the joint in bodyB's local space
      [0, 0, 0, 1], // Orientation of the joint in bodyB's local space
    ]);

  return (
    <group>
      <RigidBody ref={bodyA}>
        <mesh />
      </RigidBody>
      <RigidBody ref={bodyB}>
        <mesh />
      </RigidBody>
    </group>
  );
}
```

### Spherical Joint
The spherical joint ensures that two points on the local-spaces of two rigid-bodies always coincide (it prevents any relative translational motion at this points).

```tsx
const JointedThing = () => {
  const joint = useSphericalJoint(
    bodyA,
    bodyB,
    [
      [0, 0, 0], // Position of the joint in bodyA's local space
      [0, 0, 0], // Position of the joint in bodyB's local space
    ]);

  return (
    <group>
      <RigidBody ref={bodyA}>
        <mesh />
      </RigidBody>
      <RigidBody ref={bodyB}>
        <mesh />
      </RigidBody>
    </group>
  );
}
```

### Revolute Joint
The revolute joint prevents any relative movement between two rigid-bodies, except for relative rotations along one axis. This is typically used to simulate wheels, fans, etc.

```tsx
const JointedThing = () => {
  const joint = useRevoluteJoint(
    bodyA,
    bodyB,
    [
      [0, 0, 0], // Position of the joint in bodyA's local space    
      [0, 0, 0], // Position of the joint in bodyB's local space
      [0, 0, 0], // Axis of the joint, expressed in the local-space of the rigid-bodies it is attached to.
    ]);

  return (
    <group>
      <RigidBody ref={bodyA}>
        <mesh />
      </RigidBody>
      <RigidBody ref={bodyB}>
        <mesh />
      </RigidBody>
    </group>
  );
}
```

### Prismatic Joint
The prismatic joint prevents any relative movement between two rigid-bodies, except for relative translations along one axis.

```tsx
const JointedThing = () => {
  const joint = usePrismaticJoint(
    bodyA,
    bodyB,
    [
      [0, 0, 0], // Position of the joint in bodyA's local space    
      [0, 0, 0], // Position of the joint in bodyB's local space
      [0, 0, 0], // Axis of the joint, expressed in the local-space of the rigid-bodies it is attached to.
    ]);

  return (
    <group>
      <RigidBody ref={bodyA}>
        <mesh />
      </RigidBody>
      <RigidBody ref={bodyB}>
        <mesh />
      </RigidBody>
    </group>
  );
}
```

### Joint APIs
Joints can be controlled imperatively similarily to how `RigidBody` components can be controlled.

```tsx
const JointedThing = () => { 
  const joint = useSphericalJoint(...)

  useEffect(() => {
    joint.configureMotorVelocity(1, 0)

    // Disable contacts between the two joint bodies
    joint.raw().setContactsEnabled(false)
  }, [])

  return ...
}
```


### 🖼 Joints Example
<a href="https://codesandbox.io/s/react-three-rapier-joints-mhhbd4"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-joints.jpg" width="240" /></a>