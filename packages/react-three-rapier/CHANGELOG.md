# @react-three/rapier

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
