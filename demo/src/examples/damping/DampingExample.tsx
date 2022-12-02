import { Box, Sphere, useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { RepeatWrapping } from "three";
import { Demo } from "../../App";

export const Damping: Demo = () => {
  const floor = useTexture(new URL("./white.png", import.meta.url).toString());
  const ramp = useTexture(new URL("./red.png", import.meta.url).toString());
  const ball = useTexture(new URL("./green.png", import.meta.url).toString());

  floor.wrapS = floor.wrapT = RepeatWrapping;

  const balls = Array.from(Array(10).keys());

  return (
    <>
      <group>
        <RigidBody type="fixed" colliders="cuboid">
          <Box args={[40, 1, 100]} position={[18, -1, 25]}>
            <meshStandardMaterial map={floor} />
          </Box>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid">
          <Box
            args={[40, 0.5, 14]}
            position={[18, 2, -5]}
            rotation={[Math.PI / 8, 0, 0]}
          >
            <meshStandardMaterial map={ramp} />
          </Box>
        </RigidBody>

        {balls.map((i) => (
          <RigidBody
            key={i}
            colliders="ball"
            position={[i * 3, 10, -10]}
            angularDamping={i / 10}
          >
            <Sphere>
              <meshStandardMaterial map={ball} />
            </Sphere>
          </RigidBody>
        ))}
      </group>
    </>
  );
};
