import { useFrame } from "@react-three/fiber";
import {
  InstancedRigidBodies,
  InstancedRigidBodiesApi,
  useRapier
} from "@react-three/rapier";
import { createRef, useEffect, useRef } from "react";
import { Demo } from "../../App";

const BALLS = 1000;

export const Cluster: Demo = () => {
  const api = useRef<InstancedRigidBodiesApi>(null);

  const { isPaused } = useRapier();

  useFrame(() => {
    if (!isPaused) {
      api.current!.forEach((body) => {
        const p = body!.translation();
        p.normalize().multiplyScalar(-0.01);
        body!.applyImpulse(p);
      });
    }
  });

  return (
    <group>
      <InstancedRigidBodies
        ref={api}
        instances={Array.from({ length: BALLS }, (_, i) => ({
          key: i,
          position: [Math.floor(i / 30) * 1, (i % 30) * 0.5, 0]
        }))}
        colliders={"ball"}
        linearDamping={5}
      >
        <instancedMesh args={[undefined, undefined, BALLS]} castShadow>
          <sphereGeometry args={[0.2]} />
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
