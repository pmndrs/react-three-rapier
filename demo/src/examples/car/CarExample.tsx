import { Box, Cylinder } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  RapierRigidBody,
  RigidBody,
  useRevoluteJoint,
  Vector3Array
} from "@react-three/rapier";
import { createRef, RefObject, useRef } from "react";
import { Demo } from "../../App";

const WheelJoint = ({
  body,
  wheel,
  bodyAnchor,
  wheelAnchor,
  rotationAxis
}: {
  body: RefObject<RapierRigidBody>;
  wheel: RefObject<RapierRigidBody>;
  bodyAnchor: Vector3Array;
  wheelAnchor: Vector3Array;
  rotationAxis: Vector3Array;
}) => {
  const joint = useRevoluteJoint(body, wheel, [
    bodyAnchor,
    wheelAnchor,
    rotationAxis
  ]);

  useFrame(() => {
    if (joint.current) {
      joint.current.configureMotorVelocity(20, 10);
    }
  });

  return null;
};

export const Car: Demo = () => {
  const bodyRef = useRef<RapierRigidBody>(null);
  const wheelPositions: [number, number, number][] = [
    [-3, 0, 2],
    [-3, 0, -2],
    [3, 0, 2],
    [3, 0, -2]
  ];
  const wheelRefs = useRef(
    wheelPositions.map(() => createRef<RapierRigidBody>())
  );

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
