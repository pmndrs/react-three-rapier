import { Box, Shadow, Sphere } from "@react-three/drei";
import { createRef, forwardRef, ReactNode, useEffect, useRef } from "react";
import {
  RigidBodyApi,
  RigidBodyTypeString,
  useBall,
  useCuboid,
  useSphericalJoint,
  Vector3Array,
} from "@react-three/rapier";
import { useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";

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
    const [cuboid, api] = useBall(
      {
        position,
        type,
      },
      {
        args: [0.5],
      }
    );

    useImperativeHandle(ref, () => api);

    const RopeLink = component;

    return <RopeLink ref={cuboid} />;
  }
);

const RopeJoint = ({ a, b }) => {
  const joint = useSphericalJoint(a, b, [
    [-0.5, 0, 0],
    [0.5, 0, 0],
  ]);
  return null;
};

const Rope = (props: {
  component: ReactNode;
  anchor: Vector3Array;
  length: number;
}) => {
  const refs = useRef(
    Array.from({ length: props.length }).map(() => createRef<RigidBodyApi>())
  );

  useFrame(() => {
    const now = performance.now();
    refs.current[0].current!.setNextKinematicRotation({
      x: 0,
      y: Math.sin(now / 500) * 3,
      z: 0,
    });
  });

  return (
    <group>
      {refs.current.map((ref, i) => (
        <RopeSegment
          ref={ref}
          key={i}
          position={[i * 1, 0, 0]}
          component={ShadowElement}
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

const Joints = ({ setUI }) => {
  setUI();

  return (
    <group>
      <Rope length={40} component={ShadowElement} />
    </group>
  );
};

export default Joints;
