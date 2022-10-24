import { useFrame } from "@react-three/fiber";
import {
  Attractor,
  CuboidCollider,
  InstancedRigidBodies,
  InstancedRigidBodyApi,
  useRapier
} from "@react-three/rapier";
import { createRef, useEffect, useRef } from "react";
import { Demo } from "../App";

const BALLS = 100;

export const AttractorExample: Demo = () => {
  const api = useRef<InstancedRigidBodyApi>(null);

  return (
    <group>
      <InstancedRigidBodies
        ref={api}
        positions={Array.from({ length: BALLS }, (_, i) => [
          Math.floor(i / 30) * 1,
          (i % 30) * 0.5,
          0
        ])}
        colliders={"ball"}
      >
        <instancedMesh args={[undefined, undefined, BALLS]} castShadow>
          <sphereGeometry args={[1]} />
          <meshPhysicalMaterial
            roughness={0.5}
            metalness={0.5}
            color={"green"}
          />
        </instancedMesh>
      </InstancedRigidBodies>

      <Attractor range={20} strength={2} />
    </group>
  );
};
