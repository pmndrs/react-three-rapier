import { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import { Environment, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RigidBodyApi } from "@react-three/rapier";
import { createRef, useEffect, useRef } from "react";
import { Demo } from "../App";

const BALLS = 1000;

export const Cluster: Demo = ({ setUI }) => {
  useEffect(() => {
    setUI("");
  }, []);

  const refs = useRef(
    Array.from({ length: BALLS }).map(() => createRef<RigidBodyApi>())
  );

  useFrame(() => {
    refs.current.forEach((ref) => {
      const p = ref.current!.translation();
      p.normalize().multiplyScalar(-0.02);

      ref.current?.applyImpulse(p);
    });
  });

  return (
    <group>
      {Array.from({ length: BALLS }).map((_, i) => (
        <RigidBody
          position={[Math.floor(i / 30) * 0.5, (i % 30) * 0.5, 0]}
          colliders="ball"
          ref={refs.current[i]}
          key={i}
        >
          <Sphere scale={0.2}>
            <meshPhysicalMaterial
              roughness={0}
              metalness={0.5}
              color={
                "#" +
                Math.floor(Math.random() * 0xffffff)
                  .toString(16)
                  .padEnd(6, "0")
              }
            />
          </Sphere>
        </RigidBody>
      ))}
    </group>
  );
};
