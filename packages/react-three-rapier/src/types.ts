import { MutableRefObject } from "react";

import {
  CoefficientCombineRule,
  Collider as RapierCollider,
  InteractionGroups,
  RigidBody as RapierRigidBody,
  TempContactManifold
} from "@dimforge/rapier3d-compat";
import {
  createColliderApi,
  createJointApi,
  createRigidBodyApi,
  createWorldApi
} from "./api";
import { ColliderProps } from ".";
import { Object3DProps } from "@react-three/fiber";
import { Object3D } from "three";

export { CoefficientCombineRule as CoefficientCombineRule } from "@dimforge/rapier3d-compat";
export { RapierRigidBody, RapierCollider };

export type RefGetter<T> = MutableRefObject<() => T | undefined>;

export type RigidBodyAutoCollider =
  | "ball"
  | "cuboid"
  | "hull"
  | "trimesh"
  | false;

export interface UseRigidBodyAPI {
  rigidBody: RapierRigidBody;
  collider: RapierCollider;
}

export type CuboidArgs = [
  halfWidth: number,
  halfHeight: number,
  halfDepth: number
];
export type BallArgs = [radius: number];
export type CapsuleArgs = [radius: number, height: number];
export type ConvexHullArgs = [vertices: ArrayLike<number>];
export type HeightfieldArgs = [
  width: number,
  height: number,
  heights: number[],
  scale: { x: number; y: number; z: number }
];
export type TrimeshArgs = [
  vertices: ArrayLike<number>,
  indices: ArrayLike<number>
];
export type PolylineArgs = [vertices: Float32Array, indices: Uint32Array];
export type RoundCuboidArgs = [
  halfWidth: number,
  halfHeight: number,
  halfDepth: number,
  borderRadius: number
];
export type CylinderArgs = [radius: number, height: number];
export type RoundCylinderArgs = [
  radius: number,
  height: number,
  borderRadius: number
];
export type ConeArgs = [radius: number, height: number];
export type RoundConeArgs = [
  radius: number,
  height: number,
  borderRadius: number
];
export type ConvexMeshArgs = [
  vertices: ArrayLike<number>,
  indices: ArrayLike<number>
];
export type RoundConvexHullArgs = [
  vertices: ArrayLike<number>,
  indices: ArrayLike<number>,
  borderRadius: number
];
export type RoundConvexMeshArgs = [
  vertices: ArrayLike<number>,
  indices: ArrayLike<number>,
  borderRadius: number
];

export type UseBodyOptions = Omit<UseRigidBodyOptions, "shape">;

export type RigidBodyTypeString =
  | "fixed"
  | "dynamic"
  | "kinematicPosition"
  | "kinematicVelocity";

export type ColliderShape =
  | "cuboid"
  | "trimesh"
  | "ball"
  | "capsule"
  | "convexHull"
  | "heightfield"
  | "polyline"
  | "roundCuboid"
  | "cylinder"
  | "roundCylinder"
  | "cone"
  | "roundCone"
  | "convexMesh"
  | "roundConvexHull"
  | "roundConvexMesh";

export type Vector3Array = [x: number, y: number, z: number];
export type Boolean3Array = [x: boolean, y: boolean, z: boolean];

export interface UseColliderOptions<ColliderArgs extends Array<unknown>> {
  /**
   * The shape of your collider
   */
  shape?: ColliderShape;

  /**
   * Arguments to pass to the collider
   */
  args?: ColliderArgs;

  /**
   * The mass of this collider.
   * The mass and density is automatically calculated based on the shape of the collider.
   * Generally, it's not recommended to adjust the mass properties as it could lead to
   * unexpected behaviors.
   * More info https://rapier.rs/docs/user_guides/javascript/colliders#mass-properties
   */
  mass?: number;

  /**
   * The center of mass of this rigid body
   */
  centerOfMass?: Vector3Array;

  /**
   * Principal angular inertia of this rigid body
   */
  principalAngularInertia?: Vector3Array;

  /**
   * Restitution controls how elastic (aka. bouncy) a contact is. Le elasticity of a contact is controlled by the restitution coefficient
   */
  restitution?: number;

  /**
   * What happens when two bodies meet. See https://rapier.rs/docs/user_guides/javascript/colliders#friction.
   */
  restitutionCombineRule?: CoefficientCombineRule;

  /**
   * Friction is a force that opposes the relative tangential motion between two rigid-bodies with colliders in contact.
   * A friction coefficient of 0 implies no friction at all (completely sliding contact) and a coefficient
   * greater or equal to 1 implies a very strong friction. Values greater than 1 are allowed.
   */
  friction?: number;

  /**
   * What happens when two bodies meet. See https://rapier.rs/docs/user_guides/javascript/colliders#friction.
   */
  frictionCombineRule?: CoefficientCombineRule;

  /**
   * The position of this collider relative to the rigid body
   */
  position?: Object3DProps["position"];

  /**
   * The rotation of this collider relative to the rigid body
   */
  rotation?: Object3DProps["rotation"];

  /**
   * The rotation, as a Quaternion, of this collider relative to the rigid body
   */
  quaternion?: Object3DProps["quaternion"];

  /**
   * The scale of this collider relative to the rigid body
   */
  scale?: Object3DProps["scale"];

  /**
   * Callback when this collider collides with another collider.
   */
  onCollisionEnter?: CollisionEnterHandler;

  /**
   * Callback when this collider stops colliding with another collider.
   */
  onCollisionExit?: CollisionExitHandler;

  /**
   * Callback when this collider, or another collider starts intersecting, and at least one of them is a `sensor`.
   */
  onIntersectionEnter?: IntersectionEnterHandler;

  /**
   * Callback when this, or another collider stops intersecting, and at least one of them is a `sensor`.
   */
  onIntersectionExit?: IntersectionExitHandler;

  /**
   * The bit mask configuring the groups and mask for collision handling.
   */
  collisionGroups?: InteractionGroups;

  /**
   * The bit mask configuring the groups and mask for solver handling.
   */
  solverGroups?: InteractionGroups;

  /**
   * Sets the uniform density of this collider.
   */
  density?: number;

  /**
   * Sets whether or not this collider is a sensor.
   */
  sensor?: boolean;
}

export type CollisionEnterPayload = {
  rigidBody?: RapierRigidBody;
  collider: RapierCollider;
  manifold: TempContactManifold;
  flipped: boolean;
  rigidBodyObject?: Object3D;
  colliderObject?: Object3D;
};

export type CollisionExitPayload = {
  rigidBody?: RapierRigidBody;
  collider: RapierCollider;
  rigidBodyObject?: Object3D;
  colliderObject?: Object3D;
};

export type IntersectionEnterPayload = CollisionExitPayload;

export type IntersectionExitPayload = CollisionExitPayload;

export type CollisionEnterHandler = (payload: CollisionEnterPayload) => void;

export type CollisionExitHandler = (payload: CollisionExitPayload) => void;

export type IntersectionEnterHandler = (
  payload: IntersectionEnterPayload
) => void;

export type IntersectionExitHandler = (
  payload: IntersectionExitPayload
) => void;

export interface UseRigidBodyOptions extends ColliderProps {
  /**
   * Specify the type of this rigid body
   */
  type?: RigidBodyTypeString;

  /** Whether or not this body can sleep.
   * default: true
   */
  canSleep?: boolean;

  /** The linear damping coefficient of this rigid-body.*/
  linearDamping?: number;

  /** The angular damping coefficient of this rigid-body.*/
  angularDamping?: number;

  /** The initial linear velocity of this body.
   * default: zero velocity
   */
  linearVelocity?: Vector3Array;

  /** The initial angular velocity of this body.
   * Default: zero velocity.
   */
  angularVelocity?: Vector3Array;

  /**
   * The scaling factor applied to the gravity affecting the rigid-body.
   * Default: 1.0
   */
  gravityScale?: number;

  /**
   * Whether or not Continous Collision Detection is enabled for this rigid-body.
   * https://rapier.rs/docs/user_guides/javascript/rigid_bodies#continuous-collision-detection
   * @default false
   */
  ccd?: boolean;

  /**
   * Initial position of the RigidBody
   */
  position?: Object3DProps["position"];

  /**
   * Initial rotation of the RigidBody
   */
  rotation?: Object3DProps["rotation"];

  /**
   * Automatically generate colliders based on meshes inside this
   * rigid body.
   *
   * You can change the default setting globally by setting the colliders
   * prop on the <Physics /> component.
   *
   * Setting this to false will disable automatic colliders.
   */
  colliders?: RigidBodyAutoCollider | false;

  /**
   * Set the friction of auto-generated colliders.
   * This does not affect any non-automatic child collider-components.
   */
  friction?: number;

  /**
   * Set the restitution (bounciness) of auto-generated colliders.
   * This does not affect any non-automatic child collider-components.
   */
  restitution?: number;

  /**
   * The default collision groups bitmask for all colliders in this rigid body.
   * Can be customized per-collider.
   */
  collisionGroups?: InteractionGroups;

  /**
   * The default solver groups bitmask for all colliders in this rigid body.
   * Can be customized per-collider.
   */
  solverGroups?: InteractionGroups;

  onSleep?(): void;

  onWake?(): void;

  /**
   * Locks all rotations that would have resulted from forces on the created rigid-body.
   */
  lockRotations?: boolean;

  /**
   * Locks all translations that would have resulted from forces on the created rigid-body.
   */
  lockTranslations?: boolean;

  /**
   * Allow rotation of this rigid-body only along specific axes.
   */
  enabledRotations?: Boolean3Array;

  /**
   * Allow rotation of this rigid-body only along specific axes.
   */
  enabledTranslations?: Boolean3Array;

  /**
   * Passed down to the object3d representing this collider.
   */
  userData?: Object3DProps["userData"];
}

// Joints
export type SphericalJointParams = [
  body1Anchor: Vector3Array,
  body2Anchor: Vector3Array
];

export type FixedJointParams = [
  body1Anchor: Vector3Array,
  body1LocalFrame: Vector3Array,
  body2Anchor: Vector3Array,
  body2LocalFrame: Vector3Array
];

export type PrismaticJointParams = [
  body1Anchor: Vector3Array,
  body1LocalFrame: Vector3Array,
  body2Anchor: Vector3Array,
  body2LocalFrame: Vector3Array
];

export type RevoluteJointParams = [
  body1Anchor: Vector3Array,
  body2Anchor: Vector3Array,
  axis: Vector3Array
];

export type RigidBodyApiRef = MutableRefObject<undefined | null | RigidBodyApi>;

export interface UseImpulseJoint<P> {
  (body1: RigidBodyApiRef, body2: RigidBodyApiRef, params: P): JointApi;
}

export type RigidBodyApi = ReturnType<typeof createRigidBodyApi>;
export type ColliderApi = ReturnType<typeof createColliderApi>;
export type WorldApi = ReturnType<typeof createWorldApi>;
export type JointApi = ReturnType<typeof createJointApi>;
