import { Box, Cone, Cylinder, Html, Sphere } from "@react-three/drei";
import { MeshProps } from "@react-three/fiber";
import {
  BallCollider,
  CapsuleCollider,
  CuboidCollider,
  CylinderCollider,
  HeightfieldCollider,
  RigidBody,
  RoundCuboidCollider,
  ConeCollider,
  useRapier,
} from "@react-three/rapier";
import { useSuzanne } from "../all-shapes/AllShapes";
import { RoundedBoxGeometry } from "three-stdlib";

const CuteBox = (props: Omit<MeshProps, "args">) => (
  <Box castShadow receiveShadow {...props}>
    <meshPhysicalMaterial color="orange" />
  </Box>
);

const Suzanne = () => {
  const { nodes: suzanne } = useSuzanne();
  return (
    <primitive object={suzanne.Suzanne.clone()} castShadow receiveShadow />
  );
};

const roundBoxGeometry = new RoundedBoxGeometry(1.4, 1.4, 1.4, 8, 0.2);

export const AllCollidersExample = () => {
  const { rapier } = useRapier();

  return (
    <group>
      <RigidBody colliders={false}>
        <CuteBox />
        <CuboidCollider args={[0.5, 0.5, 0.5]} />

        <Html>CuboidCollider</Html>
      </RigidBody>

      <RigidBody position={[2, 0, 0]} colliders={false}>
        <mesh geometry={roundBoxGeometry} castShadow receiveShadow>
          <meshPhysicalMaterial color="orange" />
        </mesh>
        <RoundCuboidCollider args={[0.5, 0.5, 0.5, 0.2]} />

        <Html>RoundCuboidCollider</Html>
      </RigidBody>

      <RigidBody position={[4, 0, 0]} colliders={false}>
        <Sphere args={[0.5]} castShadow receiveShadow>
          <meshPhysicalMaterial color="orange" />
        </Sphere>
        <BallCollider args={[0.5]} />

        <Html>BallCollider</Html>
      </RigidBody>

      <RigidBody position={[6, 0, 0]} colliders={false}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshPhysicalMaterial color="orange" />
        </mesh>
        <CapsuleCollider args={[0.5, 0.5]} />

        <Html>CapsuleCollider</Html>
      </RigidBody>

      <RigidBody position={[15, 0, 0]} colliders={false}>
        <Cylinder args={[0.5, 0.5, 2]} castShadow receiveShadow>
          <meshPhysicalMaterial color="orange" />
        </Cylinder>
        <CylinderCollider args={[1, 0.5]} />

        <Html>CylinderCollider</Html>
      </RigidBody>

      <RigidBody position={[8, 0, 0]} colliders="trimesh">
        <Suzanne />

        <Html>TrimeshCollider</Html>
      </RigidBody>

      <RigidBody position={[11, 0, 0]} colliders="hull">
        <Suzanne />

        <Html>HullCollider</Html>
      </RigidBody>

      <RigidBody colliders={false}>
        <Cone args={[0.5, 2]} castShadow receiveShadow>
          <meshPhysicalMaterial color="orange" />
        </Cone>
        <ConeCollider args={[1, 0.5]} />
        <Html>ConeCollider</Html>
      </RigidBody>
    </group>
  );
};
