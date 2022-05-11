import { Box } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Demo } from "../App";

export const Transforms: Demo = () => {
  return (
    <group rotation={[0, 0, 1]}>
      <Box castShadow receiveShadow scale={[5, 5, 0.5]} position={[0, 0, -2]}>
        <meshPhysicalMaterial />
      </Box>

      <RigidBody position={[-3, 0, 1]}>
        <Box castShadow receiveShadow>
          <meshPhysicalMaterial />
        </Box>
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
      </RigidBody>
      <RigidBody position={[0, 0, 1]}>
        <Box castShadow receiveShadow>
          <meshPhysicalMaterial />
        </Box>
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
      </RigidBody>
      <RigidBody position={[3, 0, 1]}>
        <Box castShadow receiveShadow>
          <meshPhysicalMaterial />
        </Box>
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
      </RigidBody>
    </group>
  );
};
