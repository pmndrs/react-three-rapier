import { Box, Sphere } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useState } from "react";
import { Demo } from "../App";

const Ball = () => {
  return (
    <RigidBody colliders="ball" restitution={2} position={[0, 20, 0]}>
      <Sphere castShadow receiveShadow>
        <meshPhysicalMaterial color="red" />
      </Sphere>
    </RigidBody>
  );
};

const Sensor = () => {
  const [color, setColor] = useState("blue");

  const toggleColor = () => {
    if (color === "blue") {
      setColor("green");
    } else {
      setColor("blue");
    }
  };

  return (
    <RigidBody
      colliders={"cuboid"}
      colliderType={"sensor"}
      type="fixed"
      restitution={1}
      onCollisionEnter={e => toggleColor()}
      onCollisionExit={e => toggleColor()}
    >
      <Box args={[10, 5, 10]}>
        <meshPhysicalMaterial color={color} />
      </Box>
    </RigidBody>
  );
};

export const ColliderSensor: Demo = () => {
  return (
    <group>
      <Ball />
      <Sensor />
    </group>
  );
};
