import React from "react";

import {
  CoefficientCombineRule,
  Collider,
  ColliderDesc,
  World,
} from "@dimforge/rapier3d-compat";

import { Mesh, Object3D, Quaternion, Vector3 } from "three/src/Three";
import {
  RapierRigidBody,
  RigidBodyAutoCollider,
  RigidBodyShape,
  RigidBodyTypeString,
  UseColliderOptions,
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

export const scaleColliderArgs = (
  shape: RigidBodyShape,
  args: (number | ArrayLike<number>)[],
  scale: Vector3
) => {
  // Heightfield only scales the last arg
  const newArgs = args.slice();

  if (shape === "heightfield") {
    (newArgs[3] as number) *= scale.x;
    return newArgs;
  }

  // Trimesh and convex scale the vertices
  if (shape === "trimesh" || shape === "convexHull") {
    newArgs[0] = scaleVertices(newArgs[0] as ArrayLike<number>, scale);
    return newArgs;
  }

  const scaleArray = [scale.x, scale.y, scale.z];
  return newArgs.map((arg, index) => scaleArray[index] * (arg as number));
};

export const createColliderFromOptions = <A>(
  options: UseColliderOptions<A>,
  world: World,
  body: RapierRigidBody,
  scale = { x: 1, y: 1, z: 1 }
) => {
  const mass = options?.mass || 1;
  const colliderShape = options?.shape ?? "cuboid";
  const colliderArgs = options?.args ?? [];
  const [cmx, cmy, cmz] = options?.centerOfMass || [0, 0, 0];
  const [pix, piy, piz] = options?.principalAngularInertia || [
    mass * 0.2,
    mass * 0.2,
    mass * 0.2,
  ];
  const [x, y, z] = options?.position || [0, 0, 0];
  const [rx, ry, rz] = options?.rotation || [0, 0, 0];

  // @ts-ignore
  const scaledArgs = scaleColliderArgs(options.shape, colliderArgs, scale);

  let colliderDesc = (ColliderDesc[colliderShape](
    // @ts-ignore
    ...scaledArgs
  ) as ColliderDesc)
    .setTranslation(x * scale.x, y * scale.y, z * scale.z)
    .setRotation({ x: rx, y: ry, z: rz, w: 1 })
    .setRestitution(options?.restitution ?? 0)
    .setRestitutionCombineRule(
      options?.restitutionCombineRule ?? CoefficientCombineRule.Average
    )
    .setFriction(options?.friction ?? 0.7)
    .setFrictionCombineRule(
      options?.frictionCombineRule ?? CoefficientCombineRule.Average
    );

  // If any of the mass properties are specified, add mass properties
  if (
    options?.mass ||
    options?.centerOfMass ||
    options?.principalAngularInertia
  ) {
    colliderDesc.setDensity(0);
    colliderDesc.setMassProperties(
      mass,
      { x: cmx, y: cmy, z: cmz },
      { x: pix, y: piy, z: piz },
      { x: 0, y: 0, z: 0, w: 1 }
    );
  }

  const collider = world.createCollider(colliderDesc, body.handle);

  return collider;
};

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

      // We translate the colliders based on the parent's world scale
      const parentWorldScale = child.parent!.getWorldScale(new Vector3());

      desc
        .setTranslation(
          x * parentWorldScale.x,
          y * parentWorldScale.y,
          z * parentWorldScale.z
        )
        .setRotation({ x: rx, y: ry, z: rz, w: rw });

      const collider = world.createCollider(desc, rigidBody.handle);
      colliders.push(collider);
    }
  });

  return colliders;
};

export const scaleVertices = (vertices: ArrayLike<number>, scale: Vector3) => {
  const scaledVerts = Array.from(vertices);

  for (let i = 0; i < vertices.length / 3; i++) {
    scaledVerts[i * 3] *= scale.x;
    scaledVerts[i * 3 + 1] *= scale.y;
    scaledVerts[i * 3 + 2] *= scale.z;
  }

  return scaledVerts;
};
