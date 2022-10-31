import React, { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FC, useRef } from "react";
import { BufferAttribute, LineSegments, Mesh } from "three";
import { useRapier } from "./hooks";
import { AttractorState } from "./Attractor";
import { VertexNormalsHelper } from "three-stdlib";
import { _vector3 } from "./shared-objects";

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
  const normalsHelper = useRef<VertexNormalsHelper>();
  const color = props.strength > 0 ? 0x0000ff : 0xff0000;

  useEffect(() => {
    if (ref.current) {
      normalsHelper.current = new VertexNormalsHelper(
        ref.current,
        props.range,
        color
      );
      normalsHelper.current.frustumCulled = false;
      scene.add(normalsHelper.current);
    }

    return () => {
      if (normalsHelper.current) {
        scene.remove(normalsHelper.current);
      }
    };
  }, [props]);

  useFrame(() => {
    if (ref.current) {
      const worldPosition = props.object.getWorldPosition(_vector3);

      ref.current.position.copy(worldPosition);
      normalsHelper.current?.update();
    }
  });

  return (
    <mesh ref={ref} position={props.object.position} frustumCulled={false}>
      <sphereGeometry args={[0.2, 6, 6]} />
      <meshBasicMaterial color={color} wireframe />
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
