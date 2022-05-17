import React, {
  createRef,
  forwardRef,
  MutableRefObject,
  RefObject,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "./hooks";
import { Collider, ColliderHandle, ShapeType } from "@dimforge/rapier3d-compat";
import {
  BoxBufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
} from "three";

const geometryFromCollider = (collider: Collider) => {
  // if (collider.shapeType === ShapeType.Cuboid) {
  //   return new BoxBufferGeometry(
  //     collider.halfExtents.x * 2,
  //     collider.halfExtents.y * 2,
  //     collider.halfExtents.z * 2
  //   );
  // }

  return new BoxBufferGeometry(1, 1, 1);
};

export const RapierDebug = () => {
  const { world } = useRapier();
  const [colliders, setColliders] = useState<Collider[]>([]);
  const refs = useRef<Record<number, RefObject<Mesh>>>({});

  const dynamicRef = (id: number) => {
    if (!refs.current[id]) {
      refs.current[id] = createRef();
    }
    return refs.current[id];
  };

  useFrame(() => {
    const newColliders: Collider[] = [];

    world.colliders.forEachCollider((collider) => {
      const { x: rx, y: ry, z: rz, w: rw } = collider.rotation();
      const { x, y, z } = collider.translation();

      const ref = refs.current[collider.handle];
      newColliders.push(collider);

      if (ref && ref.current) {
        ref.current.position.set(x, y, z);
        ref.current.rotation.setFromQuaternion(new Quaternion(rx, ry, rz, rw));
      }
    });

    setColliders(newColliders);
  });

  return (
    <group>
      {colliders.map((collider) => (
        <mesh key={collider.handle} ref={dynamicRef(collider.handle)}>
          {/* {collider.shapeType() === ShapeType.Cuboid && (
            <boxBufferGeometry
              args={[
                collider.halfExtents.x * 2.1,
                collider.halfExtents.y * 2.1,
                collider.halfExtents.z * 2.1,
              ]}
            />
          )} */}
          <meshBasicMaterial color={"red"} wireframe />
        </mesh>
      ))}
    </group>
  );
};
