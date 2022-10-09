import {
  Collider,
  ColliderDesc,
  ImpulseJoint,
  JointData,
  PrismaticImpulseJoint,
  RigidBody,
  RigidBodyDesc,
  World
} from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";
import { RefGetter } from "./types";
import { rapierVector3ToVector3 } from "./utils";

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
  applyImpulse(impulseVector: Vector3Object, wakeUp?: boolean): void;
  /**
   * Applies an impulsive torque at the center-of-mass of this rigid-body.
   */
  applyTorqueImpulse(torqueVector: Vector3Object, wakeUp?: boolean): void;
  /**
   * Applies an impulse at the given world-space point of this rigid-body.
   */
  applyImpulseAtPoint(
    impulseVector: Vector3Object,
    impulsePoint: Vector3Object,
    wakeUp?: boolean
  ): void;

  /**
   * Adds a force at the center-of-mass of this rigid-body.
   */
  addForce(force: Vector3Object, wakeUp?: boolean): void;
  /**
   * Adds a force at the given world-space point of this rigid-body.
   */
  addForceAtPoint(
    force: Vector3Object,
    point: Vector3Object,
    wakeUp?: boolean
  ): void;

  /**
   * Adds a torque at the center-of-mass of this rigid-body.
   */
  addTorque(torque: Vector3Object, wakeUp?: boolean): void;

  /**
   * The world-space translation of this rigid-body.
   */
  translation(): Vector3;
  /**
   * Sets the translation of this rigid-body.
   */
  setTranslation(translation: Vector3Object, wakeUp?: boolean): void;

  /**
   * The world-space orientation of this rigid-body.
   */
  rotation(): Quaternion;
  /**
   * Sets the rotation quaternion of this rigid-body.
   */
  setRotation(rotation: Quaternion, wakeUp?: boolean): void;

  /**
   * The linear velocity of this rigid-body.
   */
  linvel(): Vector3;
  /**
   * Sets the linear velocity of this rigid-body.
   */
  setLinvel(velocity: Vector3Object, wakeUp?: boolean): void;

  /**
   * The angular velocity of this rigid-body.
   */
  angvel(): Vector3;
  /**
   * Sets the angular velocity of this rigid-body.
   */
  setAngvel(velocity: Vector3Object, wakeUp?: boolean): void;

  /**
   * The linear damping of this rigid-body.
   */
  linearDamping(): number;
  /**
   * Sets the linear damping factor applied to this rigid-body.
   */
  setLinearDamping(factor: number): void;

  /**
   * The angular damping of this rigid-body.
   */
  angularDamping(): number;
  /**
   * Sets the anugular damping factor applied to this rigid-body.
   */
  setAngularDamping(factor: number): void;

  /**
   * If this rigid body is kinematic, sets its future rotation after the next timestep integration.
   *
   * This should be used instead of rigidBody.setRotation to make the dynamic object interacting with this
   * kinematic body behave as expected. Internally, Rapier will compute an artificial velocity for this
   * rigid-body from its current position and its next kinematic position. This velocity will be used
   * to compute forces on dynamic bodies interacting with this body.
   */
  setNextKinematicRotation(rotation: Quaternion): void;
  /**
   * If this rigid body is kinematic, sets its future translation after the next timestep integration.
   *
   * This should be used instead of rigidBody.setTranslation to make the dynamic object interacting with
   * this kinematic body behave as expected. Internally, Rapier will compute an artificial velocity
   * for this rigid-body from its current position and its next kinematic position. This velocity
   * will be used to compute forces on dynamic bodies interacting with this body.
   */
  setNextKinematicTranslation(translation: Vector3Object): void;

  /**
   * Resets to zero the user forces (but not torques) applied to this rigid-body.
   */
  resetForces(wakeUp?: boolean): void;
  /**
   * Resets to zero the user torques applied to this rigid-body.
   */
  resetTorques(wakeUp?: boolean): void;

  /**
   * Locks or unlocks the ability of this rigid-body to rotate.
   */
  lockRotations(locked: boolean, wakeUp?: boolean): void;

  /**
   * Locks or unlocks the ability of this rigid-body to translate.
   */
  lockTranslations(locked: boolean, wakeUp?: boolean): void;

  /**
   * Locks or unlocks the ability of this rigid-body to rotate along individual coordinate axes.
   */
  setEnabledRotations(
    x: boolean,
    y: boolean,
    z: boolean,
    wakeUp?: boolean
  ): void;

  /**
   * Locks or unlocks the ability of this rigid-body to translate along individual coordinate axes.
   */
  setEnabledTranslations(
    x: boolean,
    y: boolean,
    z: boolean,
    wakeUp?: boolean
  ): void;
}

export const createRigidBodyApi = (ref: RefGetter<RigidBody>): RigidBodyApi => {
  return {
    raw: () => ref.current()!,
    get handle() {
      return ref.current()!.handle;
    },
    mass: () => ref.current()!.mass(),

    applyImpulse(impulseVector, wakeUp = true) {
      ref.current()!.applyImpulse(impulseVector, wakeUp);
    },
    applyTorqueImpulse(torqueVector, wakeUp = true) {
      ref.current()!.applyTorqueImpulse(torqueVector, wakeUp);
    },
    applyImpulseAtPoint: (impulseVector, impulsePoint, wakeUp = true) =>
      ref.current()!.applyImpulseAtPoint(impulseVector, impulsePoint, wakeUp),

    addForce: (force, wakeUp = true) => ref.current()!.addForce(force, wakeUp),
    addForceAtPoint: (force, point, wakeUp = true) =>
      ref.current()!.addForceAtPoint(force, point, wakeUp),

    addTorque: (torque, wakeUp = true) =>
      ref.current()!.addTorque(torque, wakeUp),

    translation() {
      return rapierVector3ToVector3(ref.current()!.translation());
    },
    setTranslation: (translation, wakeUp = true) =>
      ref.current()!.setTranslation(translation, wakeUp),
    rotation() {
      const { x, y, z, w } = ref.current()!.rotation();
      return new Quaternion(x, y, z, w);
    },
    setRotation: (rotation, wakeUp = true) => {
      ref.current()!.setRotation(rotation, wakeUp);
    },
    linvel() {
      const { x, y, z } = ref.current()!.linvel();
      return new Vector3(x, y, z);
    },
    setLinvel: (velocity, wakeUp = true) =>
      ref.current()!.setLinvel(velocity, wakeUp),
    angvel() {
      const { x, y, z } = ref.current()!.angvel();
      return new Vector3(x, y, z);
    },
    setAngvel: (velocity, wakeUp = true) =>
      ref.current()!.setAngvel(velocity, wakeUp),

    linearDamping() {
      return ref.current()!.linearDamping();
    },

    setLinearDamping: (factor) => ref.current()!.setLinearDamping(factor),

    angularDamping() {
      return ref.current()!.angularDamping();
    },

    setAngularDamping: (factor) => ref.current()!.setAngularDamping(factor),

    setNextKinematicRotation: (rotation) => {
      ref.current()!.setNextKinematicRotation(rotation);
    },
    setNextKinematicTranslation: (translation) =>
      ref.current()!.setNextKinematicTranslation(translation),

    resetForces: (wakeUp = true) => ref.current()!.resetForces(wakeUp),
    resetTorques: (wakeUp = true) => ref.current()!.resetTorques(wakeUp),

    lockRotations: (locked, wakeUp = true) =>
      ref.current()!.lockRotations(locked, wakeUp),
    lockTranslations: (locked, wakeUp = true) =>
      ref.current()!.lockTranslations(locked, wakeUp),

    setEnabledRotations: (x, y, z, wakeUp = true) =>
      ref.current()!.setEnabledRotations(x, y, z, wakeUp),
    setEnabledTranslations: (x, y, z, wakeUp = true) =>
      ref.current()!.setEnabledTranslations(x, y, z, wakeUp)
  };
};

export interface InstancedRigidBodyApi {
  at(index: number): RigidBodyApi;
  get count(): number;
  forEach(
    callback: (body: RigidBodyApi, index: number, array: RigidBodyApi[]) => void
  ): void;
}

export const createInstancedRigidBodiesApi = (
  bodiesGetter: RefGetter<{ rigidBody: RigidBody; api: RigidBodyApi }[]>
): InstancedRigidBodyApi => ({
  at: (index: number) => bodiesGetter.current()![index].api,
  forEach(callback) {
    return bodiesGetter
      .current()!
      .map((b) => b.api)
      .forEach(callback);
  },
  get count() {
    return bodiesGetter.current()!.length;
  }
});

// TODO: Flesh this out
export const createColliderApi = (ref: RefGetter<Collider>) => {
  return {
    raw: () => ref.current(),
    get handle() {
      return ref.current()!.handle;
    }
  };
};

export interface WorldApi {
  raw(): World;
  getCollider(handle: number): Collider | undefined;
  getRigidBody(handle: number): RigidBody | undefined;
  createRigidBody(desc: RigidBodyDesc): RigidBody;
  createCollider(desc: ColliderDesc, parent?: RigidBody): Collider;
  removeRigidBody(rigidBody: RigidBody): void;
  removeCollider(collider: Collider, wakeUp?: boolean): void;
  createImpulseJoint(
    params: JointData,
    rigidBodyA: RigidBody,
    rigidBodyB: RigidBody,
    wakeUp?: boolean
  ): ImpulseJoint;
  removeImpulseJoint(joint: ImpulseJoint, wakeUp?: boolean): void;
  forEachCollider(callback: (collider: Collider) => void): void;
  setGravity(gravity: Vector3): void;
}

export const createWorldApi = (ref: RefGetter<World>): WorldApi => {
  return {
    raw: () => ref.current()!,
    getCollider: (handle) => ref.current()!.getCollider(handle),
    getRigidBody: (handle) => ref.current()!.getRigidBody(handle),
    createRigidBody: (desc) => ref.current()!.createRigidBody(desc),
    createCollider: (desc, rigidBody) =>
      ref.current()!.createCollider(desc, rigidBody),
    removeRigidBody: (rigidBody) => ref.current()!.removeRigidBody(rigidBody),
    removeCollider: (collider, wakeUp = true) =>
      ref.current()!.removeCollider(collider, wakeUp),
    createImpulseJoint: (params, rigidBodyA, rigidBodyB, wakeUp = true) =>
      ref.current()!.createImpulseJoint(params, rigidBodyA, rigidBodyB, wakeUp),
    removeImpulseJoint: (joint, wakeUp = true) =>
      ref.current()!.removeImpulseJoint(joint, wakeUp),
    forEachCollider: (callback: (collider: Collider) => void) =>
      ref.current()!.forEachCollider(callback),
    setGravity: ({ x, y, z }) => (ref.current()!.gravity = { x, y, z })
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
      )
  };
};
