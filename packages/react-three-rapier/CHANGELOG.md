# @react-three/rapier

## 1.1.1

### Patch Changes

- c50783a: Fix types for PrismaticJointParams (@wiledal)

## 1.1.0

### Minor Changes

- 95a232b: Update deps

## 1.0.1

### Patch Changes

- 787462d: Fix world settings not updating when being set (@wiledal)

## 1.0.0

### Major Changes

- 6c764cc: Remove WorldApi, replace with singleton instance proxy (@wiledal)

  BREAKING CHANGE: The `WorldApi` has been removed. Instead, you can now get a proxied singleton instance of the world from `@react-three/rapier`. This is a breaking change, but it should be easy to migrate to.

  Before:

  ```tsx
  import { useRapier } from "@react-three/rapier";

  const Component = () => {
    const { world } = useRapier();

    useEffect(() => {
      // Access to the WorldApi (limited)
      world.raw().bodies.forEach(() => {
        // Do something
      });

      // Access the raw Rapier World instance
      const rawWorldInstance = world.raw();
      rawWorldInstance.raw().setGravity(new Vector3(0, -9.81, 0));
    }, []);
  };
  ```

  Now:

  ```tsx
  import { useRapier } from "@react-three/rapier";

  const Component = () => {
    const { world } = useRapier();

    useEffect(() => {
      // Access the Rapier World instance directly
      world.bodies.forEach(() => {
        // Do something
      });
      world.setGravity(new Vector3(0, -9.81, 0));
    }, []);
  };
  ```

  Note: it is best to avoid accessing properties and methods on the world outside of `useEffect` in order for the world to be properly synchronized with the React component lifecycle.

  ```tsx
  // bad
  const Component = () => {
    const {world} = useRapier()

    world.setGravity(...)

    return null
  }

  // good
  const Component = () => {
    const {world} = useRapier()

    useEffect(() => {
      world.setGravity(...)
    }, [])

    return null
  }
  ```

### Minor Changes

- 93c7e8c: Add missing RoundCylinderCollider and RoundConeCollider (@wiledal)
- c4d2446: Deprecate Vector3Array for Vector3Tuple (@wiledal)
- af27f83: Add integrationProperties as mutable props on Physics (@wiledal)

### Patch Changes

- 3057f3c: Fix initiation to only happen in mount effects, never render, for increased stability (@wiledal)
- c4d2446: Internal refactor regarding instances (@wiledal)

## 1.0.0-canary.2

### Major Changes

- 6c764cc: Remove WorldApi, replace with singleton instance proxy (@wiledal)

  BREAKING CHANGE: The WorldApi has been removed. Instead, you can now import the singleton instance of the world from @react-three/rapier. This is a breaking change, but it should be easy to migrate to.

  Before:

  ```tsx
  import { useRapier } from "@react-three/rapier";

  const Component = () => {
    const { world } = useRapier();

    useEffect(() => {
      // Access to the WorldApi (limited)
      world.bodies.forEach(() => {
        // Do something
      });

      // Access the raw Rapier World instance
      const rawWorldInstance = world.raw();
      rawWorldInstance.raw().setGravity(new Vector3(0, -9.81, 0));
    }, []);
  };
  ```

  Now:

  ```tsx
  import { useRapier } from "@react-three/rapier";

  const Component = () => {
    const { world } = useRapier();

    useEffect(() => {
      // Access the Rapier World instance directly
      world.bodies.forEach(() => {
        // Do something
      });
      world.setGravity(new Vector3(0, -9.81, 0));
    }, []);
  };
  ```

  Note: it is best to avoid accessing properties and methods on the world outside of `useEffect`, or `useLayoutEffect` in order for the world to be properly synchronized with the React component lifecycle.

  ```tsx
  // bad
  const Component = () => {
    const {world} = useRapier()

    world.setGravity(...)

    return null
  }

  // good
  const Component = () => {
    const {world} = useRapier()

    useEffect(() => {
      world.setGravity(...)
    }, [])

    return null
  }
  ```

## 0.16.0-canary.1

### Patch Changes

- 3057f3c: Fix initiation to only happen in mount effects, never render, for increased stability (@wiledal)

## 0.16.0-canary.0

### Minor Changes

- 93c7e8c: Add missing RoundCylinderCollider and RoundConeCollider (@wiledal)
- c4d2446: Deprecate Vector3Array for Vector3Tuple (@wiledal)

### Patch Changes

- c4d2446: Internal refactor regarding instances

## 0.15.1

### Patch Changes

- 35ee03b: Loosen peer deps in attempt to solve npm install conflicts

## 0.15.0

### Minor Changes

- 3d8f152: Removes the `<Debug />` component, in favor of setting `debug={true}` on the `<Physics />` component instead
- 3d8f152: Move `<Attractor />` to @react-three/rapier-addons

## 0.15.0-canary.0

### Minor Changes

- 3d8f152: Removes the `<Debug />` component, in favor of setting `debug={true}` on the `<Physics />` component instead
- 3d8f152: Move `<Attractor />` to @react-three/rapier-addons

## 0.14.0

### Minor Changes

- eabf8b1: Add on-demand rendering for usage with the r3f 'demand' frameloop strategy.
- 4f88218: Add dominance group to RigidBody (@vynetic)
- 6ddace8: Update @dimforge/rapier3d-compat to 0.11.2
- 92423f1: Allow users to control if the update loop runs independently or on useFrame

### Patch Changes

- 668659f: Fix missing React import
- 6547d0e: Fix tsdoc typo (@balraj-johal)
- 1f41278: Fix collision events firing multiple times on RigidBodies

## 0.14.0-rc.4

### Minor Changes

- 6ddace8: Update @dimforge/rapier3d-compat to 0.11.2

## 0.14.0-rc.3

### Patch Changes

- 668659f: Fix missing React import

## 0.14.0-rc.2

### Minor Changes

- 92423f1: Allow users to control if the update loop runs independently or on useFrame

## 0.14.0-rc.1

### Patch Changes

- 1f41278: Fix collision events firing multiple times on RigidBodies

## 0.14.0-rc.0

### Minor Changes

- eabf8b1: Add on-demand rendering for usage with the r3f 'demand' frameloop strategy.
- 4f88218: Add dominance group to RigidBody (@vynetic)
- eabf8b1: Removes `updatePriority`, as the physics loop now runs independently from the `useFrame`

### Patch Changes

- 6547d0e: Fix tsdoc typo (@balraj-johal)

## 0.13.2

### Patch Changes

- d27d688: Fix eager initiation of Rapier objects when called before ref-objects are available

## 0.13.1

### Patch Changes

- 0104039: feat: change callbacks for `useBeforePhysicsStep` and `useAfterPhysicsStep` to be mutable (@isaac-mason)

## 0.13.0

### Minor Changes

- 02055ed: Removed joints api, replaced with RefObjects containing the joint instances
- 25c4261: Update rapier to 0.11.1
- 02055ed: Refreshed InstancedRigidBody component with support for dynamic count and fine-grain control over each instance
- 02055ed: Remove RigidBody proxy apis for much needed simplification, add helper functions for dealing with Rapier math functions
- 02055ed: Collider refs now return a single collider rather than an array, as it should be

## 0.12.2

### Patch Changes

- 2937801: fix: attractors broken when using timeStep="vary" (@isaac-mason)
- 2937801: fix: previous rigid body positions used for interpolation weren't being populated correctly

## 0.12.1

### Patch Changes

- a8af66a: Add missing react imports

## 0.12.0

### Minor Changes

- 8bc4a3c: Add useBefore- and useAfterPhysicsStep hooks
- 86482bd: Clean up exported types, add typedoc for generating html docs

## 0.11.3

### Patch Changes

- 09cbbde: Add joints to readme
- 09cbbde: useFixedJoint now allows `w` to be set for the local space orientation

## 0.11.2

### Patch Changes

- 5a3f68b: fix(RigidBody): canSleep always true due to using logical OR instead of nullish coalescing operator (@isaac-mason)
- 46bf448: feat: add support for revolute and prismatic joint limits (@planktonrobo)

## 0.11.1

### Patch Changes

- bf15c27: Fix issue with `canSleep` missing from RigidBodyDesc
- bf15c27: Enable dynamic changing of RigidBody `type`

## 0.11.0

### Minor Changes

- 7638b8a: Update to @dimforge/rapier3d-compat@0.10.0

### Patch Changes

- 7638b8a: Add lockedRotations, lockedTranslations to RB mutable props

## 0.10.0

### Minor Changes

- fcd9ac6: Add Attractor (@AlexWarnes, @wiledal)

### Patch Changes

- 30c30b6: feat(CollisionEvents): include data from both affected objects (@RodrigoHamuy, @wiledal)
- fcd9ac6: Solve free-standing colliders having incorrect world translations (@wiledal)
- f10368a: Expose a manual step function (@wiledal, @firtoz)

## 0.9.0

### Minor Changes

- 668252c: Add support for contact force events (@micmania1)

### Patch Changes

- bf68df9: More accurate interpolation by adding current previous state (@wiledal)
- f50fb7b: The RigidBody `userData` prop now sets rigid body `userData`, as well as the object3d `userData` (@isaac-mason)
- 5d46293: Add name prop to RigidBody and collider components (@micmania1)

## 0.8.2

### Patch Changes

- 8110058: Do not frustumCull Debug LineSegments

## 0.8.1

### Patch Changes

- 3c0d18c: Fix missing React import in Debug

## 0.8.0

### Minor Changes

- 05bc714: Add `includeInvisible` flag to <RigidBody> (@RodrigoHamuy)
- c5a2e23: Switch to native Rapier debug renderer. (@alexandernanberg)

## 0.7.7

### Patch Changes

- 2dd45d1: fix: jsdoc for `setNextKinematicTranslation`
- 7f006ab: fix: play nice with strictmode
- 3469907: Fix some of the collider argument type hints

## 0.7.6

### Patch Changes

- 9ddbc90: Less frequent updating of props, rerenders should not cause updates

## 0.7.5

### Patch Changes

- 6ff5dbc: Add `massProperties` together with `mass` and `density`
- 3226cd1: Adapt to changes in THREE - rename [X]BufferGeometry to [X]Geometry
- f0b9a89: Allow control of `wakeUp` boolean when calling RigidBody api

## 0.7.4

### Patch Changes

- a0d0b71: Fix translation offsets for parent-less colliders
- a0d0b71: Accurately pass RigidBody options to custom colliders

## 0.7.3

### Patch Changes

- 5a6c822: fix: prefer bare imports to three

## 0.7.2

### Patch Changes

- 7c14e3c: Reduce rerendering of RigidBodies
- d93b21b: Less rerenders in InstancedRigidBodies
- f92d017: **New:** The `timeStep` prop can now be set to `"vary"` to adjust the time step to every frame's delta time.

## 0.7.1

### Patch Changes

- 36328f7: Fix InstancedRigidBodies not passing options to colliders

## 0.7.0

### Minor Changes

- 7cf2f59: Refactor of entire component structure for more control and maintainability

### Patch Changes

- 7cf2f59: Nested transforms are now accurately converted to RigidBody localspace
- 7cf2f59: Add support for `density` and `sensor` props on Collider and RigidBody
- 7cf2f59: Import `mergeVertices` from `three-stdlib` for better support
- 7cf2f59: Mutable component props now propagate without needing a refresh, adding support for HMR, and removing the need to use API when doing simple setups and updates
- 7cf2f59: Updates to main loop, simplifying and reducing call overhead
- 7cf2f59: RigidBody transform interpolation now works as expected

## 0.6.9

### Patch Changes

- 720b03d: Add collision events to individual Colliders (@hmans)
- 6109dcf: Export RigidBodyProps and XXXColliderProps
- 980a53d: Adds the `<Physics updatePriority={...}>` prop, allowing the user to configure the update priority at which to run the components update loop. (@hmans)
- 5de1f77: The physics world stepping would needlessly catch up all the time missed while the host application was suspended in a background tab. This has been fixed. (@hmans)

## 0.6.8

### Patch Changes

- 1aa19da: Fix collision events ignoring the first created RigidBody
- 7529b96: `api.setRotation()` and `api.setNextKinematicRotation()` now expects a Quaternion argument, to equal the return from `api.rotation()` and coincide with `rapier`s base api

## 0.6.7

### Patch Changes

- 4ec57f6: Fixed rigidbodies should still update the position of their meshes
- 84aa8bc: Fix HeighfieldCollider
- 84aa8bc: Fix RoundCuboidCollider
- 84aa8bc: All colliders have more accurate debug shapes
- 84aa8bc: You can now set the wireframe active and sleep color for Debug

## 0.6.6

### Patch Changes

- 77635c4: feat: allow object3d props through RigidBody (@Glavin001)
- e229bd2: Disable problematic translation interpolation for now
- 31da80f: fix: fix crash for non-indexed trimeshes by applying `mergeVertices` from `BufferGeometryUtils` (@machado2)

## 0.6.5

### Patch Changes

- e71ea11: World no longer crashes when `<Physics />` is reinitiated
- e71ea11: Fixed timestep (inspired by cannon-es), with interpolation, for simulation determinism

## 0.6.4

### Patch Changes

- 49fd0a2: Make `paused` optional

## 0.6.3

### Patch Changes

- 8f635ea: Collider components allowed in <InstancedRigidBodies> which allows combound shape creation
- 8f635ea: Add `paused` to <Physics /> to allow pausing
- f1abe81: feat(RigidBody): add linear and angular damping methods to api and props to RigidBody

## 0.6.2

### Patch Changes

- 616fdda: Add `scales` to `InstancedRigidBodies` for setting scales of the instances

## 0.6.1

### Patch Changes

- 3133e42: Fix broken React import

## 0.6.0

### Minor Changes

- bb4788a: InstancedMesh support, using InstancedRigidBodies ✨

### Patch Changes

- bb4788a: Improved core with less operations during update loop

## 0.5.2

### Patch Changes

- 2b16541: Fix colliders with initial rotations
- 2b16541: Allow shape Colliders to be created outside RigidBodies

## 0.5.1

### Patch Changes

- c36be39: Add MeshCollider, allowing more fine control over automatic collider creation

## 0.5.0

### Minor Changes

- a3be5f6: Remove hooks api in favor of better fleshed out components

### Patch Changes

- a3be5f6: Update types for Joints -- now only allow RefObjects of RigidBodyApi
- a3be5f6: Fix setKinematicRotation (convert Vector3 to Quaternion)
- a3be5f6: Update to @dimforge/rapier3d-compat@0.9.0
- a3be5f6: Allow setting the physics timeStep
- a3be5f6: Add rotational and transitional constraits to RigidBody
- a3be5f6: Allow updating the gravity at runtime

## 0.4.3

### Patch Changes

- f7a8a2d: Rigid body creation hooks should not use auto colliders
- 663eeb5: Fix default collider setting

## 0.4.2

### Patch Changes

- 387b32c: Add restitution and friction as props for auto-generated colliders on RigidBody

## 0.4.1

### Patch Changes

- bb7a269: Add useful proxied api methods to rigidbody

## 0.4.0

### Minor Changes

- dd535aa: Update to @dimforge/rapier3d-compat@0.8.1, pinned version

### Patch Changes

- dd535aa: Better <Physics /> lifecycle making reinitialization more stable

## 0.3.1

### Patch Changes

- 37d2621: Pin rapier3d version to 0.8.0-alpha.2

## 0.3.0

### Minor Changes

- 7e36172: Add collision and sleep/awake events

## 0.2.0

### Minor Changes

- 584ce08: Expose joint api, however no joint is returned when created (rapier bug?)

### Patch Changes

- 584ce08: All parts now uses a more rigid initiation process
- 584ce08: Apply bounding box offset for auto colliders
- 584ce08: Use single update loop instead of individual rigid body callbacks

## 0.1.2

### Patch Changes

- 4f7440c: fix: make global colliders setting progate to children

## 0.1.1

### Patch Changes

- 260e6d1: Fix Physics "colliders" value not being applied in children by default

## 0.1.0

### Minor Changes

- First release with base functionality of RigidBodies in Rapier
