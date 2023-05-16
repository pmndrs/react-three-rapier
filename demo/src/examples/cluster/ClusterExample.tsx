import { useFrame } from "@react-three/fiber";
import {
  InstancedRigidBodies,
  RapierRigidBody,
  useRapier,
  vec3
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Color, InstancedMesh } from "three";
import { Demo } from "../../App";

const BALLS = 1000;

export const Cluster: Demo = () => {
  const api = useRef<RapierRigidBody[]>(null);

  const { isPaused } = useRapier();

  const ref = useRef<InstancedMesh>(null);

  useFrame(() => {
    if (!isPaused) {
      api.current!.forEach((body) => {
        const p = vec3(body!.translation());
        p.normalize().multiplyScalar(-0.01);
        body!.applyImpulse(p, true);
      });
    }
  });

  useEffect(() => {
    if (ref.current) {
      console.log(api);

      for (let i = 0; i < BALLS; i++) {
        ref.current!.setColorAt(i, new Color(Math.random() * 0xffffff));
      }
      ref.current!.instanceColor!.needsUpdate = true;
    }
  }, []);

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
        <instancedMesh
          ref={ref}
          args={[undefined, undefined, BALLS]}
          castShadow
        >
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
