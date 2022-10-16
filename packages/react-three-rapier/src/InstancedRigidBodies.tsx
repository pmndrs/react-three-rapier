import { useFrame } from "@react-three/fiber";
import { forwardRef, memo, ReactNode, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { Color, DynamicDrawUsage, InstancedMesh, Matrix4, Object3D, Vector3 } from "three";
import { InstancedRigidBody } from "./InstancedRigidBody";
import {useChildColliderProps} from "./hooks";
import { Representation2Vector3 } from "./utils/Representation2Vector3";
import { _matrix4, _vector3 } from "./shared-objects";
import { RigidBodyApi } from "./api";
import { RigidBody, RigidBodyProps } from "./RigidBody";
import { AnyCollider } from "./AnyCollider";
const _one = new Vector3(1, 1, 1);
const _oldColor = new Color;
const _newColor = new Color;

export type InstancedRigidBodyApi = readonly (RigidBodyApi | null)[];

export interface InstancedRigidBodiesProps extends RigidBodyProps {
  children: ReactNode;
  rigidBodies: readonly InstancedRigidBody[];
  colors?: boolean;
}

const _InstancedRigidBodies = forwardRef<InstancedRigidBodyApi, InstancedRigidBodiesProps>(
  function InstancedRigidBodies({ children, rigidBodies, colors, ...baseBody }, ref) {
    const container = useRef<Object3D>(null);
    const mesh = useRef<InstancedMesh>();

    const colliders = useChildColliderProps(container, baseBody);
    const rigidBodiesApi = useRef<(RigidBodyApi | null)[]>([]);

    useImperativeHandle(ref, () => rigidBodiesApi.current);

    // update positions
    useFrame(() => {
      if (!mesh.current) return;
      for (let i = 0; i < rigidBodiesApi.current.length; i++) {
        const body = rigidBodiesApi.current[i];
        if (!body) continue;
        const props = rigidBodies[i];
        const scale = props.scale || _one;
        _matrix4.compose(body.translation(), body.rotation(), Representation2Vector3(scale, _vector3));
        mesh.current.setMatrixAt(i, _matrix4);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
    })

    // update colours
    useFrame(() => {
      if (!mesh.current) return;
      // ignore if colors are not required and not defined
      if (!colors && !mesh.current.instanceColor) return;
      let didChange = false;
      for (let i = 0; i < rigidBodiesApi.current.length; i++) {
        const body = rigidBodiesApi.current[i];
        if (!body) continue;
        const props = rigidBodies[i];
        _newColor.set(props.color === undefined || !colors ? 0xffffff : props.color);
        if (mesh.current.instanceColor) {
          mesh.current.getColorAt(i, _oldColor);
          if (_oldColor.equals(_newColor)) continue;
        }
        mesh.current.setColorAt(i, _newColor);
        didChange = true;
      }
      if (didChange && mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    })

    useLayoutEffect(() => {
      if (!container.current) return;
      mesh.current = container.current.children[0] as InstancedMesh;

      if (!mesh.current || !mesh.current.isInstancedMesh) {
        console.error("`InstancedRigidBodies` expects an `InstancedMesh` as a children");
        return;
      }

      mesh.current.instanceMatrix.setUsage(DynamicDrawUsage);
    }, [children]);

    useLayoutEffect(() => {
      if (colors) return;
      if (!mesh.current?.instanceColor) return;
      // if colors disabled, reset them to white
      _newColor.set(0xffffff);
      for (let i = 0; i < mesh.current.count; i++) {
        mesh.current.setColorAt(i, _newColor);
      }
      mesh.current.instanceColor.needsUpdate = true;
    }, [colors])

    return <>
      <object3D ref={container}>
        {children}
      </object3D>
      {rigidBodies.map((props, x) => (
        <RigidBody
          {...baseBody}
          {...props}
          ref={el => rigidBodiesApi.current[x] = el}
        >
          {colliders && colliders.map((c, i) => <AnyCollider key={i} {...c} />)}
        </RigidBody>
      ))}
    </>
  }
)

export const InstancedRigidBodies = memo(_InstancedRigidBodies);