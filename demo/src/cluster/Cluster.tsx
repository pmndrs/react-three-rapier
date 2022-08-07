import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  InstancedRigidBodies,
  InstancedRigidBodyApi,
} from "@react-three/rapier";
import { createRef, useEffect, useRef } from "react";
import { Demo } from "../App";

const BALLS = 1000;

export const Cluster: Demo = () => {
  const api = useRef<InstancedRigidBodyApi>(null);

  useFrame(() => {
    api.current!.forEach((body) => {
      const p = body.translation();
      p.normalize().multiplyScalar(-0.01);
      body.applyImpulse(p);
    });
  });

  return (
    <group>
      <InstancedRigidBodies
        ref={api}
        positions={Array.from({ length: BALLS }, (_, i) => [
          Math.floor(i / 30) * 1,
          (i % 30) * 0.5,
          0,
        ])}
        colliders={"ball"}
      >
        <instancedMesh args={[undefined, undefined, BALLS]} castShadow>
          <sphereBufferGeometry args={[0.2]} />
          <meshPhysicalMaterial
            roughness={0}
            metalness={0.5}
            color={"yellow"}
          />
        </instancedMesh>
      </InstancedRigidBodies>
    </group>
  );
};
