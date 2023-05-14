import {
  Collider,
  ColliderDesc,
  DebugRenderBuffers,
  ImpulseJoint,
  JointData,
  RigidBody,
  RigidBodyDesc,
  World
} from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";

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

export const createWorldApi = (getWorld: () => World): WorldApi => {
  return {
    raw: () => getWorld(),
    getCollider: (handle) => getWorld().getCollider(handle),
    getRigidBody: (handle) => getWorld().getRigidBody(handle),
    createRigidBody: (desc) => getWorld().createRigidBody(desc),
    createCollider: (desc, rigidBody) =>
      getWorld().createCollider(desc, rigidBody),
    removeRigidBody: (rigidBody) => {
      if (!getWorld().bodies.contains(rigidBody.handle)) return;

      getWorld().removeRigidBody(rigidBody);
    },
    removeCollider: (collider, wakeUp = true) => {
      if (!getWorld().colliders.contains(collider.handle)) return;

      getWorld().removeCollider(collider, wakeUp);
    },
    createImpulseJoint: (params, rigidBodyA, rigidBodyB, wakeUp = true) =>
      getWorld().createImpulseJoint(params, rigidBodyA, rigidBodyB, wakeUp),
    removeImpulseJoint: (joint, wakeUp = true) => {
      if (!getWorld().impulseJoints.contains(joint.handle)) return;

      getWorld().removeImpulseJoint(joint, wakeUp);
    },
    forEachCollider: (callback: (collider: Collider) => void) =>
      getWorld().forEachCollider(callback),
    setGravity: ({ x, y, z }) => (getWorld().gravity = { x, y, z }),
    debugRender: () => getWorld().debugRender()
  };
};
