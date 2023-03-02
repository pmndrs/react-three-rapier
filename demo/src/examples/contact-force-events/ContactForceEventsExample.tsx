import { Box, Plane, Sphere } from "@react-three/drei";
import { MeshPhysicalMaterialProps } from "@react-three/fiber";
import {
  RigidBody,
  RapierRigidBody,
  RigidBodyProps,
  ContactForceHandler
} from "@react-three/rapier";
import { useCallback, useRef, useState } from "react";
import { Color } from "three";
import { Demo } from "../../App";

type BallProps = { onContactForce: RigidBodyProps["onContactForce"] };
const Ball = ({ onContactForce }: BallProps) => {
  const ball = useRef<RapierRigidBody>(null);

  return (
    <RigidBody
      ref={ball}
      colliders="ball"
      position={[2, 15, 0]}
      restitution={1.5}
      onContactForce={(payload) => {
        const { totalForceMagnitude } = payload;
        if (totalForceMagnitude < 300) {
          ball.current?.applyImpulse({ x: 0, y: 65, z: 0 }, true);
        }
        onContactForce?.(payload);
        console.log("contact force", totalForceMagnitude);
      }}
      onCollisionEnter={() => {
        console.log("collision enter");
      }}
    >
      <Sphere castShadow receiveShadow>
        <meshPhysicalMaterial color="red" />
      </Sphere>
    </RigidBody>
  );
};
type FloorProps = { color: MeshPhysicalMaterialProps["color"] };
const Floor = ({ color }: FloorProps) => {
  return (
    <RigidBody colliders="cuboid" type="fixed">
      <Box args={[10, 1, 10]}>
        <meshPhysicalMaterial color={color} />
      </Box>
    </RigidBody>
  );
};

const startColor = new Color(0xffffff);
export const ContactForceEventsExample: Demo = () => {
  const [floorColor, setFloorColor] = useState(0x000000);

  const handleContactForce = useCallback<ContactForceHandler>(
    ({ totalForceMagnitude }) => {
      const color = startColor
        .clone()
        .multiplyScalar(1 - totalForceMagnitude / startForce);
      setFloorColor(color.getHex());
    },
    []
  );

  // magic number: this is the start force for where the ball drops from
  // and is used to calculate the color change
  const startForce = 6500;
  return (
    <group position={[0, -10, -10]}>
      <Ball onContactForce={handleContactForce} />
      <Floor color={floorColor} />
    </group>
  );
};
