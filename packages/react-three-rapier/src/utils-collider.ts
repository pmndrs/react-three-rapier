import {
  Collider,
  ColliderDesc,
  CoefficientCombineRule,
  ActiveEvents,
  RigidBody
} from "@dimforge/rapier3d-compat";
import { Vector3, Mesh, Object3D, Quaternion, BufferGeometry } from "three";
import { mergeVertices } from "three-stdlib";
import { WorldApi, RigidBodyApi } from "./api";
import {
  RigidBodyShape,
  UseColliderOptions,
  UseRigidBodyOptions,
  RigidBodyAutoCollider
} from "./types";
import { scaleVertices, vector3ToQuaternion } from "./utils";

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

const setColliderOptions = (
  collider: Collider,
  options: UseColliderOptions<any>
) => {
  if (options.collisionGroups !== undefined)
    collider.setCollisionGroups(options.collisionGroups);

  if (options.solverGroups !== undefined)
    collider.setSolverGroups(options.solverGroups);
};

export const createColliderFromOptions: CreateColliderFromOptions = ({
  options,
  world,
  rigidBody,
  scale,
  hasCollisionEvents
}) => {
  const mass = options?.mass || 1;
  const colliderShape = options?.shape ?? "cuboid";
  const colliderArgs = options?.args ?? [];
  const [cmx, cmy, cmz] = options?.centerOfMass || [0, 0, 0];
  const [pix, piy, piz] = options?.principalAngularInertia || [
    mass * 0.2,
    mass * 0.2,
    mass * 0.2
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
      w: qRotation.w
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

  setColliderOptions(collider, options);

  return collider;
};

const isChildOfMeshCollider = (child: Mesh) => {
  let flag = false;
  child.traverseAncestors(a => {
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
  ignoreMeshColliders = true
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

      setColliderOptions(collider, options);

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
