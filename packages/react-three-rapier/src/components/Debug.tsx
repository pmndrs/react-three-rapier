import React, { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, LineSegments } from "three";
import { useRapier } from "../hooks/hooks";
import { _vector3 } from "../utils/shared-objects";

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

export const Debug = memo(() => {
  const { world } = useRapier();
  const ref = useRef<LineSegments>(null);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const buffers = world.debugRender();

    mesh.geometry.setAttribute(
      "position",
      new BufferAttribute(buffers.vertices, 3)
    );
    mesh.geometry.setAttribute("color", new BufferAttribute(buffers.colors, 4));
  });

  return (
    <group>
      <lineSegments ref={ref} frustumCulled={false}>
        <lineBasicMaterial color={0xffffff} vertexColors />
        <bufferGeometry />
      </lineSegments>
    </group>
  );
});
