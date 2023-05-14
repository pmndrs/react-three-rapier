import React, {
  createContext,
  memo,
  MutableRefObject,
  RefObject,
  useEffect,
  useMemo,
  useRef
} from "react";
import { forwardRef, ReactNode, useContext, useImperativeHandle } from "react";
import { Object3D } from "three";
import { useChildColliderProps, useRapier } from "../hooks/hooks";
import { RapierRigidBody, RigidBodyOptions } from "../types";
import { AnyCollider } from "./AnyCollider";
import {
  rigidBodyDescFromOptions,
  createRigidBodyState,
  useUpdateRigidBodyOptions,
  useRigidBodyEvents,
  immutableRigidBodyOptions
} from "../utils/utils-rigidbody";
import { useImperativeInstance } from "../hooks/use-imperative-instance";

export const RigidBodyContext = createContext<{
  ref: RefObject<Object3D> | MutableRefObject<Object3D>;
  getRigidBody: () => RapierRigidBody;
  options: RigidBodyOptions;
}>(undefined!);

export const useRigidBodyContext = () => useContext(RigidBodyContext);

export interface RigidBodyProps extends RigidBodyOptions {
  children?: ReactNode;
}

/**
 * A rigid body is a physical object that can be simulated by the physics engine.
 * @category Components
 */
export const RigidBody = memo(
  forwardRef<RapierRigidBody, RigidBodyProps>((props, forwardedRef) => {
    const {
      children,

      type,
      position,
      rotation,
      scale,

      quaternion,
      transformState,
      ...objectProps
    } = props;

    const ref = useRef<Object3D>(null);
    const { world, rigidBodyStates, physicsOptions, rigidBodyEvents } =
      useRapier();

    const mergedOptions = useMemo(() => {
      return {
        ...physicsOptions,
        ...props,
        children: undefined
      };
    }, [physicsOptions, props]);

    const immutablePropArray = immutableRigidBodyOptions.flatMap((key) => {
      return Array.isArray(mergedOptions[key])
        ? [...mergedOptions[key]]
        : mergedOptions[key];
    });

    const childColliderProps = useChildColliderProps(ref, mergedOptions);

    // Provide a way to eagerly create rigidbody
    const getRigidBody = useImperativeInstance(
      () => {
        const desc = rigidBodyDescFromOptions(mergedOptions);
        const rigidBody = world.createRigidBody(desc);

        return rigidBody;
      },
      (rigidBody) => {
        world.removeRigidBody(rigidBody);
      },
      immutablePropArray
    );

    // Only provide a object state after the ref has been set
    useEffect(() => {
      const rigidBody = getRigidBody();

      const state = createRigidBodyState({
        rigidBody,
        object: ref.current!
      });

      rigidBodyStates.set(
        rigidBody.handle,
        props.transformState ? props.transformState(state) : state
      );

      return () => {
        rigidBodyStates.delete(rigidBody.handle);
      };
    }, [getRigidBody]);

    useUpdateRigidBodyOptions(getRigidBody, mergedOptions, rigidBodyStates);
    useRigidBodyEvents(getRigidBody, mergedOptions, rigidBodyEvents);

    useImperativeHandle(forwardedRef, () => getRigidBody(), [getRigidBody]);

    const contextValue = useMemo(() => {
      return {
        ref,
        getRigidBody: getRigidBody,
        options: mergedOptions
      };
    }, [getRigidBody]);

    return (
      <RigidBodyContext.Provider value={contextValue}>
        <object3D
          ref={ref}
          {...objectProps}
          position={position}
          rotation={rotation}
          quaternion={quaternion}
          scale={scale}
        >
          {children}

          {childColliderProps.map((colliderProps, index) => (
            <AnyCollider key={index} {...colliderProps} />
          ))}
        </object3D>
      </RigidBodyContext.Provider>
    );
  })
);

RigidBody.displayName = "RigidBody";
