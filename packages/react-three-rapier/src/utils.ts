import {
  ActiveEvents,
  CoefficientCombineRule,
  Collider,
  ColliderDesc,
  Quaternion as RapierQuaternion,
  RigidBody,
  RigidBodyDesc,
  Vector3 as RapierVector3,
} from "@dimforge/rapier3d-compat";

import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils";

import {
  BufferGeometry,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
} from "three";
import { _euler, _quaternion, _vector3 } from "./shared-objects";
import {
  RigidBodyApi,
  RigidBodyAutoCollider,
  RigidBodyShape,
  RigidBodyTypeString,
  UseColliderOptions,
  UseRigidBodyOptions,
  Vector3Array,
  WorldApi,
} from "./types";

export const vectorArrayToVector3 = (arr: Vector3Array) => {
  const [x, y, z] = arr;
  return new Vector3(x, y, z);
};

export const vector3ToQuaternion = (v: Vector3) => {
  return _quaternion.setFromEuler(_euler.setFromVector3(v));
};

export const rapierVector3ToVector3 = ({ x, y, z }: RapierVector3) =>
  _vector3.set(x, y, z).clone();

export const rapierQuaternionToQuaternion = ({
  x,
  y,
  z,
  w,
}: RapierQuaternion) => _quaternion.set(x, y, z, w);

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

export const decomposeMatrix4 = (m: Matrix4) => {
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();

  m.decompose(position, rotation, scale);

  return {
    position,
    rotation,
    scale,
  };
};

export const scaleColliderArgs = (
  shape: RigidBodyShape,
  args: (number | ArrayLike<number> | { x: number; y: number; z: number })[],
  scale: Vector3
) => {
  const newArgs = args.slice();

  // Heightfield uses a vector
  if (shape === "heightfield") {
    const s = newArgs[3] as { x: number; y: number; z: number };
    s.x *= scale.x;
    s.x *= scale.y;
    s.x *= scale.z;

    return newArgs;
  }

  // Trimesh and convex scale the vertices
  if (shape === "trimesh" || shape === "convexHull") {
    newArgs[0] = scaleVertices(newArgs[0] as ArrayLike<number>, scale);
    return newArgs;
  }

  // Prepfill with some extra
  const scaleArray = [scale.x, scale.y, scale.z, scale.x, scale.x];
  return newArgs.map((arg, index) => scaleArray[index] * (arg as number));
};

interface CreateColliderFromOptions {
  <ColliderArgs>(options: {
    options: UseColliderOptions<ColliderArgs>;
    world: WorldApi;
    rigidBody?: RigidBody;
    scale: { x: number; y: number; z: number };
    hasCollisionEvents: boolean;
  }): Collider;
}

const applyColliderOptions = (collider: Collider, options: UseColliderOptions<any>) => {
  if (options.collisionGroups !== undefined)
    collider.setCollisionGroups(options.collisionGroups);

  if (options.solverGroups !== undefined)
    collider.setSolverGroups(options.solverGroups);
}

export const createColliderFromOptions: CreateColliderFromOptions = ({
  options,
  world,
  rigidBody,
  scale,
  hasCollisionEvents,
}) => {
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
  const qRotation = vector3ToQuaternion(new Vector3(rx, ry, rz));

  // @ts-ignore
  const scaledArgs = scaleColliderArgs(options.shape, colliderArgs, scale);

  let colliderDesc = (ColliderDesc[colliderShape](
    // @ts-ignore
    ...scaledArgs
  ) as ColliderDesc)
    .setTranslation(x * scale.x, y * scale.y, z * scale.z)
    .setRotation({
      x: qRotation.x,
      y: qRotation.y,
      z: qRotation.z,
      w: qRotation.w,
    })
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
  const qMassRot = vector3ToQuaternion(new Vector3(0, 0, 0));

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
      { x: qMassRot.x, y: qMassRot.y, z: qMassRot.z, w: qMassRot.w }
    );
  }

  const collider = world.createCollider(colliderDesc, rigidBody);

  applyColliderOptions(collider, options)

  return collider;
};

const isChildOfMeshCollider = (child: Mesh) => {
  let flag = false;
  child.traverseAncestors((a) => {
    if (a.userData.r3RapierType === "MeshCollider") flag = true;
  });
  return flag;
};

interface CreateCollidersFromChildren {
  (options: {
    object: Object3D;
    rigidBody?: Pick<RigidBodyApi | RigidBody, "handle">;
    options: UseRigidBodyOptions;
    world: WorldApi;
    ignoreMeshColliders: boolean;
  }): Collider[];
}
export const createCollidersFromChildren: CreateCollidersFromChildren = ({
  object,
  rigidBody,
  options,
  world,
  ignoreMeshColliders = true,
}) => {
  const hasCollisionEvents = !!(
    options.onCollisionEnter || options.onCollisionExit
  );
  const colliders: Collider[] = [];

  object.traverseVisible((child: Object3D | Mesh) => {
    if ("isMesh" in child) {
      if (ignoreMeshColliders && isChildOfMeshCollider(child)) return;

      const { geometry } = child;
      const { x, y, z } = child.position;
      const { x: rx, y: ry, z: rz, w: rw } = new Quaternion().setFromEuler(
        child.rotation
      );
      const scale = child.getWorldScale(new Vector3());

      // We translate the colliders based on the parent's world scale
      const parentWorldScale = child.parent!.getWorldScale(new Vector3());

      const desc = colliderDescFromGeometry(
        geometry,
        options.colliders!,
        scale,
        hasCollisionEvents
      );

      const offset = new Vector3(0, 0, 0);

      if (options.colliders === "cuboid") {
        geometry.computeBoundingBox();
        geometry.boundingBox?.getCenter(offset);
      }
      if (options.colliders === "ball") {
        geometry.computeBoundingSphere();
        offset.copy(geometry.boundingSphere!.center);
      }

      if (Number.isFinite(options.friction))
        desc.setFriction(options.friction as number);
      if (Number.isFinite(options.restitution))
        desc.setRestitution(options.restitution as number);

      desc
        .setTranslation(
          (x + offset.x) * parentWorldScale.x,
          (y + offset.y) * parentWorldScale.y,
          (z + offset.z) * parentWorldScale.z
        )
        .setRotation({ x: rx, y: ry, z: rz, w: rw });

      const actualRigidBody = rigidBody
        ? world.getRigidBody(rigidBody.handle)
        : undefined;
      const collider = world.createCollider(desc, actualRigidBody);

      applyColliderOptions(collider, options)

      colliders.push(collider);
    }
  });

  return colliders;
};

export const colliderDescFromGeometry = (
  geometry: BufferGeometry,
  colliders: RigidBodyAutoCollider,
  scale: Vector3,
  hasCollisionEvents: boolean
) => {
  let desc: ColliderDesc;

  switch (colliders) {
    case "cuboid":
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

    case "ball":
      {
        geometry.computeBoundingSphere();
        const { boundingSphere } = geometry;

        const radius = boundingSphere!.radius * scale.x;

        desc = ColliderDesc.ball(radius);
      }
      break;

    case "trimesh":
      {
        const clonedGeometry = geometry.index
          ? geometry.clone()
          : mergeVertices(geometry);
        const g = clonedGeometry.scale(scale.x, scale.y, scale.z);

        desc = ColliderDesc.trimesh(
          g.attributes.position.array as Float32Array,
          g.index?.array as Uint32Array
        );
      }
      break;

    case "hull":
      {
        const g = geometry.clone().scale(scale.x, scale.y, scale.z);

        desc = ColliderDesc.convexHull(
          g.attributes.position.array as Float32Array
        ) as ColliderDesc;
      }
      break;
  }

  if (hasCollisionEvents) desc!.setActiveEvents(ActiveEvents.COLLISION_EVENTS);

  return desc!;
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

export const rigidBodyDescFromOptions = (options: UseRigidBodyOptions) => {
  const type = rigidBodyTypeFromString(options?.type || "dynamic");
  const [lvx, lvy, lvz] = options?.linearVelocity ?? [0, 0, 0];
  const [avx, avy, avz] = options?.angularVelocity ?? [0, 0, 0];
  const angularDamping = options?.angularDamping ?? 0;
  const linearDamping = options?.linearDamping ?? 0;

  const gravityScale = options?.gravityScale ?? 1;
  const canSleep = options?.canSleep ?? true;
  const ccdEnabled = options?.ccd ?? false;
  const [erx, ery, erz] = options?.enabledRotations ?? [true, true, true];
  const [etx, ety, etz] = options?.enabledTranslations ?? [true, true, true];

  const desc = new RigidBodyDesc(type)
    .setLinvel(lvx, lvy, lvz)
    .setAngvel({ x: avx, y: avy, z: avz })
    .setLinearDamping(linearDamping)
    .setAngularDamping(angularDamping)
    .setGravityScale(gravityScale)
    .setCanSleep(canSleep)
    .setCcdEnabled(ccdEnabled)
    .enabledRotations(erx, ery, erz)
    .enabledTranslations(etx, ety, etz);

  if (options.lockRotations) desc.lockRotations();
  if (options.lockTranslations) desc.lockTranslations();

  return desc;
};
