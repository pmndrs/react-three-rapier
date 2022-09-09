import { Sphere } from "@react-three/drei";
import { createRef, forwardRef, ReactNode, useEffect, useRef } from "react";
import {
  RigidBody,
  RigidBodyApi,
  RigidBodyApiRef,
  RigidBodyTypeString,
  useSphericalJoint,
  Vector3Array,
} from "@react-three/rapier";
import { useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import { Demo } from "../App";
import { Quaternion } from "three";

const ShadowElement = forwardRef((_, ref) => (
  <Sphere castShadow ref={ref} args={[0.5]}>
    <meshPhysicalMaterial />
  </Sphere>
));

const RopeSegment = forwardRef(
  (
    {
      position,
      component,
      type,
    }: {
      position: Vector3Array;
      component: ReactNode;
      type: RigidBodyTypeString;
    },
    ref
  ) => {
    const rb = useRef<RigidBodyApi>(null);
    useImperativeHandle(ref, () => rb.current);

    return (
      <RigidBody ref={rb} type={type} position={position}>
        {component}
      </RigidBody>
    );
  }
);

const RopeJoint = ({ a, b }: { a: RigidBodyApiRef; b: RigidBodyApiRef }) => {
  const joint = useSphericalJoint(a, b, [
    [-0.5, 0, 0],
    [0.5, 0, 0],
  ]);
  return null;
};

const Rope = (props: { component: ReactNode; length: number }) => {
  const refs = useRef(
    Array.from({ length: props.length }).map(() => createRef<RigidBodyApi>())
  );

  useFrame(() => {
    const now = performance.now();
    refs.current[0].current!.setNextKinematicRotation(
      new Quaternion(0, Math.sin(now / 500) * 3, 0)
    );
  });

  return (
    <group>
      {refs.current.map((ref, i) => (
        <RopeSegment
          ref={ref}
          key={i}
          position={[i * 1, 0, 0]}
          component={<ShadowElement />}
          type={i === 0 ? "kinematicPosition" : "dynamic"}
        />
      ))}
      {refs.current.map(
        (ref, i) =>
          i > 0 && (
            <RopeJoint a={refs.current[i]} b={refs.current[i - 1]} key={i} />
          )
      )}
    </group>
  );
};

export const Joints: Demo = () => {
  return (
    <group>
      <Rope length={40} component={<ShadowElement />} />
    </group>
  );
};
