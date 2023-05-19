import { Cylinder, Sphere } from "@react-three/drei";
import {
  BallCollider,
  CylinderCollider,
  RapierRigidBody,
  RigidBody,
  RigidBodyOptions,
  useRapier,
  useSphericalJoint
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Demo } from "../../App";

const Rod = (props: RigidBodyOptions) => {
  const anchor = useRef<RapierRigidBody>(null);
  const rod = useRef<RapierRigidBody>(null);

  useSphericalJoint(anchor, rod, [
    [0, 0, 0],
    [0, 0, 0]
  ]);

  const { world } = useRapier();

  useEffect(() => {
    world.maxStabilizationIterations = 10;
  }, []);

  return (
    <group>
      <RigidBody ref={anchor} {...props} />

      <RigidBody ref={rod} {...props} colliders={false}>
        <Cylinder
          scale={[0.05, 2, 0.05]}
          position={[0, -1, 0]}
          receiveShadow
          castShadow
        >
          <meshStandardMaterial color={"black"} />
        </Cylinder>
        <Sphere scale={0.2} position={[0, -2, 0]} receiveShadow castShadow>
          <meshStandardMaterial metalness={1} roughness={0.3} />
        </Sphere>

        <CylinderCollider args={[1, 0.05]} position={[0, -1, 0]} />
        <BallCollider args={[0.2]} position={[0, -2, 0]} restitution={1.2} />
      </RigidBody>
    </group>
  );
};

export const CradleExample: Demo = () => {
  return (
    <group rotation={[1, 0, 0]} scale={3}>
      <Rod position={[0, 0, 0]} />
      <Rod position={[0.5, 0, 0]} />
      <Rod position={[1, 0, 0]} />
      <Rod position={[1.5, 0, 0]} />
      <Rod position={[2, 0, 0]} rotation={[0.0, 0, 2]} />
    </group>
  );
};
