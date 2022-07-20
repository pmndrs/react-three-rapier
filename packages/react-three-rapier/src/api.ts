import {
  Collider,
  ColliderDesc,
  ImpulseJoint,
  JointData,
  PrismaticImpulseJoint,
  RigidBody,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";
import { RefGetter } from "./types";
import { vector3ToQuaternion } from "./utils";

type Vector3Object = { x: number; y: number; z: number };

export interface RigidBodyApi {
  /**
   * Get the raw RigidBody
   */
  raw(): RigidBody;

  /**
   * The handle of this RigidBody
   */
  handle: number;

  /**
   * The mass of this rigid-body.
   */
  mass(): number;

  /**
   * Applies an impulse at the center-of-mass of this rigid-body.
   */
  applyImpulse(impulseVector: Vector3Object): void;
  /**
   * Applies an impulsive torque at the center-of-mass of this rigid-body.
   */
  applyTorqueImpulse(torqueVector: Vector3Object): void;
  /**
   * Applies an impulse at the given world-space point of this rigid-body.
   */
  applyImpulseAtPoint(
    impulseVector: Vector3Object,
    impulsePoint: Vector3Object
  ): void;

  /**
   * Adds a force at the center-of-mass of this rigid-body.
   */
  addForce(force: Vector3Object): void;
  /**
   * Adds a force at the given world-space point of this rigid-body.
   */
  addForceAtPoint(force: Vector3Object, point: Vector3Object): void;

  /**
   * Adds a torque at the center-of-mass of this rigid-body.
   */
  addTorque(torque: Vector3Object): void;

  /**
   * The world-space translation of this rigid-body.
   */
  translation(): Vector3;
  /**
   * Sets the translation of this rigid-body.
   */
  setTranslation(translation: Vector3Object): void;

  /**
   * The world-space orientation of this rigid-body.
   */
  rotation(): Quaternion;
  /**
   * Sets the rotation quaternion of this rigid-body.
   */
  setRotation(rotation: Vector3Object): void;

  /**
   * The linear velocity of this rigid-body.
   */
  linvel(): Vector3;
  /**
   * Sets the linear velocity of this rigid-body.
   */
  setLinvel(velocity: Vector3Object): void;

  /**
   * The angular velocity of this rigid-body.
   */
  angvel(): Vector3;
  /**
   * Sets the angular velocity of this rigid-body.
   */
  setAngvel(velocity: Vector3Object): void;

  /**
   * If this rigid body is kinematic, sets its future rotation after the next timestep integration.
   *
   * This should be used instead of rigidBody.setRotation to make the dynamic object interacting with this
   * kinematic body behave as expected. Internally, Rapier will compute an artificial velocity for this
   * rigid-body from its current position and its next kinematic position. This velocity will be used
   * to compute forces on dynamic bodies interacting with this body.
   */
  setNextKinematicRotation(rotation: Vector3Object): void;
  /**
   * If this rigid body is kinematic, sets its future rotation after the next timestep integration.
   *
   * This should be used instead of rigidBody.setRotation to make the dynamic object interacting with
   *  this kinematic body behave as expected. Internally, Rapier will compute an artificial velocity
   *  for this rigid-body from its current position and its next kinematic position. This velocity
   *  will be used to compute forces on dynamic bodies interacting with this body.
   */
  setNextKinematicTranslation(translation: Vector3Object): void;

  /**
   * Resets to zero the user forces (but not torques) applied to this rigid-body.
   */
  resetForces(): void;
  /**
   * Resets to zero the user torques applied to this rigid-body.
   */
  resetTorques(): void;

  /**
   * Locks or unlocks the ability of this rigid-body to rotate.
   */
  lockRotations(locked: boolean): void;

  /**
   * Locks or unlocks the ability of this rigid-body to translate.
   */
  lockTranslations(locked: boolean): void;

  /**
   * Locks or unlocks the ability of this rigid-body to rotate along individual coordinate axes.
   */
  setEnabledRotations(x: boolean, y: boolean, z: boolean): void;

  /**
   * Locks or unlocks the ability of this rigid-body to translate along individual coordinate axes.
   */
  setEnabledTranslations(x: boolean, y: boolean, z: boolean): void;
}

export const createRigidBodyApi = (ref: RefGetter<RigidBody>): RigidBodyApi => {
  return {
    raw: () => ref.current()!,
    get handle() {
      return ref.current()!.handle;
    },
    mass: () => ref.current()!.mass(),

    applyImpulse(impulseVector) {
      ref.current()!.applyImpulse(impulseVector, true);
    },
    applyTorqueImpulse(torqueVector) {
      ref.current()!.applyTorqueImpulse(torqueVector, true);
    },
    applyImpulseAtPoint: (impulseVector, impulsePoint) =>
      ref.current()!.applyImpulseAtPoint(impulseVector, impulsePoint, true),

    addForce: (force) => ref.current()!.addForce(force, true),
    addForceAtPoint: (force, point) =>
      ref.current()!.addForceAtPoint(force, point, true),

    addTorque: (torque) => ref.current()!.addTorque(torque, true),

    translation() {
      const { x, y, z } = ref.current()!.translation();
      return new Vector3(x, y, z);
    },
    setTranslation: (translation) =>
      ref.current()!.setTranslation(translation, true),
    rotation() {
      const { x, y, z, w } = ref.current()!.rotation();
      return new Quaternion(x, y, z, w);
    },
    setRotation: ({ x, y, z }) => {
      const q = vector3ToQuaternion(new Vector3(x, y, z));
      ref.current()!.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    },
    linvel() {
      const { x, y, z } = ref.current()!.linvel();
      return new Vector3(x, y, z);
    },
    setLinvel: (velocity) => ref.current()!.setLinvel(velocity, true),
    angvel() {
      const { x, y, z } = ref.current()!.angvel();
      return new Vector3(x, y, z);
    },
    setAngvel: (velocity) => ref.current()!.setAngvel(velocity, true),

    setNextKinematicRotation: ({ x, y, z }) => {
      const q = vector3ToQuaternion(new Vector3(x, y, z));
      ref
        .current()!
        .setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    },
    setNextKinematicTranslation: (translation) =>
      ref.current()!.setNextKinematicTranslation(translation),

    resetForces: () => ref.current()!.resetForces(true),
    resetTorques: () => ref.current()!.resetTorques(true),

    lockRotations: (locked) => ref.current()!.lockRotations(locked, true),
    lockTranslations: (locked) => ref.current()!.lockTranslations(locked, true),

    setEnabledRotations: (x, y, z) =>
      ref.current()!.setEnabledRotations(x, y, z, true),
    setEnabledTranslations: (x, y, z) =>
      ref.current()!.setEnabledTranslations(x, y, z, true),
  };
};

// TODO: Flesh this out
export const createColliderApi = (ref: RefGetter<Collider>) => {
  return {
    raw: () => ref.current(),
    get handle() {
      return ref.current()!.handle;
    },
  };
};

export interface WorldApi {
  raw(): World;
  getCollider(handle: number): Collider | undefined;
  getRigidBody(handle: number): RigidBody | undefined;
  createRigidBody(desc: RigidBodyDesc): RigidBody;
  createCollider(desc: ColliderDesc, parent?: RigidBody): Collider;
  removeRigidBody(rigidBody: RigidBody): void;
  removeCollider(collider: Collider): void;
  createImpulseJoint(
    params: JointData,
    rigidBodyA: RigidBody,
    rigidBodyB: RigidBody
  ): ImpulseJoint;
  removeImpulseJoint(joint: ImpulseJoint): void;
  forEachCollider(callback: (collider: Collider) => void): void;
  setGravity(gravity: Vector3): void;
}

export const createWorldApi = (ref: RefGetter<World>): WorldApi => {
  return {
    raw: () => ref.current()!,
    getCollider: (handle: number) => ref.current()!.getCollider(handle),
    getRigidBody: (handle: number) => ref.current()!.getRigidBody(handle),
    createRigidBody: (desc: RigidBodyDesc) =>
      ref.current()!.createRigidBody(desc),
    createCollider: (desc: ColliderDesc, rigidBody: RigidBody) =>
      ref.current()!.createCollider(desc, rigidBody),
    removeRigidBody: (rigidBody: RigidBody) =>
      ref.current()!.removeRigidBody(rigidBody),
    removeCollider: (collider: Collider) =>
      ref.current()!.removeCollider(collider, true),
    createImpulseJoint: (
      params: JointData,
      rigidBodyA: RigidBody,
      rigidBodyB: RigidBody
    ) =>
      ref.current()!.createImpulseJoint(params, rigidBodyA, rigidBodyB, true),
    removeImpulseJoint: (joint: ImpulseJoint) =>
      ref.current()!.removeImpulseJoint(joint, true),
    forEachCollider: (callback: (collider: Collider) => void) =>
      ref.current()!.forEachCollider(callback),
    setGravity: ({ x, y, z }: Vector3) =>
      (ref.current()!.gravity = { x, y, z }),
  };
};

// TODO: Broken currently, waiting for Rapier3D to fix
export const createJointApi = (ref: RefGetter<ImpulseJoint>) => {
  return {
    raw: () => ref.current(),
    get handle() {
      return ref.current()!.handle;
    },
    configureMotorPosition: (
      targetPos: number,
      stiffness: number,
      damping: number
    ) =>
      (ref.current()! as PrismaticImpulseJoint).configureMotorPosition(
        targetPos,
        stiffness,
        damping
      ),
    configureMotorVelocity: (targetVel: number, damping: number) =>
      (ref.current()! as PrismaticImpulseJoint).configureMotorVelocity(
        targetVel,
        damping
      ),
  };
};
