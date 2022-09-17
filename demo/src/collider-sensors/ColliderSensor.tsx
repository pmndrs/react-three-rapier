import { Box, Sphere } from "@react-three/drei";
import { Color } from "@react-three/fiber";
import { CuboidCollider, CuboidColliderProps, RigidBody, RigidBodyProps } from "@react-three/rapier";
import { ComponentProps, useState } from "react";
import { Demo } from "../App";

const useColorToggle = (color1: Color, color2: Color): [color: Color, toggleColor: () => void] => {
  const [color, setColor] = useState(color1);

  const toggleColor = () => {
    if (color === color1) {
      setColor(color2);
    } else {
      setColor(color1);
    }
  }

  return [color, toggleColor];
}

type BallProps = Omit<RigidBodyProps, 'colliders'>
const Ball = (props: BallProps) => {
  const [color, toggleColor] = useColorToggle('red', 'yellow');
  return (
    <RigidBody colliders="ball" onCollisionEnter={() => toggleColor()} onCollisionExit={() => toggleColor()} {...props}>
      <Sphere castShadow receiveShadow>
        <meshPhysicalMaterial color={color} />
      </Sphere>
    </RigidBody>
  );
};

type RigidBodySensorProps = Omit<ComponentProps<typeof Box>, 'position'> & { position?: RigidBodyProps['position'] };
const RigidBodySensor = ({ position = [0, 0, 0], ...props}: RigidBodySensorProps) => {
  const [color, toggleColor] = useColorToggle('blue', 'green');
  return (
    <RigidBody
      colliders={"cuboid"}
      colliderType={"sensor"}
      type="fixed"
      onCollisionEnter={e => toggleColor()}
      onCollisionExit={e => toggleColor()}
      position={position}
    >
      <Box {...props}>
        <meshPhysicalMaterial color={color} />
      </Box>
    </RigidBody>
  );
};

type ColliderSensorProps = Pick<CuboidColliderProps, 'args' | 'position'>;
const ColliderSensor = ({args, ...props}: ColliderSensorProps) => <CuboidCollider {...props} args={[args[0] * 0.5, args[1] * 0.5, args[2] * 0.5]} type="sensor" />

export const ColliderSensorDemo: Demo = () => {
  return (
    <group>
      <Ball position={[-5, 20, -10]} restitution={2} />
      <RigidBodySensor args={[10, 5, 10]} position={[-5, 0, -10]} />

      <Ball position={[5, 20, -10]} restitution={2} />
      <ColliderSensor args={[10, 5, 10]} position={[5, 0, -10]} />
    </group>
  );
};
