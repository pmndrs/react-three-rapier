import { Box, Sphere } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { Group } from "three";
import { Demo } from "../../App";
import { resetOrbitControl } from "../../hooks/resetOrbitControl";

export const Transforms: Demo = () => {
  const group = useRef<Group>(null);
  resetOrbitControl();
  return (
    <group>
      <group rotation={[2, 2, 6]} position={[0, -5, 0]} scale={1.2} ref={group}>
        <RigidBody
          position={[-0.5, 2, 1]}
          colliders="ball"
          onCollisionEnter={console.log}
        >
          <Sphere scale={0.2} castShadow receiveShadow>
            <meshPhysicalMaterial />
          </Sphere>
        </RigidBody>
        <RigidBody position={[0, 0, 1]} colliders="cuboid">
          <Box
            castShadow
            receiveShadow
            scale={2}
            position={[0, 0, 2]}
            rotation={[2, 1, 3]}
          >
            <meshPhysicalMaterial />
          </Box>
          <Box castShadow receiveShadow scale={1} position={[2, 0, 0]}>
            <meshPhysicalMaterial />
          </Box>
        </RigidBody>
        <RigidBody position={[3, 0, 1]} colliders="cuboid">
          <Box castShadow receiveShadow>
            <meshPhysicalMaterial />
          </Box>
        </RigidBody>
      </group>

      <group rotation={[1, 1, 1]} scale={1.1}>
        <RigidBody>
          <group scale={1} rotation={[2, 0, 1]} position={[1, 4, 1]}>
            <Box
              castShadow
              receiveShadow
              material-color="blue"
              scale={[1, 1, 8]}
            />

            <Box material-color="blue" position={[1, 2, 3]} />
          </group>
        </RigidBody>
      </group>

      <group rotation={[0, 3, 0]}>
        <RigidBody colliders="ball">
          <Sphere position={[2, 2, 2]} />
        </RigidBody>

        <RigidBody colliders="ball">
          <Sphere position={[2, 10, 2]} scale={0.3} castShadow receiveShadow>
            <meshPhysicalMaterial />
          </Sphere>
        </RigidBody>

        <RigidBody colliders="ball">
          <Sphere position={[-2, 10, 2]} scale={0.3} castShadow receiveShadow>
            <meshPhysicalMaterial />
          </Sphere>
        </RigidBody>
      </group>
    </group>
  );
};
