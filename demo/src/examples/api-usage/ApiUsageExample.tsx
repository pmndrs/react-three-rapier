import { Torus } from "@react-three/drei";
import { RigidBody, RigidBodyApi } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Demo } from "../../App";

export const ApiUsage: Demo = () => {
  const torus = useRef<RigidBodyApi>(null);

  useEffect(() => {
    if (torus.current) {
      torus.current.applyTorqueImpulse({
        x: 1,
        y: 3,
        z: 0
      });
    }

    const timer = setInterval(() => {
      if (torus.current) {
        torus.current.setTranslation({ x: 0, y: 0, z: 0 });
        torus.current.setLinvel({ x: 0, y: 5, z: 0 });
      }
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <group rotation={[0, 0, 0]} scale={1}>
      <RigidBody colliders="hull" ref={torus} restitution={2}>
        <Torus castShadow>
          <meshPhysicalMaterial />
        </Torus>
      </RigidBody>
    </group>
  );
};
