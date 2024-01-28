import { Sphere } from "@react-three/drei";
import {
  BallCollider,
  RapierRigidBody,
  RigidBody,
  RigidBodyOptions,
  useRopeJoint
} from "@react-three/rapier";
import { useRef } from "react";
import { Demo } from "../../App";

// todo: flesh out this demo

const RopeJoint = (props: RigidBodyOptions) => {
  const anchor = useRef<RapierRigidBody>(null);
  const ball = useRef<RapierRigidBody>(null);

  useRopeJoint(anchor, ball, [[0, 0, 0], [0, 0, 0], 1]);

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

export const RopeJointExample: Demo = () => {
  return (
    <group scale={3}>
      <RopeJoint position={[0, 0, 0]} />
    </group>
  );
};
