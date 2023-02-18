import { ThreeEvent } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider, InstancedRigidBodies,
  InstancedRigidBodiesProps,
  InstancedRigidBodiesRef,
  InstancedRigidBodyProps
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Demo } from "../../App";
import { useSuzanne } from "../all-shapes/AllShapesExample";

const COUNT = 300;

export const InstancedMeshesCompound: Demo = () => {
  const {
    nodes: { Suzanne }
  } = useSuzanne();

  const api = useRef<InstancedRigidBodiesRef>(null);

  const bodies : InstancedRigidBodyProps[] = Array.from({ length: COUNT }).map((_, i) => ({
    key: i,
    position: [
      Math.random() * 20,
      Math.random() * 20,
      Math.random() * 20
    ],
    rotation: [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    ],
    scale: [0.5 + Math.random(), 0.5 + Math.random(), 0.5 + Math.random()]
  }));

  const handleClickInstance = (evt: ThreeEvent<MouseEvent>) => {
    if (api.current) {
      api.current.get(bodies[evt.instanceId!].key)!
        .applyTorqueImpulse({ x: 0, y: 100, z: 0 }, true);
    }
  };

  useEffect(() => {
    if (api.current) {
      api.current.forEach((body) => {
        if(!body) return;
        body.applyImpulse(
          {
            x: -Math.random() * 5,
            y: Math.random() * 5,
            z: -Math.random() * 5
          },
          true
        );
      });
    }
  }, []);

  return (
    <group scale={0.7}>
      <InstancedRigidBodies
        ref={api}
        colliders={false}
        instances={bodies}
        colliderNodes={[
          <BallCollider args={[1]} />,
          <BallCollider args={[0.5]} position={[1, 0.3, -0.25]} />,
          <CuboidCollider args={[0.5, 0.2, 0.5]} position={[-1, 0.3, -0.25]} />
        ]}
      >
        <instancedMesh
          castShadow
          args={[Suzanne.geometry, undefined, COUNT]}
          onClick={handleClickInstance}
        >
          <meshPhysicalMaterial color={"yellow"} />
        </instancedMesh>
      </InstancedRigidBodies>
    </group>
  );
};
