import React, { createContext, MutableRefObject } from "react";
import { forwardRef, ReactNode, useContext, useImperativeHandle } from "react";
import { Object3D } from "three";
import { useRigidBody } from "./hooks";
import { RigidBodyApi, UseRigidBodyOptions } from "./types";

const RigidBodyContext = createContext<{
  ref: MutableRefObject<Object3D>;
  api: RigidBodyApi;
  hasCollisionEvents: boolean;
  options: UseRigidBodyOptions;
}>(undefined!);

export const useRigidBodyContext = () => useContext(RigidBodyContext);
// RigidBody
export interface RigidBodyProps extends UseRigidBodyOptions {
  children?: ReactNode;
}

export const RigidBody = forwardRef<RigidBodyApi, RigidBodyProps>(
  ({ children, ...props }, ref) => {
    const [object, api] = useRigidBody<Object3D>(props);

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
        <object3D ref={object}>{children}</object3D>
      </RigidBodyContext.Provider>
    );
  }
);
