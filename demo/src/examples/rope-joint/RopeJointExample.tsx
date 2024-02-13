import { Sphere, Box } from "@react-three/drei";
import {
  BallCollider,
  RapierRigidBody,
  RigidBody,
  RigidBodyOptions,
  useRopeJoint
} from "@react-three/rapier";
import { useRef } from "react";
import { Demo } from "../../App";
import { Vector3 } from "@react-three/fiber";

const WALL_COLORS = ["#50514F", "#CBD4C2", "#FFFCFF", "#247BA0", "#C3B299"];

interface BoxRigidBodyProps extends RigidBodyOptions {
  color: string;
}

interface BoxWallProps extends RigidBodyOptions {
  height: number;
  width: number;
}

interface RopeJointProps {
  anchorPosition: Vector3;
  ballPosition: Vector3;
  ropeLength: number;
}

const Floor = (props: RigidBodyOptions) => {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[0, -1, 0]} {...props}>
      <Box args={[20, 1, 20]}>
        <meshStandardMaterial color="white" />
      </Box>
    </RigidBody>
  );
};

const BoxRigidBody = (props: BoxRigidBodyProps) => {
  return (
    <RigidBody {...props}>
      <Box castShadow receiveShadow>
        <meshStandardMaterial color={props.color} />
      </Box>
    </RigidBody>
  );
};

const BoxWall = ({ height, width, ...props }: BoxWallProps) => {
  const wall = [];

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const position: [number, number, number] = [j, i, 0];
      wall.push(
        <BoxRigidBody
          key={`${i}-${j}`}
          {...props}
          density={2}
          color={WALL_COLORS[i % 5]}
          position={position}
        />
      );
    }
  }

  return (
    <group name="wall" rotation-y={-0.7853982} position={[-1.8, 0, -1.8]}>
      {wall.map((box, i) => box)}
    </group>
  );
};

const RopeJoint = ({
  anchorPosition,
  ballPosition,
  ropeLength
}: RopeJointProps) => {
  const anchor = useRef<RapierRigidBody>(null);
  const ball = useRef<RapierRigidBody>(null);

  useRopeJoint(anchor, ball, [[0, 0, 0], [0, 0, 0], ropeLength]);

  return (
    <group>
      {/* Anchor */}
      <RigidBody ref={anchor} position={anchorPosition} />

      {/* Wrecking Ball */}
      <RigidBody
        position={ballPosition}
        ref={ball}
        restitution={1.2}
        density={30}
        colliders={false}
      >
        <Sphere args={[2]} receiveShadow castShadow>
          <meshStandardMaterial metalness={1} roughness={0.3} />
        </Sphere>

        <BallCollider args={[2]} />
      </RigidBody>
    </group>
  );
};

export const RopeJointExample: Demo = () => {
  return (
    <group position={[0, 0, 0]} scale={3}>
      <Floor />
      <BoxWall height={10} width={6} />
      <RopeJoint
        ropeLength={35}
        anchorPosition={[0, 15, 0]}
        ballPosition={[-8, 15, 8]}
      />
    </group>
  );
};
