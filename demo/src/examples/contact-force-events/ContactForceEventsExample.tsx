import { Plane, Sphere } from "@react-three/drei";
import { MeshPhysicalMaterialProps } from "@react-three/fiber";
import {
  RigidBody,
  RapierRigidBody,
  RigidBodyProps
} from "@react-three/rapier";
import { useRef, useState } from "react";
import { Color } from "three";
import { Demo } from "../../App";

type BallProps = { onContactForce: RigidBodyProps["onContactForce"] };
const Ball = ({ onContactForce }: BallProps) => {
  const ball = useRef<RapierRigidBody>(null);

  return (
    <RigidBody
      ref={ball}
      colliders="ball"
      position={[0, 15, 0]}
      restitution={0.5}
      onContactForce={(payload) => {
        const { totalForceMagnitude } = payload;
        if (totalForceMagnitude < 300) {
          ball.current?.applyImpulse({ x: 0, y: 65, z: 0 }, true);
        }
        onContactForce?.(payload);
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
    <RigidBody colliders="trimesh" type="fixed" restitution={1}>
      <Plane args={[10, 10]} rotation={[Math.PI * 1.5, 0, 0]}>
        <meshPhysicalMaterial color={color} />
      </Plane>
    </RigidBody>
  );
};

const startColor = new Color(0xffffff);
export const ContactForceEventsExample: Demo = () => {
  const [floorColor, setFloorColor] = useState(0x000000);

  // magic number: this is the start force for where the ball drops from
  // and is used to calculate the color change
  const startForce = 6500;
  return (
    <group position={[0, -10, -10]}>
      <Ball
        onContactForce={({ totalForceMagnitude }) => {
          const color = startColor
            .clone()
            .multiplyScalar(1 - totalForceMagnitude / startForce);
          setFloorColor(color.getHex());
        }}
      />
      <Floor color={floorColor} />
    </group>
  );
};
