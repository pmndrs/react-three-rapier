<p align="center">
  <a href="#"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/hero.svg" alt="@react-three/rapier" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@react-three/rapier"><img src="https://img.shields.io/npm/v/@react-three/rapier?style=for-the-badge&colorA=0099DA&colorB=ffffff" /></a>
  <a href="https://discord.gg/ZZjjNvJ"><img src="https://img.shields.io/discord/740090768164651008?style=for-the-badge&colorA=0099DA&colorB=ffffff&label=discord&logo=discord&logoColor=ffffff" /></a>
</p>

<p align="center">
⚠️ This library is under development. All APIs are subject to change. ⚠️
<br />
For contributions, please read the <a href="https://github.com/pmndrs/react-three-rapier/blob/main/packages/react-three-rapier/CONTRIBUTING.md">🪧 Contribution Guide</a>.
<br/>
For available APIs, see <a href="https://pmndrs.github.io/react-three-rapier/">🧩 API Docs</a>
</p>

---

`react-three/rapier` (or `r3/rapier`) is a wrapper library around the Rapier (https://rapier.rs/docs/user_guides/javascript) WASM-based physics engine, designed to slot seamlessly into a `react-three/fiber` pipeline.

The goal of this library to is to provide a fast physics engine with minimal friction and small, straight forward API.

<!-- omit from toc -->
## Basic Usage

```tsx
import { Box, Torus } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

const App = () => {
  return (
    <Canvas>
      <Suspense>
        <Physics debug>
          <RigidBody colliders={"hull"} restitution={2}>
            <Torus />
          </RigidBody>

          <CuboidCollider position={[0, -2, 0]} args={[20, 0.5, 20]} />
        </Physics>
      </Suspense>
    </Canvas>
  );
};
```

---

<!-- omit from toc -->
## 📝 Readme note

Below follows a guide on core concepts for `react-three/rapier`.  
For full API outline and documentation, see 🧩 [API Docs](https://pmndrs.github.io/react-three-rapier/).

---

<!-- omit from toc -->
## Readme Topics

- [The Physics Component](#the-physics-component)
- [The RigidBody Component](#the-rigidbody-component)
- [Automatic Colliders](#automatic-colliders)
- [Collider Components](#collider-components)
  - [🖼 Collider Examples](#-collider-examples)
- [Instanced Meshes](#instanced-meshes)
- [Debug](#debug)
- [Moving things around, and applying forces](#moving-things-around-and-applying-forces)
- [Collision Events](#collision-events)
  - [Configuring collision and solver groups](#configuring-collision-and-solver-groups)
- [Contact force events](#contact-force-events)
- [Sensors](#sensors)
  - [🖼 Sensors Example](#-sensors-example)
- [Configuring Time Step Size](#configuring-time-step-size)
- [Joints](#joints)
  - [Fixed Joint](#fixed-joint)
  - [Spherical Joint](#spherical-joint)
  - [Revolute Joint](#revolute-joint)
  - [Prismatic Joint](#prismatic-joint)
  - [🖼 Joints Example](#-joints-example)
- [Advanced hooks usage](#advanced-hooks-usage)
  - [Manual stepping](#manual-stepping)
  - [On-demand rendering](#on-demand-rendering)

---

## The Physics Component

The `<Physics />` component is the root component of your physics world. It is responsible for creating the physics world and managing the simulation. It relies on lazily initiating `Rapier` and needs to be wrapped in `<Suspense />`.

🧩 See [PhysicsProps docs](https://pmndrs.github.io/react-three-rapier/interfaces/PhysicsProps.html) for available props.

```tsx
const Scene = () => {
  return (
    <Canvas>
      <Suspense>
        <Physics gravity={[0, 1, 0]} interpolation={false} colliders={false}>
          ...
        </Physics>
      </Suspense>
    </Canvas>
  );
};
```

## The RigidBody Component

The `<RigidBody />` component is used to add a `mesh` into the physics world. You use it by wrapping one or more `meshes` and setting desired props. By default, this will automatically generate `Colliders` based on the shape of the wrapped `meshes` (see [Automatic colliders](#automatic-colliders)).

🧩 See [RigidBodyProps docs](https://pmndrs.github.io/react-three-rapier/interfaces/RigidBodyProps.html) for available props.

```tsx
const RigidBodyMesh = () => (
  <RigidBody>
    <mesh />
  </RigidBody>
);
```

## Automatic Colliders

RigidBodies generate automatic colliders by default for all meshes that it contains. You can control the default collider by setting the `colliders` prop on a `<RigidBody />`, or change it globally by setting `colliders` on `<Physics />`. Setting `colliders={false}` disables auto-generation.

Supported values:

- `"cuboid"`, creates a CuboidCollider based on the bounding box of the mesh
- `"ball"`, creates a SphereCollider based on the bounding sphere of the mesh
- `"trimesh"`, creates a TrimeshCollider based on the mesh's geometry
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

🧩 See [ColliderProps docs](https://pmndrs.github.io/react-three-rapier/interfaces/ColliderProps.html) for available props.

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

By wrapping exactly one `Three.InstancedMesh` in `<InstancedRigidBodies />`, each instance will be attached to an individual `RigidBody`.

🧩 See [InstancedRigidBodiesProps docs](https://pmndrs.github.io/react-three-rapier/interfaces/InstancedRigidBodiesProps.html) for available props.

```tsx
import { InstancedRigidBodies, RapierRigidBody } from "@react-three/rapier";

const COUNT = 1000;

const Scene = () => {
  const rigidBodies = useRef<RapierRigidBody[]>(null);

  useEffect(() => {
    if (!rigidBodies.current) {
      return;
    }

    // You can access individual instanced by their index
    rigidBodies.current[40].applyImpulse({ x: 0, y: 10, z: 0 }, true);
    rigidBodies.current.at(100).applyImpulse({ x: 0, y: 10, z: 0 }, true);

    // Or update all instances
    rigidBodies.current.forEach((api) => {
      api.applyImpulse({ x: 0, y: 10, z: 0 }, true);
    });
  }, []);

  // We can set the initial positions, and rotations, and scales, of
  // the instances by providing an array of InstancedRigidBodyProps
  // which is the same as RigidBodyProps, but with an additional "key" prop.
  const instances = useMemo(() => {
    const instances: InstancedRigidBodyProps[] = [];

    for (let i = 0; i < COUNT; i++) {
      instances.push({
        key: "instance_" + Math.random(),
        position: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
        rotation: [Math.random(), Math.random(), Math.random()]
      });
    }

    return instances;
  }, []);

  return (
    <InstancedRigidBodies
      ref={rigidBodies}
      instances={instances}
      colliders="ball"
    >
      <instancedMesh args={[undefined, undefined, COUNT]} count={COUNT} />
    </InstancedRigidBodies>
  );
};
```

We can also create compound shapes for instanced meshes by providing an array of `Colliders` in the `colliderNodes` prop.

```tsx
import {
  InstancedRigidBodies,
  BoxCollider,
  SphereCollider
} from "@react-three/rapier";
const COUNT = 500;

const Scene = () => {
  const instances = useMemo(() => {
    const instances: InstancedRigidBodyProps[] = [];

    for (let i = 0; i < COUNT; i++) {
      instances.push({
        key: "instance_" + Math.random(),
        position: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
        rotation: [Math.random(), Math.random(), Math.random()]
      });
    }

    return instances;
  }, []);

  return (
    <InstancedRigidBodies
      instances={instances}
      colliders="ball"
      colliderNodes={[
        <BoxCollider args={[0.5, 0.5, 0.5]} />,
        <SphereCollider args={[0.5]} />
      ]}
    >
      <instancedMesh args={[undefined, undefined, COUNT]} count={COUNT} />
    </InstancedRigidBodies>
  );
};
```

## Debug

Set the `debug` prop on `<Physics />` to see live representations of all colliders in a scene, using the live debug buffer from the physics engine.

```tsx
import { Box, Sphere } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

const Scene = () => {
  return (
    <Physics debug>
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

## Moving things around, and applying forces

You can access the instance for a RigidBody by storing its `ref`. This allows you to perform any operation on the underlying physics object directly.

`r3/rapier` exposes a `RapierRigidBody` and `RapierCollider` as aliases for `rapiers` underlying base objects.

For all available methods, see the [Rapier docs](https://rapier.rs/javascript3d/classes/RigidBody.html).

```tsx
import { RigidBody, RapierRigidBody } from "@react-three/rapier";

const Scene = () => {
  const rigidBody = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (rigidBody.current) {
      // A one-off "push"
      rigidBody.current.applyImpulse({ x: 0, y: 10, z: 0 }, true);

      // A continuous force
      rigidBody.current.addForce({ x: 0, y: 10, z: 0 }, true);

      // A one-off torque rotation
      rigidBody.current.applyTorqueImpulse({ x: 0, y: 10, z: 0 }, true);

      // A continuous torque
      rigidBody.current.addTorque({ x: 0, y: 10, z: 0 }, true);
    }
  }, []);

  return (
    <RigidBody ref={rigidBody}>
      <mesh>
        <boxBufferGeometry />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
  );
};
```

Rapier's API returns quaternions and vectors that are not compatible with Three.js, `r3/rapier` therefore exposes some helper functions (`vec3`, `quat`, `euler`) for quick type conversions. These helper functions can also be used as a shorthand for creating new objects.

```tsx
import { RapierRigidBody, quat, vec3, euler } from "@react-three/rapier";

const Scene = () => {
  const rigidBody = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (rigidBody.current) {
      const position = vec3(rigidBody.current.translation());
      const quaternion = quat(rigidBody.current.rotation());
      const eulerRot = euler().setFromQuaternion(
        quat(rigidBody.current.rotation())
      );

      // While Rapier's return types need conversion, setting values can be done directly with Three.js types
      rigidBody.current.setTranslation(position, true);
      rigidBody.current.setRotation(quaternion, true);
      rigidBody.current.setAngvel({ x: 0, y: 2, z: 0 }, true);
    }
  }, []);

  return (
    <RigidBody ref={rigidBody}>
      <mesh>
        <boxBufferGeometry />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
  );
};
```

## Collision Events

You can subscribe to collision and state events on a RigidBody:

🧩 See [onCollisionEnter / onCollisionExit docs](https://pmndrs.github.io/react-three-rapier/interfaces/RigidBodyProps.html#onCollisionEnter) for more information.

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
  }}
>
  <Sphere>
    <meshPhysicalMaterial color={"grey"} />
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

🧩 See [onIntersectionEnter / onIntersectionExit docs](https://pmndrs.github.io/react-three-rapier/interfaces/RigidBodyProps.html#onIntersectionEnter) for more information.

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

## Joints

Joints can be made between two `RigidBodies` to provide a way to restrict a motion of a body in relation to another.

> Read more about joints in Rapier: https://rapier.rs/docs/user_guides/javascript/joints

Joints are available in `r3/rapier` as hooks.

There are 4 different joint types available:

- Fixed (two bodies are fixed together)
- Spherical (two bodies are connected by a ball and socket, for things like arms or chains)
- Revolute (two bodies are connected by a hinge, for things like doors or wheels)
- Prismatic (two bodies are connected by a sliding joint, for things like pistons or sliders)

Each joint hook returns a RefObject containing the raw reference to the joint instance.

```tsx
const WheelJoint = ({ bodyA, bodyB }) => {
  const joint = useRevoluteJoint(bodyA, bodyB, [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]);

  useFrame(() => {
    if (joint.current) {
      joint.current.configureMotorVelocity(10, 2);
    }
  }, []);

  return null;
};
```

### Fixed Joint

A fixed joint ensures that two rigid-bodies don't move relative to each other. Fixed joints are characterized by one local frame (represented by an isometry) on each rigid-body. The fixed-joint makes these frames coincide in world-space.

🧩 See [FixedJoint docs](https://pmndrs.github.io/react-three-rapier/functions/useFixedJoint.html) for available options.

```tsx
const JointedThing = () => {
  const joint = useFixedJoint(bodyA, bodyB, [
    // Position of the joint in bodyA's local space
    [0, 0, 0],
    // Orientation of the joint in bodyA's local space
    [0, 0, 0, 1],
    // Position of the joint in bodyB's local space
    [0, 0, 0],
    // Orientation of the joint in bodyB's local space
    [0, 0, 0, 1]
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
};
```

### Spherical Joint

The spherical joint ensures that two points on the local-spaces of two rigid-bodies always coincide (it prevents any relative translational motion at this points).

🧩 See [SphericalJoint docs](https://pmndrs.github.io/react-three-rapier/functions/useSphericalJoint.html) for available options.

```tsx
const JointedThing = () => {
  const joint = useSphericalJoint(bodyA, bodyB, [
    // Position of the joint in bodyA's local space
    [0, 0, 0],
    // Position of the joint in bodyB's local space
    [0, 0, 0]
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
};
```

### Revolute Joint

The revolute joint prevents any relative movement between two rigid-bodies, except for relative rotations along one axis. This is typically used to simulate wheels, fans, etc.

🧩 See [RevoluteJoint docs](https://pmndrs.github.io/react-three-rapier/functions/useRevoluteJoint.html) for available options.

```tsx
const JointedThing = () => {
  const joint = useRevoluteJoint(bodyA, bodyB, [
    // Position of the joint in bodyA's local space
    [0, 0, 0],
    // Position of the joint in bodyB's local space
    [0, 0, 0],
    // Axis of the joint, expressed in the local-space of
    // the rigid-bodies it is attached to. Cannot be [0,0,0].
    [0, 1, 0]
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
};
```

### Prismatic Joint

The prismatic joint prevents any relative movement between two rigid-bodies, except for relative translations along one axis.

🧩 See [PrismaticJoint docs](https://pmndrs.github.io/react-three-rapier/functions/usePrismaticJoint.html) for available options.

```tsx
const JointedThing = () => {
  const joint = usePrismaticJoint(bodyA, bodyB, [
    // Position of the joint in bodyA's local space
    [0, 0, 0],
    // Position of the joint in bodyB's local space
    [0, 0, 0],
    // Axis of the joint, expressed in the local-space of
    // the rigid-bodies it is attached to. Cannot be [0,0,0].
    [0, 1, 0]
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
};
```

### 🖼 Joints Example

<a href="https://codesandbox.io/s/react-three-rapier-joints-mhhbd4"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-joints.jpg" width="240" /></a>

## Advanced hooks usage

Advanced users might need granular access to the physics loop and direct access to the `world` instance. This can be done by using the following hooks:

- `useRapier`  
  Gives you access to the `world`, direct access to `rapier`, and more.  
  🧩 See [useRapier docs](https://pmndrs.github.io/react-three-rapier/interfaces/RapierContext.html) for more information.
- `useBeforePhysicsStep`  
  Allows you to run code before the physics simulation is stepped.  
  🧩 See [useBeforePhysicsStep docs](https://pmndrs.github.io/react-three-rapier/functions/useBeforePhysicsStep.html) for more information.
- `useAfterPhysicsStep`
  Allows you to run code after the physics simulation is stepped.  
  🧩 See [useAfterPhysicsStep docs](https://pmndrs.github.io/react-three-rapier/functions/useAfterPhysicsStep.html) for more information.

### Manual stepping

You can manually step the physics simulation by calling the `step` method from the `useRapier` hook.

```tsx
const { step } = useRapier();

step(1 / 60);
```

### On-demand rendering

By default `@react-three/rapier` will update the physics simulation when a frame renders. This is fine for most cases, but if you want to only render the scene when things have changed, you need to run the physics simulation independently from the render loop.

- See https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance#on-demand-rendering, for info on on-demand rendering in `@react-tree/fiber`.

Setting `<Physics updateLoop="independent" />` will make the physics simulation run in it's own `requestAnimationFrame` loop, and call `invalidate` on the canvas only when there are active (moving) bodies.

```tsx
<Canvas frameloop="demand">
  <Physics updateLoop="independent">...</Physics>
</Canvas>
```

### Snapshots
The `world` can be serialized as a `Uint8Array` using `world.takeSnapshot()`, see Rapier's docs on [Serialization](https://rapier.rs/docs/user_guides/javascript/serialization/) for more info.

The snapshot can be used to construct a new world. In `r3/rapier`, you need to replace the world with this snapshot.

> [!NOTE]
> This only works if the snapshotted world is identical to the restored one. If objects, or the order of creation of objects vary, expect RigidBodies to scramble.

```tsx
import { useRapier } from '@react-three/rapier';

const SnapshottingComponent = () => {
  const { world, setWorld, rapier } = useRapier();
  const worldSnapshot = useRef<Uint8Array>();

  // Store the snapshot
  const takeSnapshot = () => {
    const snapshot = world.takeSnapshot()
    worldSnapshot.current = snapshot
  }

  // Create a new World from the snapshot, and replace the current one
  const restoreSnapshot = () => {
    setWorld(rapier.World.restoreSnapshot(worldSnapshot.current))
  }

  return <>
    <Rigidbody>...</RigidBody>
    <Rigidbody>...</RigidBody>
    <Rigidbody>...</RigidBody>
    <Rigidbody>...</RigidBody>
    <Rigidbody>...</RigidBody>
  </>
}
```