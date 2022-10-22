import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { RigidBodyAutoCollider, InstancedRigidBody, Physics, Debug, InstancedRigidBodies, RigidBody } from '@react-three/rapier';
import { useControls } from 'leva';
import { useRef, useCallback, useState, useEffect, Suspense } from 'react';
import { Color, MathUtils, DoubleSide } from 'three';

/** container size */
const container = 5;

const containerDepth = .5;

export const DynamicInstancedMeshes = () => {


  const [{ max, spawnRate, colors, colliders, shadows }, set, get] = useControls(() => ({
    shadows: true,
    current: { value: 0, editable: false, step: 1, label: "current (r)", hint: "readonly" },
    max: { value: 100, min: 1, step: 1 },
    spawnRate: { value: .1, min: .01 },
    colors: true,
    colliders: {
      value: 'ball' as RigidBodyAutoCollider,
      options: ['cuboid', 'hull', 'trimesh'] as RigidBodyAutoCollider[],
    },
  }))
  let keys = useRef(0);

  const createBody = useCallback((): InstancedRigidBody => ({
    key: keys.current++,
    color: new Color().setRGB(.1, Math.random(), Math.random()),
    scale: 1 + 1 * Math.random(),
    linearVelocity: [0, Math.random() * 3, 0],
    position: [
      container * .25 - container * .5 * Math.random(),
      0,
      container * .25 - container * .5 * Math.random(),
    ]
  }), []);


  const [rigidBodiesProps, setRigidBodiesProps] = useState<InstancedRigidBody[]>(() => [
    createBody()
  ]);

  const rigidBodiesPropsRef = useRef(rigidBodiesProps);
  rigidBodiesPropsRef.current = rigidBodiesProps;

  const addBody = useCallback(() => {
    setRigidBodiesProps(bodies => {
      bodies = bodies.slice();
      bodies.push(createBody());
      if (bodies.length > max) bodies.splice(0, bodies.length - max);
      return bodies;
    });
  }, [max])

  const elapsed = useRef(0);

  useFrame((_s, dl) => {
    elapsed.current += dl;
    if (elapsed.current < spawnRate) return;
    elapsed.current = 0;
    addBody();
  })

  const onSelect = useCallback<(e: ThreeEvent<MouseEvent>) => void>((e) => {
    e.stopPropagation();
    const intersection = e.intersections[0];
    if (!intersection) return;
    const i = intersection.instanceId;
    if (i === undefined) return;
    setRigidBodiesProps(bodies => {
      if (!bodies[i]) return bodies;
      bodies = bodies.slice();
      bodies[i] = { ...bodies[i], color: '#e43131' };
      return bodies;
    })
  }, [])

  const onRemove = useCallback<(e: ThreeEvent<MouseEvent>) => void>((e) => {
    e.stopPropagation();
    const intersection = e.intersections[0];
    if (!intersection) return;
    const i = intersection.instanceId;
    if (i === undefined) return;
    setRigidBodiesProps(bodies => {
      if (!bodies[i]) return bodies;
      bodies = bodies.slice();
      bodies.splice(i, 1);
      return bodies;
    })
  }, [])

  useEffect(() => {
    if (rigidBodiesProps.length === get('current')) return;
    set({ current: rigidBodiesProps.length });
  }, [rigidBodiesProps])

  return <>
    <InstancedRigidBodies rigidBodies={rigidBodiesProps} colors={colors} colliders={colliders}>
      <instancedMesh
        args={[undefined, undefined, max]}
        castShadow={shadows}
        receiveShadow={shadows}
        onClick={onSelect}
        onDoubleClick={onRemove}
      >
        <sphereGeometry args={[.05]} />
        <meshLambertMaterial color="white" />
      </instancedMesh>
    </InstancedRigidBodies>
    <RigidBody type="fixed">
      <Box
        name="bottom"
        args={[container, containerDepth, container]}
        position={[0, -container * .5, 0]}
        receiveShadow={shadows}
      >
        <shadowMaterial />
      </Box>
    </RigidBody>
    <RigidBody type="fixed">
      <Box name="front" args={[container, container, containerDepth]} position={[0, 0, container * .5]}>
        <shadowMaterial />
      </Box>
    </RigidBody>
    <RigidBody type="fixed">
      <Box name="back" args={[container, container, containerDepth]} position={[0, 0, -container * .5]}>
        <shadowMaterial />
      </Box>
    </RigidBody>
    <RigidBody type="fixed">
      <Box name="right" args={[containerDepth, container, container]} position={[container * .5, 0, 0]}>
        <shadowMaterial />
      </Box>
    </RigidBody>
    <RigidBody type="fixed">
      <Box name="left" args={[containerDepth, container, container]} position={[-container * .5, 0, 0]}>
        <shadowMaterial />
      </Box>
    </RigidBody>
    <RigidBody type="fixed">
      <Box name="top" args={[container, containerDepth, container]} position={[0, container * .5, 0]}>
        <shadowMaterial />
      </Box>
    </RigidBody>
  </>

}