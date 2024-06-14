import { Box, Sphere } from "@react-three/drei";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useRef } from "react";

const Ball = () => {
  const rb = useRef<RapierRigidBody>(null);

  return (
    <RigidBody ref={rb} colliders="ball" position={[0, 1, 0]} contactSkin={0.5}>
      <Sphere castShadow>
        <meshStandardMaterial color="orange" />
      </Sphere>
    </RigidBody>
  );
};

const Floor = () => {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[0, -2, 0]}>
      <Box args={[20, 1, 20]} receiveShadow>
        <meshStandardMaterial color="white" />
      </Box>
    </RigidBody>
  );
};

export const ContactSkinExample = () => {
  return (
    <group>
      <Ball />
      <Floor />
    </group>
  );
};
