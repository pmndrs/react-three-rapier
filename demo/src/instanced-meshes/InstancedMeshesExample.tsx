import { ThreeEvent } from "@react-three/fiber";
import {
  InstancedRigidBodies,
  InstancedRigidBodyApi
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import {
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3
} from "three";
import { useSuzanne } from "../all-shapes/AllShapesExample";
import { Demo } from "../App";

const COUNT = 300;

export const InstancedMeshes: Demo = () => {
  const {
    nodes: { Suzanne }
  } = useSuzanne();

  const api = useRef<InstancedRigidBodyApi>(null);

  const handleClickInstance = (evt: ThreeEvent<MouseEvent>) => {
    if(!api.current) return;
    if(evt.instanceId === undefined) return;
    const body = api.current[evt.instanceId];
    if(!body) return;
    body.applyTorqueImpulse({ x: 0, y: 100, z: 0 });
  };

  useEffect(() => {
    if (!api.current) return;
    for (const body of api.current) {
      if(!body) continue;
      body.applyImpulse({
        x: -Math.random() * 5,
        y: Math.random() * 5,
        z: -Math.random() * 5
      });
    }
  }, []);

  const ref = useRef<InstancedMesh>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.instanceMatrix.setUsage(DynamicDrawUsage);

      for (let i = 0; i < ref.current.count; i++) {
        ref.current.setMatrixAt(
          i,
          new Matrix4().compose(
            new Vector3(Math.random(), Math.random(), Math.random()),
            new Quaternion(),
            new Vector3(1, 1, 1)
          )
        );
      }
    }
  }, []);

  return (
    <group scale={0.7}>
      <InstancedRigidBodies
        ref={api}
        colliders="hull"
        rigidBodies={Array.from({ length: COUNT }, (_e, i) => ({
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
          scale: [
            0.3 + Math.random(),
            0.3 + Math.random(),
            0.3 + Math.random()
          ]
        }))}
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
