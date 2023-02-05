import {
  Collider,
  ColliderDesc,
  DebugRenderBuffers,
  ImpulseJoint,
  JointData,
  PrismaticImpulseJoint,
  RigidBody,
  RigidBodyDesc,
  World
} from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";
import { RefGetter, RigidBodyTypeString, Vector3Object } from "../types";

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
  debugRender(): DebugRenderBuffers;
}

export const createWorldApi = (ref: RefGetter<World>): WorldApi => {
  return {
    raw: () => ref.current()!,
    getCollider: (handle) => ref.current()!.getCollider(handle),
    getRigidBody: (handle) => ref.current()!.getRigidBody(handle),
    createRigidBody: (desc) => ref.current()!.createRigidBody(desc),
    createCollider: (desc, rigidBody) =>
      ref.current()!.createCollider(desc, rigidBody),
    removeRigidBody: (rigidBody) => {
      if (!ref.current()!.bodies.contains(rigidBody.handle)) return;

      ref.current()!.removeRigidBody(rigidBody);
    },
    removeCollider: (collider, wakeUp = true) => {
      if (!ref.current()!.colliders.contains(collider.handle)) return;

      ref.current()!.removeCollider(collider, wakeUp);
    },
    createImpulseJoint: (params, rigidBodyA, rigidBodyB, wakeUp = true) =>
      ref.current()!.createImpulseJoint(params, rigidBodyA, rigidBodyB, wakeUp),
    removeImpulseJoint: (joint, wakeUp = true) => {
      if (!ref.current()!.impulseJoints.contains(joint.handle)) return;

      ref.current()!.removeImpulseJoint(joint, wakeUp);
    },
    forEachCollider: (callback: (collider: Collider) => void) =>
      ref.current()!.forEachCollider(callback),
    setGravity: ({ x, y, z }) => (ref.current()!.gravity = { x, y, z }),
    debugRender: () => ref.current()!.debugRender()
  };
};
