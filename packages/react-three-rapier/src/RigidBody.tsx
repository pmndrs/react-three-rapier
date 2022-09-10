import React, { createContext, MutableRefObject, RefObject } from "react";
import { forwardRef, ReactNode, useContext, useImperativeHandle } from "react";
import { Object3D } from "three";
import { Object3DProps } from "@react-three/fiber";
import { InstancedRigidBodyApi } from "./api";
import { useRigidBody } from "./hooks";
import { InstancedRigidBodiesProps } from "./InstancedRigidBodies";
import { RigidBodyApi, UseRigidBodyOptions } from "./types";

export const RigidBodyContext = createContext<{
  ref: RefObject<Object3D> | MutableRefObject<Object3D>;
  api: RigidBodyApi | InstancedRigidBodyApi;
  hasCollisionEvents: boolean;
  options: UseRigidBodyOptions | InstancedRigidBodiesProps;
}>(undefined!);

export const useRigidBodyContext = () => useContext(RigidBodyContext);
// RigidBody
export interface RigidBodyProps extends UseRigidBodyOptions {
  children?: ReactNode;
}

export const RigidBody = forwardRef<RigidBodyApi, RigidBodyProps>(
  ({ children, ...props }, ref) => {
    const [object, api] = useRigidBody<Object3D>(props);
    const { type, position, rotation, ...objectProps } = props;

    useImperativeHandle(ref, () => api);

    return (
      <RigidBodyContext.Provider
        value={{
          ref: object,
          api,
          hasCollisionEvents: !!(
            props.onCollisionEnter || props.onCollisionExit
          ),
          options: props,
        }}
      >
        <object3D ref={object} {...objectProps}>
          {children}
        </object3D>
      </RigidBodyContext.Provider>
    );
  }
);
