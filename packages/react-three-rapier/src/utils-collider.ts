import {
  Collider,
  ColliderDesc,
  CoefficientCombineRule,
  ActiveEvents,
  RigidBody
} from "@dimforge/rapier3d-compat";
import { MutableRefObject, useEffect } from "react";
import {
  Vector3,
  Mesh,
  Object3D,
  Quaternion,
  BufferGeometry,
  Matrix4
} from "three";
import { mergeVertices } from "three-stdlib";
import { ColliderProps, RigidBodyProps } from ".";
import { WorldApi, RigidBodyApi } from "./api";
import { ColliderState, ColliderStateMap } from "./Physics";
import {
  _matrix4,
  _position,
  _rotation,
  _scale,
  _vector3
} from "./shared-objects";
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

export const createColliderFromOptions = (
  options: ColliderProps,
  world: WorldApi,
  scale: Vector3,
  rigidBody?: RigidBody
) => {
  const scaledArgs = scaleColliderArgs(options.shape!, options.args, scale);
  // @ts-ignore
  const desc = ColliderDesc[options.shape!](...scaledArgs);
  return world.createCollider(desc!, rigidBody);
};

export const setColliderOptions = (
  collider: Collider,
  options: UseColliderOptions<any>,
  states: ColliderStateMap
) => {
  const state = states.get(collider.handle);

  if (options.collisionGroups !== undefined)
    collider.setCollisionGroups(options.collisionGroups);

  if (options.solverGroups !== undefined)
    collider.setSolverGroups(options.solverGroups);

  if (state) {
    // Update collider position based on the object's position
    state.object.updateWorldMatrix(true, false);
    _matrix4
      .copy(state.object.matrixWorld)
      .premultiply(state.invertedWorldMatrix)
      .decompose(_position, _rotation, _scale);

    collider.setTranslationWrtParent(_position);
    collider.setRotationWrtParent(_rotation);
  }
};

export const useUpdateColliderOptions = (
  collidersRef: MutableRefObject<Collider[]>,
  props: ColliderProps,
  states: ColliderStateMap
) => {
  useEffect(() => {
    collidersRef.current.forEach(collider => {
      setColliderOptions(collider, props, states);
    });
  }, [props]);
};

const isChildOfMeshCollider = (child: Mesh) => {
  let flag = false;
  child.traverseAncestors(a => {
    if (a.userData.r3RapierType === "MeshCollider") flag = true;
  });
  return flag;
};

export const createColliderState = (
  collider: Collider,
  object: Object3D,
  rigidBodyObject?: Object3D | null
): ColliderState => {
  object.updateWorldMatrix(true, false);

  let invertedWorldMatrix: Matrix4;

  if (rigidBodyObject) {
    invertedWorldMatrix = rigidBodyObject.matrixWorld.clone().invert();
  } else {
    invertedWorldMatrix = object.parent!.matrixWorld.clone().invert();
  }

  return {
    collider,
    invertedWorldMatrix,
    object
  };
};

const autoColliderMap: Record<string, string> = {
  cuboid: "cuboid",
  ball: "ball",
  hull: "convexHull",
  trimesh: "trimesh"
};

interface CreateColliderPropsFromChildren {
  (options: {
    object: Object3D;
    ignoreMeshColliders: boolean;
    options: RigidBodyProps;
  }): ColliderProps[];
}

export const createColliderPropsFromChildren: CreateColliderPropsFromChildren = ({
  object,
  ignoreMeshColliders = true,
  options
}): ColliderProps[] => {
  const colliderProps: ColliderProps[] = [];

  object.traverseVisible(child => {
    if ("isMesh" in child) {
      if (ignoreMeshColliders && isChildOfMeshCollider(child as Mesh)) return;

      const worldScale = child.getWorldScale(_scale);

      const { geometry, position, rotation } = child as Mesh;
      const args = getColliderArgsFromGeometry(
        geometry,
        options.colliders || "cuboid"
      );

      colliderProps.push({
        ...options,
        args,
        shape: autoColliderMap[options.colliders || "cuboid"] as RigidBodyShape,
        rotation: [rotation.x, rotation.y, rotation.z],
        position: [position.x, position.y, position.z],
        scale: [worldScale.x, worldScale.y, worldScale.z]
      });
    }
  });

  return colliderProps;
};

export const getColliderArgsFromGeometry = (
  geometry: BufferGeometry,
  colliders: RigidBodyAutoCollider
) => {
  let desc: [];

  switch (colliders) {
    case "cuboid":
      {
        geometry.computeBoundingBox();
        const { boundingBox } = geometry;

        const size = boundingBox!.getSize(new Vector3());

        return [size.x / 2, size.y / 2, size.z / 2];
      }
      break;

    case "ball":
      {
        geometry.computeBoundingSphere();
        const { boundingSphere } = geometry;

        const radius = boundingSphere!.radius;

        return [radius];
      }
      break;

    case "trimesh":
      {
        const clonedGeometry = geometry.index
          ? geometry.clone()
          : mergeVertices(geometry);

        return [
          clonedGeometry.attributes.position.array as Float32Array,
          clonedGeometry.index?.array as Uint32Array
        ];
      }
      break;

    case "hull":
      {
        const g = geometry.clone();

        return [g.attributes.position.array as Float32Array];
      }
      break;
  }

  return desc!;
};
