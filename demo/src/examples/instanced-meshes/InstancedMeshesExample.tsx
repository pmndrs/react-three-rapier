import { InstancedRigidBodies } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Color, InstancedMesh } from "three";
import { useSuzanne } from "../all-shapes/AllShapesExample";
import { Demo } from "../../App";
import { RigidBodyApi } from "@react-three/rapier/dist/declarations/src/types";

const COUNT = 300;

export const InstancedMeshes: Demo = () => {
  const {
    nodes: { Suzanne }
  } = useSuzanne();

  const api = useRef<RigidBodyApi[]>([]);

  useEffect(() => {
    if (api.current) {
      api.current.forEach((body) => {
        body.applyImpulse({
          x: -Math.random() * 5,
          y: Math.random() * 5,
          z: -Math.random() * 5
        });
      });
    }
  }, []);

  const ref = useRef<InstancedMesh>(null);

  useEffect(() => {
    if (ref.current) {
      for (let i = 0; i < COUNT; i++) {
        const color = new Color(Math.random() * 0xffffff);
        ref.current.setColorAt(i, color);
      }
    }
  }, []);

  return (
    <group scale={0.7}>
      <InstancedRigidBodies
        instances={Array.from({ length: COUNT }).map((_, i) => ({
          key: i,
          position: [
            Math.random() * 10 - 5,
            Math.random() * 10 + 5,
            Math.random() * 10 - 5
          ],
          rotation: [
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ],
          scale: [
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5
          ]
        }))}
        ref={api}
        colliders="hull"
      >
        <instancedMesh
          ref={ref}
          castShadow
          args={[Suzanne.geometry, undefined, COUNT]}
          onClick={(evt) => {
            api.current![evt.instanceId!].applyTorqueImpulse({
              x: 0,
              y: 10,
              z: 0
            });
          }}
        >
          <meshPhysicalMaterial />
        </instancedMesh>
      </InstancedRigidBodies>
    </group>
  );
};
