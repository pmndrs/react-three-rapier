import {
  InstancedRigidBodies,
  InstancedRigidBodyProps,
  RigidBodyApi
} from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { Color, InstancedMesh } from "three";
import { useSuzanne } from "../all-shapes/AllShapesExample";
import { Demo } from "../../App";

const MAX_COUNT = 300;

export const InstancedMeshes: Demo = () => {
  const {
    nodes: { Suzanne }
  } = useSuzanne();

  const api = useRef<RigidBodyApi[]>([]);

  const [bodies, setBodies] = useState<InstancedRigidBodyProps[]>(() => []);

  const ref = useRef<InstancedMesh>(null);

  useEffect(() => {
    if (ref.current) {
      for (let i = 0; i < MAX_COUNT; i++) {
        ref.current!.setColorAt(i, new Color(Math.random() * 0xffffff));
      }
      ref.current!.instanceColor!.needsUpdate = true;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBodies((bodies) => [
        ...bodies,
        {
          key: Math.random() + "baba",
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
        }
      ]);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <group>
      <InstancedRigidBodies instances={bodies} ref={api} colliders="hull">
        <instancedMesh
          ref={ref}
          castShadow
          args={[Suzanne.geometry, undefined, MAX_COUNT]}
          count={bodies.length}
          onClick={(evt) => {
            api.current![evt.instanceId!].applyTorqueImpulse({
              x: 0,
              y: 50,
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
