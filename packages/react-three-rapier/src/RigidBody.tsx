import React, {
  createContext,
  MutableRefObject,
  RefObject,
  useMemo
} from "react";
import { forwardRef, ReactNode, useContext, useImperativeHandle } from "react";
import { Object3D } from "three";
import { Object3DProps } from "@react-three/fiber";
import { InstancedRigidBodyApi } from "./api";
import { useRigidBody } from "./hooks";
import { InstancedRigidBodiesProps } from "./InstancedRigidBodies";
import { RigidBodyApi, UseRigidBodyOptions } from "./types";
import { AnyCollider } from "./AnyCollider";

export const RigidBodyContext = createContext<{
  ref: RefObject<Object3D> | MutableRefObject<Object3D>;
  api: RigidBodyApi | InstancedRigidBodyApi;
  options: UseRigidBodyOptions | InstancedRigidBodiesProps;
}>(undefined!);

export const useRigidBodyContext = () => useContext(RigidBodyContext);

export interface RigidBodyProps extends UseRigidBodyOptions {
  children?: ReactNode;
}

export const RigidBody = forwardRef<RigidBodyApi, RigidBodyProps>(
  (props, ref) => {
    const {
      children,
      type,
      position,
      rotation,
      scale,
      quaternion,
      ...objectProps
    } = props;
    const [object, api, childColliderProps] = useRigidBody<Object3D>(props);

    useImperativeHandle(ref, () => api);

    return (
      <RigidBodyContext.Provider
        value={{
          ref: object,
          api,
          options: props
        }}
      >
        <object3D
          ref={object}
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
  }
);
