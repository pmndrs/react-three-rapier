# @react-three/rapier

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
