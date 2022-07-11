import {
  ActiveEvents,
  CoefficientCombineRule,
  Collider,
  ColliderDesc,
  RigidBody,
} from "@dimforge/rapier3d-compat";

import { Mesh, Object3D, Quaternion, Vector3 } from "three";
import {
  RigidBodyShape,
  RigidBodyTypeString,
  UseColliderOptions,
  UseRigidBodyOptions,
  Vector3Array,
  WorldApi,
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
  world: WorldApi,
  rigidBody: RigidBody,
  scale = { x: 1, y: 1, z: 1 },
  hasCollisionEvents: boolean = false
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

  if (hasCollisionEvents) {
    colliderDesc = colliderDesc.setActiveEvents(ActiveEvents.COLLISION_EVENTS);
  }

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

  const collider = world.createCollider(colliderDesc, rigidBody);

  return collider;
};

export const createCollidersFromChildren = (
  object: Object3D,
  rigidBody: RigidBody,
  options: UseRigidBodyOptions,
  world: WorldApi
) => {
  const hasCollisionEvents = !!(
    options.onCollisionEnter || options.onCollisionExit
  );
  const colliders: Collider[] = [];

  let desc: ColliderDesc;
  let offset = new Vector3();

  object.traverse((child: Object3D | Mesh) => {
    if ("isMesh" in child) {
      const { geometry } = child;
      const { x, y, z } = child.position;
      const { x: rx, y: ry, z: rz, w: rw } = new Quaternion().setFromEuler(
        child.rotation
      );
      const scale = child.getWorldScale(new Vector3());

      switch (options.colliders) {
        case "cuboid":
          {
            geometry.computeBoundingBox();
            const { boundingBox } = geometry;

            const size = boundingBox!.getSize(new Vector3());
            boundingBox!.getCenter(offset);

            desc = ColliderDesc.cuboid(
              (size.x / 2) * scale.x,
              (size.y / 2) * scale.y,
              (size.z / 2) * scale.z
            );
          }
          break;

        case "ball":
          {
            geometry.computeBoundingSphere();
            const { boundingSphere } = geometry;

            const radius = boundingSphere!.radius * scale.x;
            offset.copy(boundingSphere!.center);

            desc = ColliderDesc.ball(radius);
          }
          break;

        case "trimesh":
          {
            const g = geometry.clone().scale(scale.x, scale.y, scale.z);

            desc = ColliderDesc.trimesh(
              g.attributes.position.array as Float32Array,
              g.index?.array as Uint32Array
            );
          }
          break;

        case "hull":
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
          (x + offset.x) * parentWorldScale.x,
          (y + offset.y) * parentWorldScale.y,
          (z + offset.z) * parentWorldScale.z
        )
        .setRotation({ x: rx, y: ry, z: rz, w: rw });

      if (hasCollisionEvents)
        desc.setActiveEvents(ActiveEvents.COLLISION_EVENTS);
      if (Number.isFinite(options.friction))
        desc.setFriction(options.friction as number);
      if (Number.isFinite(options.restitution))
        desc.setRestitution(options.restitution as number);

      const collider = world.createCollider(desc, rigidBody);
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
