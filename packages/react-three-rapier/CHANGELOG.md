# @react-three/rapier

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
