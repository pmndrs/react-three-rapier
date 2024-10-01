import { Box, Sphere, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RigidBody,
  RapierRigidBody,
  RigidBodyProps
} from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { MeshPhysicalMaterial } from "three";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

const material = new MeshPhysicalMaterial();

const Goal = (props: RigidBodyProps) => {
  const [intersecting, setIntersection] = useState(false);

  return (
    <RigidBody position={[0, 1, 0]}>
      <Box
        scale={[11, 1, 1]}
        position={[0, 3, 0]}
        material={material}
        castShadow
      />
      <Box
        scale={[1, 6, 1]}
        position={[-5, 0, 0]}
        material={material}
        castShadow
      />
      <Box
        scale={[1, 6, 1]}
        position={[5, 0, 0]}
        material={material}
        castShadow
      />

      <Box
        scale={[1, 1, 3]}
        position={[-5, -3, 0]}
        material={material}
        castShadow
      />
      <Box
        scale={[1, 1, 3]}
        position={[5, -3, 0]}
        material={material}
        castShadow
      />

      {intersecting && <Text fontSize={2}>Goal</Text>}

      <CuboidCollider
        position={[0, 0, 1]}
        args={[5, 3, 1]}
        sensor
        onIntersectionEnter={() => {
          setIntersection(true);
        }}
        onIntersectionExit={() => setIntersection(false)}
      />
    </RigidBody>
  );
};

const Ball = () => {
  const rb = useRef<RapierRigidBody>(null);

  const restartBall = () => {
    rb.current?.setTranslation({ x: 0, y: -7, z: -24 }, true);
    rb.current?.setLinvel({ x: 0, y: 0, z: 7 }, true);
  };

  useFrame(() => {
    if (rb.current) {
      if (rb.current.translation().z > 10) {
        restartBall();
      }
    }
  });

  useEffect(() => {
    restartBall();
  });

  return (
    <RigidBody ref={rb} colliders="ball" restitution={1.5}>
      <Sphere material={material} castShadow />
    </RigidBody>
  );
};

export const SensorsExample = () => {
  useResetOrbitControls(30);

  return (
    <group>
      <Goal />
      <Ball />
    </group>
  );
};
