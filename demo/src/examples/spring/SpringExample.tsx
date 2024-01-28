import { Sphere } from "@react-three/drei";
import {
  BallCollider,
  RapierRigidBody,
  RigidBody,
  RigidBodyOptions,
  useSpringJoint
} from "@react-three/rapier";
import { useRef } from "react";
import { Demo } from "../../App";

const Spring = (props: RigidBodyOptions) => {
  const anchor = useRef<RapierRigidBody>(null);
  const ball = useRef<RapierRigidBody>(null);

  useSpringJoint(anchor, ball, [[0, 0, 0], [0, 0, 0], 2, 20, 2]);

  return (
    <group>
      <RigidBody ref={anchor} {...props} />

      <RigidBody ref={ball} {...props} colliders={false}>
        <Sphere scale={0.2} receiveShadow castShadow>
          <meshStandardMaterial metalness={1} roughness={0.3} />
        </Sphere>

        <BallCollider args={[0.2]} restitution={1.2} />
      </RigidBody>
    </group>
  );
};

export const SpringExample: Demo = () => {
  return (
    <group scale={3}>
      <Spring position={[0, 0, 0]} />
    </group>
  );
};
