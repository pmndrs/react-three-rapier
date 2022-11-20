import { useFrame } from "@react-three/fiber";
import { forwardRef, memo, ReactNode, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import { Color, DynamicDrawUsage, InstancedMesh, Matrix4, Object3D, Vector3 } from "three";
import { AnyCollider } from "./AnyCollider";
import { RigidBodyApi } from "./api";
import { useChildColliderProps } from "./hooks";
import { InstancedRigidBody } from "./InstancedRigidBody";
import { RigidBody, RigidBodyProps } from "./RigidBody";
import { FiberToVector3 } from "./utils/FiberToVector3";


export type InstancedRigidBodyApi = readonly (RigidBodyApi | null)[];

export interface InstancedRigidBodiesProps extends RigidBodyProps {
  children: ReactNode;
  rigidBodies: readonly InstancedRigidBody[];
  colors?: boolean;
  colliderNodes?: ReactNode;
}

const _InstancedRigidBodies = forwardRef<InstancedRigidBodyApi, InstancedRigidBodiesProps>(
  function InstancedRigidBodies({ children, rigidBodies, colors, colliderNodes = <></>, ...baseBody }, ref) {

    const { _mx, _one, _scale, _globalScale, _worldPos, _oldColor, _newColor } = useMemo(() => ({
      _mx: new Matrix4,
      _scale: new Vector3,
      _globalScale: new Vector3,
      _worldPos: new Vector3(),
      _one: new Vector3(1, 1, 1),
      _oldColor: new Color,
      _newColor: new Color,
    }), [])

    const container = useRef<Object3D>(null);
    const mesh = useRef<InstancedMesh>();

    const colliders = useChildColliderProps(container, baseBody);
    const rigidBodiesApi = useRef<(RigidBodyApi | null)[]>([]);

    useImperativeHandle(ref, () => rigidBodiesApi.current);

    // update positions
    useFrame(() => {
      if (!mesh.current) return;
      mesh.current.getWorldScale(_globalScale);
      mesh.current.getWorldPosition(_worldPos);
      for (let i = 0; i < rigidBodiesApi.current.length; i++) {
        const body = rigidBodiesApi.current[i];
        if (!body) continue;
        const props = rigidBodies[i];
        const scale = FiberToVector3(props.scale || _one, _scale);
        const pos = body.translation().divide(_globalScale).sub(_worldPos);
        _mx.compose(pos, body.rotation(), scale);
        mesh.current.setMatrixAt(i, _mx);
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
          {colliderNodes}
        </RigidBody>
      ))}
    </>
  }
)

export const InstancedRigidBodies = memo(_InstancedRigidBodies);
InstancedRigidBodies.displayName = "InstancedRigidBodies";
