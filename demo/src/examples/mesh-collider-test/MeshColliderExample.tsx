import { Box, Sphere, Torus } from "@react-three/drei";
import { MeshCollider, RigidBody } from "@react-three/rapier";
import { Demo } from "../../App";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

export const MeshColliderTest: Demo = () => {
  useResetOrbitControls(30);

  return (
    <group>
      <RigidBody position={[0, 2, 0]} colliders={false}>
        <MeshCollider type="hull">
          <Torus castShadow scale={5} receiveShadow>
            <meshPhysicalMaterial />
          </Torus>
        </MeshCollider>
        <MeshCollider type="cuboid">
          <Box position={[0, 0, 3]}>
            <meshPhysicalMaterial />
          </Box>
        </MeshCollider>

        <MeshCollider type="cuboid">
          <Box position={[0, 0, 0]} args={[1, 1, 6]} visible={false}>
            <meshPhysicalMaterial />
          </Box>
        </MeshCollider>

        <Sphere position={[0, 2, 4]}>
          <meshPhysicalMaterial color="blue" />
        </Sphere>
        <Sphere position={[0, 1, 4]}>
          <meshPhysicalMaterial color="blue" />
        </Sphere>
        <Sphere position={[0, 3, 4]}>
          <meshPhysicalMaterial color="blue" />
        </Sphere>
      </RigidBody>

      <RigidBody colliders="cuboid" position={[0, 0, 4]} restitution={2}>
        <MeshCollider type="ball">
          <Sphere castShadow receiveShadow>
            <meshPhysicalMaterial />
          </Sphere>
        </MeshCollider>

        <Sphere castShadow receiveShadow position={[2, 0, 0]}>
          <meshPhysicalMaterial />
        </Sphere>
      </RigidBody>

      <RigidBody
        colliders={false}
        position={[0, -8, 0]}
        type="kinematicPosition"
      >
        <MeshCollider type="cuboid">
          <Box args={[40, 1, 40]} castShadow receiveShadow>
            <meshPhysicalMaterial />
          </Box>
          <Box
            args={[2, 1, 2]}
            position={[1, 1, 1]}
            rotation={[1, 1, 1]}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial />
          </Box>
        </MeshCollider>
      </RigidBody>
    </group>
  );
};
