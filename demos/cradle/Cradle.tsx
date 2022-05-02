import React from "react";
import { Cylinder, Sphere } from "@react-three/drei";
import {
  BallCollider,
  CylinderCollider,
  RigidBody,
  useSphericalJoint,
} from "../../src";
import { useRef } from "react";

const Rod = (props) => {
  const anchor = useRef();
  const rod = useRef();

  useSphericalJoint(anchor, rod, [
    [0, 0, 0],
    [0, 0, 0],
  ]);

  return (
    <group>
      <RigidBody ref={anchor} {...props} />
      <RigidBody ref={rod} {...props}>
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

        <CylinderCollider args={[2, 0.02]} position={[0, -1, 0]} />
        <BallCollider args={[0.2]} position={[0, -2, 0]} restitution={1.2} />
      </RigidBody>
    </group>
  );
};

export const CradleExample = ({ setUI }) => {
  setUI();

  return (
    <group>
      <Rod position={[0, 0, 0]} />
      <Rod position={[0.5, 0, 0]} />
      <Rod position={[1, 0, 0]} />
      <Rod position={[1.5, 0, 0]} />
      <Rod position={[2, 0, 0]} rotation={[0, 0, 1]} />
    </group>
  );
};
