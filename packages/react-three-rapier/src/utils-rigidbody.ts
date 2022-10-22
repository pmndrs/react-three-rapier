import { RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { MutableRefObject, useEffect, useMemo } from "react";
import { Matrix4, Object3D, Vector3 } from "three";
import { Boolean3Array, RigidBodyProps, Vector3Array } from ".";
import { EventMap, RigidBodyState, RigidBodyStateMap } from "./Physics";
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

  return desc;
};

interface CreateRigidBodyStateOptions {
  object: Object3D;
  rigidBody: RigidBody;
  setMatrix?: (matrix: Matrix4) => void;
  getMatrix?: (matrix: Matrix4) => Matrix4;
  worldScale?: Vector3;
}

export const createRigidBodyState = ({
  rigidBody,
  object,
  setMatrix,
  getMatrix,
  worldScale
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
    isSleeping: false
  };
};

type ImmutableRigidBodyOptions = (keyof RigidBodyProps)[];

export const immutableRigidBodyOptions: ImmutableRigidBodyOptions = [
  "args",
  "colliders",
  "type"
];

type MutableRigidBodyOptions = {
  [Prop in keyof RigidBodyProps]: (rb: RigidBody, value: any) => void;
};

const mutableRigidBodyOptions: MutableRigidBodyOptions = {
  gravityScale: (rb: RigidBody, value: number) => {
    rb.setGravityScale(value, true);
  },
  linearDamping: (rb: RigidBody, value: number) => {
    rb.setLinearDamping(value);
  },
  angularDamping: (rb: RigidBody, value: number) => {
    rb.setAngularDamping(value);
  },
  enabledRotations: (rb: RigidBody, [x, y, z]: Boolean3Array) => {
    rb.setEnabledRotations(x, y, z, true);
  },
  enabledTranslations: (rb: RigidBody, [x, y, z]: Boolean3Array) => {
    rb.setEnabledTranslations(x, y, z, true);
  },
  angularVelocity: (rb: RigidBody, [x, y, z]: Vector3Array) => {
    rb.setAngvel({ x, y, z }, true);
  },
  linearVelocity: (rb: RigidBody, [x, y, z]: Vector3Array) => {
    rb.setLinvel({ x, y, z }, true);
  },
  ccd: (rb: RigidBody, value: boolean) => {
    rb.enableCcd(value);
  },
  userData: (rb: RigidBody, value: { [key: string]: any }) => {
    rb.userData = value;
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
  rigidBodyRef: MutableRefObject<RigidBody | RigidBody[] | undefined>,
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
    if (Array.isArray(rigidBodyRef.current)) {
      for (const rigidBody of rigidBodyRef.current) {
        setRigidBodyOptions(rigidBody, props, states, updateTranslations);
      }
    } else if (rigidBodyRef.current) {
      setRigidBodyOptions(
        rigidBodyRef.current,
        props,
        states,
        updateTranslations
      );
    }
  }, mutablePropsAsFlatArray);
};

export const useRigidBodyEvents = (
  rigidBodyRef: MutableRefObject<RigidBody | RigidBody[] | undefined>,
  props: RigidBodyProps,
  events: EventMap
) => {
  const {
    onWake,
    onSleep,
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit
  } = props;

  const eventHandlers = {
    onWake,
    onSleep,
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit
  };

  useEffect(() => {
    if (Array.isArray(rigidBodyRef.current)) {
      for (const rigidBody of rigidBodyRef.current) {
        events.set(rigidBody.handle, eventHandlers);
      }
    } else if (rigidBodyRef.current) {
      events.set(rigidBodyRef.current.handle, eventHandlers);
    }

    return () => {
      if (Array.isArray(rigidBodyRef.current)) {
        for (const rigidBody of rigidBodyRef.current) {
          events.delete(rigidBody.handle);
        }
      } else if (rigidBodyRef.current) {
        events.delete(rigidBodyRef.current.handle);
      }
    };
  }, [
    onWake,
    onSleep,
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter,
    onIntersectionExit
  ]);
};
