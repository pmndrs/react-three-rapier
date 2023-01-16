import React, {
  createContext,
  memo,
  MutableRefObject,
  RefObject,
  useMemo
} from "react";
import { forwardRef, ReactNode, useContext, useImperativeHandle } from "react";
import { Object3D } from "three";
import { InstancedRigidBodyApi, RigidBodyApi } from "./api";
import { useRigidBody } from "./hooks";
import { InstancedRigidBodiesProps } from "./InstancedRigidBodies";
import { RigidBodyOptions } from "./types";
import { AnyCollider } from "./AnyCollider";

export const RigidBodyContext = createContext<{
  ref: RefObject<Object3D> | MutableRefObject<Object3D>;
  api: RigidBodyApi | InstancedRigidBodyApi;
  options: RigidBodyOptions | InstancedRigidBodiesProps;
}>(undefined!);

export const useRigidBodyContext = () => useContext(RigidBodyContext);

export interface RigidBodyProps extends RigidBodyOptions {
  children?: ReactNode;
}

export const RigidBody = memo(
  forwardRef<RigidBodyApi, RigidBodyProps>((props, ref) => {
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

    const contextValue = useMemo(
      () => ({
        ref: object,
        api,
        options: props
      }),
      [object, api, props]
    );

    return (
      <RigidBodyContext.Provider value={contextValue}>
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
  })
);

RigidBody.displayName = "RigidBody";
