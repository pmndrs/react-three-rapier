import { RigidBody, useBeforePhysicsStep } from "@react-three/rapier";
import { SoftBody, SoftBodyState } from "@react-three/rapier/soft-bodies";
import { useRef } from "react";
import { DoubleSide } from "three";
import { Demo } from "../../App";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

/**
 * A flag pinned along its left edge, blown by a gusty wind, next to a
 * ball that gets draped in cloth.
 */
export const ClothExample: Demo = () => {
  useResetOrbitControls(8, [0, 2, 0]);
  const flag = useRef<SoftBodyState>(null);

  useBeforePhysicsStep(() => {
    const body = flag.current?.body;
    if (!body) return;
    const t = performance.now() / 1000;
    const gust = 0.6 + 0.4 * Math.sin(t * 1.7);
    body.addForce({ x: 0, y: 0, z: 6 * gust }, true);
  });

  return (
    <>
      {/* flagpole */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-1.55, 2, 0]} castShadow>
          <boxGeometry args={[0.1, 4, 0.1]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </RigidBody>

      <SoftBody
        ref={flag}
        type="cloth"
        stiffness={14}
        damping={0.4}
        // pin the left edge (local x = -1.5)
        pinned={(p) => p.x < -1.49}
      >
        <mesh position={[0, 3, 0]} castShadow receiveShadow>
          <planeGeometry args={[3, 1.8, 30, 18]} />
          <meshStandardMaterial color="#e63946" side={DoubleSide} />
        </mesh>
      </SoftBody>

      {/* a tablecloth over a ball */}
      <RigidBody type="fixed" colliders="ball" position={[3.5, 0.6, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.6]} />
          <meshStandardMaterial color="#457b9d" />
        </mesh>
      </RigidBody>
      <SoftBody type="cloth" stiffness={8} damping={0.6} particleRadius={0.03}>
        <mesh
          position={[3.5, 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[2.2, 2.2, 24, 24]} />
          <meshStandardMaterial color="#f1faee" side={DoubleSide} />
        </mesh>
      </SoftBody>
    </>
  );
};
