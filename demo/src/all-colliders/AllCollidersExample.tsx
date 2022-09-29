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
  RigidBodyProps
} from "@react-three/rapier";
import { useSuzanne } from "../all-shapes/AllShapesExample";
import { RoundedBoxGeometry } from "three-stdlib";
import { PlaneGeometry } from "three";

const CuteBox = (props: Omit<MeshProps, "args">) => (
  <Box castShadow receiveShadow {...props}>
    <meshPhysicalMaterial color="orange" />
  </Box>
);

const RigidBodyBox = (props: RigidBodyProps) => {
  return (
    <RigidBody {...props}>
      <Box castShadow receiveShadow>
        <meshPhysicalMaterial color="orange" />
      </Box>
    </RigidBody>
  );
};

const Suzanne = () => {
  const { nodes: suzanne } = useSuzanne();
  return (
    <primitive object={suzanne.Suzanne.clone()} castShadow receiveShadow />
  );
};

const heightFieldHeight = 10;
const heightFieldWidth = 10;
const heightField = Array.from({
  length: heightFieldHeight * heightFieldWidth
}).map((_, index) => {
  return Math.random();
});

const heightFieldGeometry = new PlaneGeometry(
  heightFieldWidth,
  heightFieldHeight,
  heightFieldWidth - 1,
  heightFieldHeight - 1
);

heightField.forEach((v, index) => {
  (heightFieldGeometry.attributes.position.array as number[])[
    index * 3 + 2
  ] = v;
});
heightFieldGeometry.scale(1, -1, 1);
heightFieldGeometry.rotateX(-Math.PI / 2);
heightFieldGeometry.rotateY(-Math.PI / 2);
heightFieldGeometry.computeVertexNormals();

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

      <RigidBody colliders={false} position={[0, -8, 0]}>
        <mesh geometry={heightFieldGeometry} castShadow receiveShadow>
          <meshPhysicalMaterial color="orange" side={2} />
        </mesh>
        <HeightfieldCollider
          args={[
            heightFieldWidth - 1,
            heightFieldHeight - 1,
            heightField,
            { x: heightFieldWidth, y: 1, z: heightFieldHeight }
          ]}
        />
        <Html>HeightfieldCollider</Html>
      </RigidBody>

      <RigidBodyBox position={[4, 10, 2]} />
    </group>
  );
};
