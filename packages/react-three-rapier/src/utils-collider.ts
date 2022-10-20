import {
  Collider,
  ColliderDesc,
  ActiveEvents,
  RigidBody
} from "@dimforge/rapier3d-compat";
import { MutableRefObject, useEffect, useMemo } from "react";
import { BufferGeometry, Euler, Mesh, Object3D, Vector3 } from "three";
import { mergeVertices } from "three-stdlib";
import { ColliderProps, RigidBodyProps } from ".";
import { WorldApi } from "./api";
import { ColliderState, ColliderStateMap, EventMap } from "./Physics";
import {
  _matrix4,
  _position,
  _rotation,
  _scale,
  _vector3
} from "./shared-objects";
import { ColliderShape, RigidBodyAutoCollider } from "./types";
import { scaleVertices, vectorToTuple } from "./utils";

export const scaleColliderArgs = (
  shape: ColliderShape,
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

type ImmutableColliderOptions = (keyof ColliderProps)[];

export const immutableColliderOptions: ImmutableColliderOptions = [
  "shape",
  "args"
];

type MutableColliderOptions = {
  [key in keyof ColliderProps]: (
    collider: Collider,
    value: Exclude<ColliderProps[key], undefined>,
    options: ColliderProps
  ) => void;
};

const massPropertiesConflictError =
  "Please pick ONLY ONE of the `density`, `mass` and `massProperties` options.";

type MassPropertiesType = "mass" | "massProperties" | "density";
const setColliderMassOptions = (
  collider: Collider,
  options: Pick<ColliderProps, MassPropertiesType>
) => {
  if (options.density !== undefined) {
    if (options.mass !== undefined || options.massProperties !== undefined) {
      throw new Error(massPropertiesConflictError);
    }
    collider.setDensity(options.density);

    return;
  }

  if (options.mass !== undefined) {
    if (options.massProperties !== undefined) {
      throw new Error(massPropertiesConflictError);
    }

    collider.setMass(options.mass);
    return;
  }

  if (options.massProperties !== undefined) {
    collider.setMassProperties(
      options.massProperties.mass,
      options.massProperties.centerOfMass,
      options.massProperties.principalAngularInertia,
      options.massProperties.angularInertiaLocalFrame
    );
  }
};

const mutableColliderOptions: MutableColliderOptions = {
  sensor: (collider, value: boolean) => {
    collider.setSensor(value);
  },
  collisionGroups: (collider, value: number) => {
    collider.setCollisionGroups(value);
  },
  solverGroups: (collider, value: number) => {
    collider.setSolverGroups(value);
  },
  friction: (collider, value: number) => {
    collider.setFriction(value);
  },
  frictionCombineRule: (collider, value) => {
    collider.setFrictionCombineRule(value);
  },
  restitution: (collider, value: number) => {
    collider.setRestitution(value);
  },
  restitutionCombineRule: (collider, value) => {
    collider.setRestitutionCombineRule(value);
  },
  // To make sure the options all mutalbe options are listed
  quaternion: () => {},
  position: () => {},
  rotation: () => {},
  scale: () => {}
};

const mutableColliderOptionKeys = Object.keys(
  mutableColliderOptions
) as (keyof ColliderProps)[];

export const setColliderOptions = (
  collider: Collider,
  options: ColliderProps,
  states: ColliderStateMap
) => {
  const state = states.get(collider.handle);

  if (state) {
    // Update collider position based on the object's position
    const parentWorldScale = state.object.parent!.getWorldScale(_vector3);

    state.object.updateWorldMatrix(true, false);

    _matrix4
      .copy(state.object.matrixWorld)
      .premultiply(state.worldParent.matrixWorld.clone().invert())
      .decompose(_position, _rotation, _scale);

    if (collider.parent()) {
      collider.setTranslationWrtParent({
        x: _position.x * parentWorldScale.x,
        y: _position.y * parentWorldScale.y,
        z: _position.z * parentWorldScale.z
      });
      collider.setRotationWrtParent(_rotation);
    } else {
      collider.setTranslation({
        x: _position.x * parentWorldScale.x,
        y: _position.y * parentWorldScale.y,
        z: _position.z * parentWorldScale.z
      });
      collider.setRotation(_rotation);
    }

    mutableColliderOptionKeys.forEach((key) => {
      if (key in options) {
        const option = options[key];
        mutableColliderOptions[key]!(
          collider,
          // @ts-ignore Option does not want to fit into the function, but it will
          option,
          options
        );
      }
    });

    // handle mass separately, because the assignments
    // are exclusive.
    setColliderMassOptions(collider, options);
  }
};

export const useUpdateColliderOptions = (
  collidersRef: MutableRefObject<Collider[]>,
  props: ColliderProps,
  states: ColliderStateMap
) => {
  // TODO: Improve this, split each prop into its own effect
  const mutablePropsAsFlatArray = useMemo(
    () =>
      mutableColliderOptionKeys.flatMap((key) => {
        return vectorToTuple(props[key as keyof ColliderProps]);
      }),
    [props]
  );

  useEffect(() => {
    collidersRef.current.forEach((collider) => {
      setColliderOptions(collider, props, states);
    });
  }, mutablePropsAsFlatArray);
};

const isChildOfMeshCollider = (child: Mesh) => {
  let flag = false;
  child.traverseAncestors((a) => {
    if (a.userData.r3RapierType === "MeshCollider") flag = true;
  });
  return flag;
};

export const createColliderState = (
  collider: Collider,
  object: Object3D,
  rigidBodyObject?: Object3D | null
): ColliderState => {
  return {
    collider,
    worldParent: rigidBodyObject || object.parent!,
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

export const createColliderPropsFromChildren: CreateColliderPropsFromChildren =
  ({ object, ignoreMeshColliders = true, options }): ColliderProps[] => {
    const colliderProps: ColliderProps[] = [];

    object.updateWorldMatrix(true, false);
    const invertedParentMatrixWorld = object.matrixWorld.clone().invert();

    const colliderFromChild = (child: Object3D) => {
      if ("isMesh" in child) {
        if (ignoreMeshColliders && isChildOfMeshCollider(child as Mesh)) return;

        const worldScale = child.getWorldScale(_scale);
        const shape = autoColliderMap[
          options.colliders || "cuboid"
        ] as ColliderShape;

        child.updateWorldMatrix(true, false);
        _matrix4
          .copy(child.matrixWorld)
          .premultiply(invertedParentMatrixWorld)
          .decompose(_position, _rotation, _scale);

        const rotationEuler = new Euler().setFromQuaternion(_rotation, "XYZ");

        const { geometry } = child as Mesh;
        const { args, offset } = getColliderArgsFromGeometry(
          geometry,
          options.colliders || "cuboid"
        );

        colliderProps.push({
          ...options,
          args: args,
          shape: shape,
          rotation: [rotationEuler.x, rotationEuler.y, rotationEuler.z],
          position: [
            _position.x + offset.x * worldScale.x,
            _position.y + offset.y * worldScale.y,
            _position.z + offset.z * worldScale.z
          ],
          scale: [worldScale.x, worldScale.y, worldScale.z]
        });
      }
    };

    if (options.includeInvisible) {
      object.traverse(colliderFromChild);
    } else {
      object.traverseVisible(colliderFromChild);
    }

    return colliderProps;
  };

export const getColliderArgsFromGeometry = (
  geometry: BufferGeometry,
  colliders: RigidBodyAutoCollider
): { args: unknown[]; offset: Vector3 } => {
  switch (colliders) {
    case "cuboid":
      {
        geometry.computeBoundingBox();
        const { boundingBox } = geometry;

        const size = boundingBox!.getSize(new Vector3());

        return {
          args: [size.x / 2, size.y / 2, size.z / 2],
          offset: boundingBox!.getCenter(new Vector3())
        };
      }
      break;

    case "ball":
      {
        geometry.computeBoundingSphere();
        const { boundingSphere } = geometry;

        const radius = boundingSphere!.radius;

        return {
          args: [radius],
          offset: boundingSphere!.center
        };
      }
      break;

    case "trimesh":
      {
        const clonedGeometry = geometry.index
          ? geometry.clone()
          : mergeVertices(geometry);

        return {
          args: [
            clonedGeometry.attributes.position.array as Float32Array,
            clonedGeometry.index?.array as Uint32Array
          ],
          offset: new Vector3()
        };
      }
      break;

    case "hull":
      {
        const g = geometry.clone();

        return {
          args: [g.attributes.position.array as Float32Array],
          offset: new Vector3()
        };
      }
      break;
  }

  return { args: [], offset: new Vector3() };
};

export const useColliderEvents = (
  collidersRef: MutableRefObject<Collider[] | undefined>,
  props: ColliderProps,
  events: EventMap
) => {
  const {
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit,
    onContactForce
  } = props;

  useEffect(() => {
    collidersRef.current?.forEach((collider) => {
      const hasCollisionEvent = !!(
        onCollisionEnter ||
        onCollisionExit ||
        onIntersectionEnter ||
        onIntersectionExit
      );
      const hasContactForceEvent = !!onContactForce;

      if (hasCollisionEvent && hasContactForceEvent) {
        collider.setActiveEvents(
          ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS
        );
      } else if (hasCollisionEvent) {
        collider.setActiveEvents(ActiveEvents.COLLISION_EVENTS);
      } else if (hasContactForceEvent) {
        collider.setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS);
      }

      events.set(collider.handle, {
        onCollisionEnter,
        onCollisionExit,
        onIntersectionEnter,
        onIntersectionExit,
        onContactForce
      });
    });

    return () => {
      collidersRef.current?.forEach((collider) =>
        events.delete(collider.handle)
      );
    };
  }, [
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit,
    onContactForce
  ]);
};
