import { Cylinder, Sphere } from "@react-three/drei";
import {
  BallCollider,
  CylinderCollider,
  RapierRigidBody,
  RigidBody,
  RigidBodyOptions,
  useSphericalJoint
} from "@react-three/rapier";
import { useRef } from "react";
import { Demo } from "../../App";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

const Rod = (props: RigidBodyOptions) => {
  const anchor = useRef<RapierRigidBody>(null);
  const rod = useRef<RapierRigidBody>(null);

  useSphericalJoint(anchor, rod, [
    [0, 0, 0],
    [0, 0, 0]
  ]);

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
  useResetOrbitControls();

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
