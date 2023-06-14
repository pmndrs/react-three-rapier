<!-- omit from toc -->

# @React-Three/Rapier-Addons

This package contains a collection of helpers and extensions to for use with [@react-three/rapier](https://github.com/pmndrs/react-three-rapier).

---

<!-- omit from toc -->

## Addons index

- [Attractors](#attractors)
  - [🖼 Attractors Example](#-attractors-example)

---

### Attractors

An attractor simulates a source of gravity. Any `RigidBody` within range will be _pulled_ (attracted) toward the attractor.  
Setting the `strength` to a negative value will cause the `RigidBody` to be _pushed_ (repelled) away from the attractor.

The force applied to rigid-bodies within range is calculated differently depending on the `type`.

```tsx
type AttractorProps = {
  /**
   * The relative position of this attractor
   */
  position?: Object3DProps["position"];

  /**
   * The strength of the attractor.
   * Positive values attract, negative values repel.
   *
   * @defaultValue 1
   */
  strength?: number;

  /**
   * The range of the attractor. Will not affect objects outside of this range.
   *
   * @defaultValue 10
   * @min 0
   */
  range?: number;

  /**
   * The type of gravity to use.
   * - static: The gravity is constant and does not change over time.
   * - linear: The gravity is linearly interpolated the closer the object is to the attractor.
   * - newtonian: The gravity is calculated using the newtonian gravity formula.
   * @defaultValue "static"
   */
  type?: string;

  /**
   * The mass of the attractor. Used when type is `newtonian`.
   * @defaultValue 6.673e-11
   */
  gravitationalConstant?: number;

  /**
   * The collision groups that this attractor will apply effects to. If a RigidBody contains one or more colliders that are in one of the mask group, it will be affected by this attractor.
   * If not specified, the attractor will apply effects to all RigidBodies.
   */
  collisionGroups?: InteractionGroups;
};
```

a

```tsx
import { Attractor } from "@react-three/rapier-addons"

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

#### 🖼 Attractors Example

<a href="https://codesandbox.io/s/react-three-rapier-attractors-oyj640"><img src="https://raw.githubusercontent.com/pmndrs/react-three-rapier/HEAD/packages/react-three-rapier/misc/example-attractors.jpg" width="240" /></a>
