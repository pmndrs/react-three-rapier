import { Box, Cylinder } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Debug,
  RigidBody,
  RigidBodyApi,
  RigidBodyApiRef,
  useRevoluteJoint,
  Vector3Array
} from "@react-three/rapier";
import { createRef, useRef } from "react";
import { Demo } from "../App";

const WheelJoint = ({
  body,
  wheel,
  bodyAnchor,
  wheelAnchor,
  rotationAxis
}: {
  body: RigidBodyApiRef;
  wheel: RigidBodyApiRef;
  bodyAnchor: Vector3Array;
  wheelAnchor: Vector3Array;
  rotationAxis: Vector3Array;
}) => {
  const joint = useRevoluteJoint(body, wheel, [
    bodyAnchor,
    wheelAnchor,
    rotationAxis
  ]);
  return null;
};

export const Car: Demo = () => {
  const bodyRef = useRef<RigidBodyApi>(null);
  const wheelPositions: [number, number, number][] = [
    [-3, 0, 2],
    [-3, 0, -2],
    [3, 0, 2],
    [3, 0, -2]
  ];
  const wheelRefs = useRef(wheelPositions.map(() => createRef<RigidBodyApi>()));

  useFrame(() => {
    wheelRefs.current.forEach((ref) => {
      ref.current?.applyTorqueImpulse({ x: 0, y: 0, z: 0.1 });
    });
  });

  return (
    <group>
      <RigidBody colliders="cuboid" ref={bodyRef} type="dynamic">
        <Box scale={[6, 1, 1.9]} castShadow receiveShadow name="chassis">
          <meshStandardMaterial color={"red"} />
        </Box>
      </RigidBody>
      {wheelPositions.map((wheelPosition, index) => (
        <RigidBody
          position={wheelPosition}
          colliders="hull"
          type="dynamic"
          key={index}
          ref={wheelRefs.current[index]}
        >
          <Cylinder
            rotation={[Math.PI / 2, 0, 0]}
            args={[1, 1, 1, 32]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={"grey"} />
          </Cylinder>
        </RigidBody>
      ))}
      {wheelPositions.map((wheelPosition, index) => (
        <WheelJoint
          key={index}
          body={bodyRef}
          wheel={wheelRefs.current[index]}
          bodyAnchor={wheelPosition}
          wheelAnchor={[0, 0, 0]}
          rotationAxis={[0, 0, 1]}
        />
      ))}
    </group>
  );
};
