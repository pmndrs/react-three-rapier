import {
  createContext, forwardRef, memo,
  MutableRefObject, ReactNode, RefObject, useContext, useImperativeHandle, useMemo
} from "react";
import { Object3D } from "three";
import { AnyCollider } from "./AnyCollider";
import { useRigidBody } from "./hooks";
import { RigidBodyApi, UseRigidBodyOptions } from "./types";

export const RigidBodyContext = createContext<{
  ref: RefObject<Object3D> | MutableRefObject<Object3D>;
  api: RigidBodyApi;
  options: UseRigidBodyOptions;
}>(undefined!);

export const useRigidBodyContext = () => useContext(RigidBodyContext);

export interface RigidBodyProps extends UseRigidBodyOptions {
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
