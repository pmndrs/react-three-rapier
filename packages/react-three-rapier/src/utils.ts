import { Collider, ColliderDesc, World } from "@dimforge/rapier3d-compat";
import React from "react";
import { Mesh, Object3D, Quaternion, Vector3 } from "three/src/Three";
import {
  RapierRigidBody,
  RigidBodyAutoCollider,
  RigidBodyTypeString,
  Vector3Array,
} from "./types";

export const vectorArrayToObject = (arr: Vector3Array) => {
  const [x, y, z] = arr;
  return { x, y, z };
};

const rigidBodyTypeMap: {
  [key: string]: number;
} = {
  fixed: 1,
  dynamic: 0,
  kinematicPosition: 2,
  kinematicVelocity: 3,
};

export const rigidBodyTypeFromString = (type: RigidBodyTypeString) =>
  rigidBodyTypeMap[type];

export const createCollidersFromChildren = (
  object: Object3D,
  rigidBody: RapierRigidBody,
  type: RigidBodyAutoCollider,
  world: World
) => {
  const colliders: Collider[] = [];

  object.traverse((child: Object3D | Mesh) => {
    if ("isMesh" in child) {
      const { geometry } = child;
      const { x, y, z } = child.position;
      const { x: rx, y: ry, z: rz, w: rw } = new Quaternion().setFromEuler(
        child.rotation
      );
      const scale = child.getWorldScale(new Vector3());

      let desc: ColliderDesc;

      switch (type) {
        case RigidBodyAutoCollider.Cuboid:
          {
            geometry.computeBoundingBox();
            const { boundingBox } = geometry;

            const size = boundingBox!.getSize(new Vector3());

            desc = ColliderDesc.cuboid(
              (size.x / 2) * scale.x,
              (size.y / 2) * scale.y,
              (size.z / 2) * scale.z
            );
          }
          break;

        case RigidBodyAutoCollider.Ball:
          {
            geometry.computeBoundingSphere();
            const { boundingSphere } = geometry;

            const radius = boundingSphere!.radius * scale.x;

            desc = ColliderDesc.ball(radius);
          }
          break;

        case RigidBodyAutoCollider.Trimesh:
          {
            const g = geometry.clone().scale(scale.x, scale.y, scale.z);

            desc = ColliderDesc.trimesh(
              g.attributes.position.array as Float32Array,
              g.index?.array as Uint32Array
            );
          }
          break;

        case RigidBodyAutoCollider.ConvexHull:
          const g = geometry.clone().scale(scale.x, scale.y, scale.z);

          {
            desc = ColliderDesc.convexHull(
              g.attributes.position.array as Float32Array
            ) as ColliderDesc;
          }
          break;
      }

      desc.setTranslation(x, y, z).setRotation({ x: rx, y: ry, z: rz, w: rw });

      const collider = world.createCollider(desc, rigidBody.handle);
      colliders.push(collider);
    }
  });

  return colliders;
};
