import { Box, Sphere } from "@react-three/drei";
import {
  BallCollider,
  RapierRigidBody,
  RigidBody,
  RigidBodyOptions,
  useSpringJoint
} from "@react-three/rapier";
import { forwardRef, useMemo, useRef } from "react";
import { Demo } from "../../App";
import { useForwardedRef } from "@react-three/rapier/src/hooks/use-forwarded-ref";
import { vectorArrayToVector3 } from "@react-three/rapier/src/utils/utils";

const COLORS_ARR = ["#335C67", "#FFF3B0", "#E09F3E", "#9E2A2B", "#540B0E"];

interface BallSpringProps extends RigidBodyOptions {
  jointNum: number;
  total: number;
}

interface BoxRigidBodyProps extends RigidBodyOptions {
  color: string;
}

const BoxRigidBody = ({ color, ...props }: BoxRigidBodyProps) => {
  return (
    <RigidBody {...props} ccd canSleep={false}>
      <Box castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </Box>
    </RigidBody>
  );
};

const BallSpring = forwardRef<RapierRigidBody, BallSpringProps>(
  (props, floorRef) => {
    const floor = useForwardedRef(floorRef);
    const ball = useRef<RapierRigidBody>(null);

    const stiffness = 1.0e3;
    const criticalDamping = 2.0 * Math.sqrt(stiffness * (props.mass ?? 1));
    const dampingRatio = props.jointNum / (props.total / 2);
    const damping = dampingRatio * criticalDamping;

    const ballPos = props.position as THREE.Vector3;

    if (!ballPos) {
      throw new Error("BallSpring requires a position prop");
    }

    useSpringJoint(ball, floor, [
      [0, 0, 0],
      [ballPos.x, ballPos.y - 3, ballPos.z],
      0,
      stiffness,
      damping
    ]);

    return (
      <RigidBody
        key={`spring-${props.jointNum}`}
        {...props}
        ref={ball}
        ccd
        name={`spring-${props.jointNum}`}
        position={ballPos}
        colliders={false}
        canSleep={false}
      >
        <Sphere args={[0.5]} castShadow receiveShadow>
          <meshStandardMaterial color="#E09F3E" />
        </Sphere>
        <BallCollider args={[0.5]} />
      </RigidBody>
    );
  }
);

export const SpringExample: Demo = () => {
  const floor = useRef<RapierRigidBody>(null);

  const vectorArr = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      return vectorArrayToVector3([-20 + 1.5 * (i + 1), 7.5, -30]);
    });
  }, []);

  return (
    <>
      <RigidBody ref={floor} position={[0, 0, 0]} type="fixed" />

      {vectorArr.map((_, i) => (
        <group key={`box-ball-${i}`}>
          <BallSpring
            key={`ball-${i}`}
            ref={floor}
            position={vectorArr[i]}
            mass={1}
            jointNum={i}
            total={30}
          />
          <BoxRigidBody
            key={`box-${i}`}
            color={COLORS_ARR[i % 5]}
            position={[vectorArr[i].x, vectorArr[i].y + 3, vectorArr[i].z]}
            colliders="cuboid"
            density={100}
          />
        </group>
      ))}
    </>
  );
};
