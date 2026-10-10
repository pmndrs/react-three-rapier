import { Cylinder, Sphere } from "@react-three/drei";
import {
  BallCollider,
  RapierRigidBody,
  RigidBody,
  RigidBodyOptions,
  useRevoluteJoint
} from "@react-three/rapier";
import { useRef } from "react";
import { Demo } from "../../App";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";

const Rod = (props: RigidBodyOptions) => {
  const anchor = useRef<RapierRigidBody>(null!);
  const rod = useRef<RapierRigidBody>(null!);

  useRevoluteJoint(anchor, rod, [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 1] // swing in the XY plane
  ]);

  return (
    <group>
      {/* a fixed anchor: no collider, and it never moves */}
      <RigidBody ref={anchor} {...props} type="fixed" />

      <RigidBody ref={rod} {...props} colliders={false}>
        <Cylinder
          scale={[0.15, 6, 0.15]}
          position={[0, -3, 0]}
          receiveShadow
          castShadow
        >
          <meshStandardMaterial color={"black"} />
        </Cylinder>
        <Sphere scale={0.6} position={[0, -6, 0]} receiveShadow castShadow>
          <meshStandardMaterial metalness={1} roughness={0.3} />
        </Sphere>

        <BallCollider args={[0.6]} position={[0, -6, 0]} restitution={1} />
      </RigidBody>
    </group>
  );
};

export const CradleExample: Demo = () => {
  useResetOrbitControls();

  return (
    // No group rotation/scale: body poses come from world matrices, so a tilted parent would
    // make the rods hang (and swing) in a tilted plane. Scale the rod geometry instead.
    <group position={[-2.4, 3, 0]}>
      <Rod position={[0, 0, 0]} />
      <Rod position={[1.2, 0, 0]} />
      <Rod position={[2.4, 0, 0]} />
      <Rod position={[3.6, 0, 0]} />
      <Rod position={[4.8, 0, 0]} rotation={[0, 0, 0.9]} />
    </group>
  );
};
