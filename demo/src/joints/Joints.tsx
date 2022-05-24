import React from "react";

import { Box, Shadow } from "@react-three/drei";
import { createRef, forwardRef, ReactNode, useEffect, useRef } from "react";
import {
  RigidBodyTypeString,
  useBall,
  useCuboid,
  useSphericalJoint,
  Vector3Array,
} from "@react-three/rapier";
import { useImperativeHandle } from "react";

const ShadowBox = forwardRef((_, ref) => (
  <Box castShadow ref={ref}>
    <meshPhysicalMaterial />
  </Box>
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
    const [cuboid, api] = useCuboid(
      {
        position: position,
        type,
      },
      {
        args: [0.5, 0.5, 0.5],
      }
    );

    useImperativeHandle(ref, () => api);

    const RopeLink = component;

    return <RopeLink ref={cuboid} />;
  }
);

const RopeJoint = ({ a, b }) => {
  const joint = useSphericalJoint(a, b, [
    [0.5, 0.5, 0.5],
    [-0.5, -0.5, -0.5],
  ]);
  return null;
};

const Rope = (props: {
  component: ReactNode;
  anchor: Vector3Array;
  length: number;
}) => {
  const refs = useRef(
    Array.from({ length: props.length }).map(() => createRef())
  );

  return (
    <group>
      {refs.current.map((ref, i) => (
        <RopeSegment
          ref={ref}
          key={i}
          position={[i * 1.1, 10, 0]}
          component={ShadowBox}
          type={i == 0 ? "fixed" : "dynamic"}
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

const Joints = ({ setUI }) => {
  setUI();

  return (
    <group>
      <Rope length={40} component={ShadowBox} />
    </group>
  );
};

export default Joints;
