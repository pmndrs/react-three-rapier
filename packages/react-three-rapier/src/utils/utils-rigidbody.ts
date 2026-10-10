import { RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { useEffect, useMemo } from "react";
import { Matrix4, Object3D, Vector3 } from "three";
import { Boolean3Tuple, RigidBodyProps, Vector3Tuple } from "..";
import {
  EventMap,
  RigidBodyState,
  RigidBodyStateMap
} from "../components/Physics";
import {
  _matrix4,
  _position,
  _rotation,
  _scale,
  _vector3
} from "./shared-objects";
import { rigidBodyTypeFromString, vectorToTuple } from "./utils";

export const rigidBodyDescFromOptions = (options: RigidBodyProps) => {
  const type = rigidBodyTypeFromString(options?.type || "dynamic");

  const desc = new RigidBodyDesc(type);

  // Apply immutable options
  desc.canSleep = options?.canSleep ?? true;

  return desc;
};

interface CreateRigidBodyStateOptions {
  object: Object3D;
  rigidBody: RigidBody;
  setMatrix?: (matrix: Matrix4) => void;
  getMatrix?: (matrix: Matrix4) => Matrix4;
  worldScale?: Vector3;
  meshType?: RigidBodyState["meshType"];
}

export const createRigidBodyState = ({
  rigidBody,
  object,
  setMatrix,
  getMatrix,
  worldScale,
  meshType = "mesh"
}: CreateRigidBodyStateOptions): RigidBodyState => {
  object.updateWorldMatrix(true, false);
  const invertedWorldMatrix = object.parent!.matrixWorld.clone().invert();

  return {
    object,
    rigidBody,
    invertedWorldMatrix,
    setMatrix: setMatrix
      ? setMatrix
      : (matrix: Matrix4) => {
          object.matrix.copy(matrix);
        },
    getMatrix: getMatrix
      ? getMatrix
      : (matrix: Matrix4) => matrix.copy(object.matrix),
    scale: worldScale || object.getWorldScale(_scale).clone(),
    isSleeping: false,
    meshType
  };
};

/**
 * A parent Object3D's world space, as last read by a sync pass.
 * @internal
 */
export interface ParentSpace {
  object: Object3D;
  /** Sync pass this entry was last read in */
  pass: number;
  /** Bumped whenever the parent's world matrix changes */
  version: number;
  inverse: Matrix4;
  world: Matrix4;
}

// Parent inverse world matrices, re-read once per sync pass and shared by all
// bodies with the same parent. Keyed weakly so removed parents are collected.
const parentSpaces = new WeakMap<Object3D, ParentSpace>();
let currentPass = 0;

/**
 * Starts a new sync pass: parent world matrices are re-read once per pass.
 * @internal
 */
export const beginParentSpacePass = () => {
  currentPass++;
};

/**
 * Refreshes `state.invertedWorldMatrix` from the object's CURRENT parent world
 * matrix (#36: it used to be captured once at spawn, so moving or rotating an
 * ancestor afterwards desynced every visual from its body).
 *
 * @param collect receives each parent space the first time it is read in this
 * pass, so a later pass can cheaply check whether any of them moved
 * @returns whether the parent space changed (or the body was re-parented)
 * since this body was last synced
 * @internal
 */
export const refreshParentInverse = (
  state: RigidBodyState,
  collect?: ParentSpace[]
) => {
  const parent = state.object.parent;
  if (!parent) return false;

  let space = parentSpaces.get(parent);
  if (!space) {
    parent.updateWorldMatrix(true, false);
    space = {
      object: parent,
      pass: currentPass,
      version: 0,
      world: parent.matrixWorld.clone(),
      inverse: parent.matrixWorld.clone().invert()
    };
    parentSpaces.set(parent, space);
    collect?.push(space);
  } else if (space.pass !== currentPass) {
    space.pass = currentPass;
    parent.updateWorldMatrix(true, false);
    if (!space.world.equals(parent.matrixWorld)) {
      space.world.copy(parent.matrixWorld);
      space.inverse.copy(parent.matrixWorld).invert();
      space.version++;
    }
    collect?.push(space);
  }

  const moved =
    state.parentSpace !== space || state.parentSpaceVersion !== space.version;
  if (moved) {
    state.invertedWorldMatrix.copy(space.inverse);
    state.parentSpace = space;
    state.parentSpaceVersion = space.version;
  }
  return moved;
};

/**
 * Whether any of these parents' world matrices changed since they were read.
 * Costs one `updateWorldMatrix` and one matrix compare per distinct parent.
 * @internal
 */
export const anyParentSpaceMoved = (spaces: ParentSpace[]) => {
  for (let i = 0; i < spaces.length; i++) {
    const { object, world } = spaces[i];
    object.updateWorldMatrix(true, false);
    if (!world.equals(object.matrixWorld)) return true;
  }
  return false;
};

type ImmutableRigidBodyOptions = (keyof RigidBodyProps)[];

export const immutableRigidBodyOptions: ImmutableRigidBodyOptions = [
  "args",
  "colliders",
  "canSleep"
];

type MutableRigidBodyOptions = {
  [Prop in keyof RigidBodyProps]: (rb: RigidBody, value: any) => void;
};

export const mutableRigidBodyOptions: MutableRigidBodyOptions = {
  gravityScale: (rb: RigidBody, value: number) => {
    rb.setGravityScale(value, true);
  },
  additionalSolverIterations(rb: RigidBody, value: number) {
    rb.setAdditionalSolverIterations(value);
  },
  linearDamping: (rb: RigidBody, value: number) => {
    rb.setLinearDamping(value);
  },
  angularDamping: (rb: RigidBody, value: number) => {
    rb.setAngularDamping(value);
  },
  dominanceGroup: (rb: RigidBody, value: number) => {
    rb.setDominanceGroup(value);
  },
  enabledRotations: (rb: RigidBody, [x, y, z]: Boolean3Tuple) => {
    rb.setEnabledRotations(x, y, z, true);
  },
  enabledTranslations: (rb: RigidBody, [x, y, z]: Boolean3Tuple) => {
    rb.setEnabledTranslations(x, y, z, true);
  },
  lockRotations: (rb: RigidBody, value: boolean) => {
    rb.lockRotations(value, true);
  },
  lockTranslations: (rb: RigidBody, value: boolean) => {
    rb.lockTranslations(value, true);
  },
  angularVelocity: (rb: RigidBody, [x, y, z]: Vector3Tuple) => {
    rb.setAngvel({ x, y, z }, true);
  },
  linearVelocity: (rb: RigidBody, [x, y, z]: Vector3Tuple) => {
    rb.setLinvel({ x, y, z }, true);
  },
  ccd: (rb: RigidBody, value: boolean) => {
    rb.enableCcd(value);
  },
  softCcdPrediction: (rb: RigidBody, value: number) => {
    rb.setSoftCcdPrediction(value);
  },
  userData: (rb: RigidBody, value: { [key: string]: any }) => {
    rb.userData = value;
  },
  type(rb, value) {
    rb.setBodyType(rigidBodyTypeFromString(value), true);
  },
  position: () => {},
  rotation: () => {},
  quaternion: () => {},
  scale: () => {}
};

const mutableRigidBodyOptionKeys = Object.keys(mutableRigidBodyOptions);

export const setRigidBodyOptions = (
  rigidBody: RigidBody,
  options: RigidBodyProps,
  states: RigidBodyStateMap,
  updateTranslations: boolean = true
) => {
  if (!rigidBody) {
    return;
  }

  const state = states.get(rigidBody.handle);

  if (state) {
    if (updateTranslations) {
      state.object.updateWorldMatrix(true, false);

      _matrix4
        .copy(state.object.matrixWorld)
        .decompose(_position, _rotation, _scale);

      rigidBody.setTranslation(_position, false);
      rigidBody.setRotation(_rotation, false);
    }

    mutableRigidBodyOptionKeys.forEach((key) => {
      if (key in options) {
        mutableRigidBodyOptions[key as keyof RigidBodyProps]!(
          rigidBody,
          options[key as keyof RigidBodyProps]
        );
      }
    });
  }
};

export const useUpdateRigidBodyOptions = (
  getRigidBody: () => RigidBody,
  props: RigidBodyProps,
  states: RigidBodyStateMap,
  updateTranslations: boolean = true
) => {
  // TODO: Improve this, split each prop into its own effect
  const mutablePropsAsFlatArray = useMemo(
    () =>
      mutableRigidBodyOptionKeys.flatMap((key) => {
        return vectorToTuple(props[key as keyof RigidBodyProps]);
      }),
    [props]
  );

  useEffect(() => {
    const rigidBody = getRigidBody();
    setRigidBodyOptions(rigidBody, props, states, updateTranslations);
  }, mutablePropsAsFlatArray);
};

export const useRigidBodyEvents = (
  getRigidBody: () => RigidBody,
  props: RigidBodyProps,
  events: EventMap
) => {
  const {
    onWake,
    onSleep,
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit,
    onContactForce
  } = props;

  const eventHandlers = {
    onWake,
    onSleep,
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit,
    onContactForce
  };

  useEffect(() => {
    const rigidBody = getRigidBody();
    events.set(rigidBody.handle, eventHandlers);

    return () => {
      events.delete(rigidBody.handle);
    };
  }, [
    onWake,
    onSleep,
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit,
    onContactForce
  ]);
};
