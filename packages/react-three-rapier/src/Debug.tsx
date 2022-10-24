import React, { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FC, useRef } from "react";
import { BufferAttribute, LineSegments, Mesh } from "three";
import { useRapier } from "./hooks";
import { AttractorState } from "./Attractor";
import { VertexNormalsHelper } from "three-stdlib";

interface DebugProps {}

function mapsEqual(map1: Map<string, any>, map2: Map<string, any>) {
  var testVal;
  if (map1.size !== map2.size) {
    return false;
  }
  for (var [key, val] of map1) {
    testVal = map2.get(key);
    if (testVal !== val || (testVal === undefined && !map2.has(key))) {
      return false;
    }
  }
  return true;
}

const AttractorHelper = (props: AttractorState) => {
  const { scene } = useThree();
  const ref = useRef<Mesh>(null);

  useEffect(() => {
    let normalsHelper: VertexNormalsHelper;

    if (ref.current) {
      normalsHelper = new VertexNormalsHelper(
        ref.current,
        props.range,
        0xff0000
      );
      scene.add(normalsHelper);
    }

    return () => {
      if (normalsHelper) {
        scene.remove(normalsHelper);
      }
    };
  }, [props]);

  return (
    <mesh ref={ref} position={props.object.position}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={0xff0000} wireframe />
    </mesh>
  );
};

export const Debug: FC<DebugProps> = () => {
  const { world, attractorStates } = useRapier();
  const ref = useRef<LineSegments>(null);
  const [attractors, setAttractors] = useState<AttractorState[]>([]);
  const currMap = useRef<Map<string, AttractorState>>(new Map());

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const buffers = world.debugRender();

    mesh.geometry.setAttribute(
      "position",
      new BufferAttribute(buffers.vertices, 3)
    );
    mesh.geometry.setAttribute("color", new BufferAttribute(buffers.colors, 4));

    // Update attractors
    if (!mapsEqual(currMap.current, attractorStates)) {
      setAttractors([...attractorStates.values()]);
      currMap.current = new Map(attractorStates);
    }
  });

  return (
    <group>
      <lineSegments ref={ref} frustumCulled={false}>
        <lineBasicMaterial color={0xffffff} vertexColors />
        <bufferGeometry />
      </lineSegments>

      {attractors.map((attractor, i) => (
        <AttractorHelper key={attractor.object.uuid} {...attractor} />
      ))}
    </group>
  );
};
