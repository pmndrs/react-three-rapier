import { RigidBody } from "@react-three/rapier";
import { SoftBody } from "@react-three/rapier/soft-bodies";
import { Demo } from "../../App";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

/**
 * Volumetric (jelly) bodies: a cube and a sphere dropped on the floor, and a
 * rigid crate that lands on them.
 */
export const JellyExample: Demo = () => {
  useResetOrbitControls(10, [0, 1, 0]);

  return (
    <>
      <SoftBody type="volume" stiffness={6} damping={0.3} cellSize={0.3}>
        <mesh position={[-1.5, 3, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 1.2, 1.2, 6, 6, 6]} />
          <meshStandardMaterial color="#2a9d8f" />
        </mesh>
      </SoftBody>

      <SoftBody type="volume" stiffness={4} damping={0.2} cellSize={0.3}>
        <mesh position={[1.5, 4, 0]} castShadow receiveShadow>
          <icosahedronGeometry args={[0.7, 3]} />
          <meshStandardMaterial color="#e9c46a" />
        </mesh>
      </SoftBody>

      <RigidBody position={[-1.5, 6, 0.1]} colliders="cuboid" mass={2}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color="#264653" />
        </mesh>
      </RigidBody>
    </>
  );
};
