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
import { MutableRefObject } from "react";
import { Quaternion, Vector3 } from "three";
import { RefGetter } from "./types";

// TODO: Flesh this out
export const createRigidBodyApi = (ref: RefGetter<RigidBody>) => {
  return {
    raw: () => ref.current(),
    get handle() {
      return ref.current()!.handle;
    },
    applyImpulse({ x, y, z }: Vector3) {
      ref.current()!.applyImpulse({ x, y, z }, true);
    },
    applyTorqueImpulse({ x, y, z }: Vector3) {
      ref.current()!.applyTorqueImpulse({ x, y, z }, true);
    },
    translation() {
      const { x, y, z } = ref.current()!.translation();
      return new Vector3(x, y, z);
    },
    rotation() {
      const { x, y, z, w } = ref.current()!.rotation();
      return new Quaternion(x, y, z, w);
    },
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

export const createWorldApi = (ref: RefGetter<World>) => {
  return {
    raw: () => ref.current(),
    getCollider: (handle: number) => ref.current()!.getCollider(handle),
    getRigidBody: (handle: number) => ref.current()!.getRigidBody(handle),
    createRigidBody: (desc: RigidBodyDesc) =>
      ref.current()!.createRigidBody(desc),
    createCollider: (desc: ColliderDesc, rigidBodyHandle: number) =>
      ref.current()!.createCollider(desc, rigidBodyHandle),
    removeRigidBody: (rigidBody: RigidBody) =>
      ref.current()!.removeRigidBody(rigidBody),
    removeCollider: (collider: Collider) =>
      ref.current()!.removeCollider(collider, true),
    createImpulseJoint: (
      params: JointData,
      rigidBodyA: RigidBody,
      rigidBodyB: RigidBody
    ) => ref.current()!.createImpulseJoint(params, rigidBodyA, rigidBodyB),
    removeImpulseJoint: (joint: ImpulseJoint) =>
      ref.current()!.removeImpulseJoint(joint, true),
    forEachCollider: (callback: (collider: Collider) => void) =>
      ref.current()!.forEachCollider(callback),
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
