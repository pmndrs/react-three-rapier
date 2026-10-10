import React, { memo, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, DynamicDrawUsage } from "three";
import { useRapier } from "../hooks/hooks";

const MIN_CAPACITY = 1024;

const nextCapacity = (count: number) => {
  let capacity = MIN_CAPACITY;
  while (capacity < count) capacity *= 2;
  return capacity;
};

/**
 * Grows the geometry's attributes when Rapier hands us more vertices than fit.
 * Disposing first releases the GPU buffers of the outgrown attributes; the
 * geometry object itself is reused and re-uploaded on the next render.
 */
const ensureCapacity = (geometry: BufferGeometry, vertexCount: number) => {
  const position = geometry.getAttribute("position") as
    BufferAttribute | undefined;
  if (position && position.count >= vertexCount) return;

  const capacity = nextCapacity(vertexCount);
  geometry.dispose();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(capacity * 3), 3).setUsage(
      DynamicDrawUsage
    )
  );
  // Rapier's debug colors are RGBA. Both WebGLRenderer (vertexAlphas) and
  // WebGPURenderer (vec4 vertexColor node) read a 4-component color attribute.
  geometry.setAttribute(
    "color",
    new BufferAttribute(new Float32Array(capacity * 4), 4).setUsage(
      DynamicDrawUsage
    )
  );
};

const write = (attribute: BufferAttribute, data: Float32Array) => {
  (attribute.array as Float32Array).set(data);
  attribute.clearUpdateRanges();
  attribute.addUpdateRange(0, data.length);
  attribute.needsUpdate = true;
};

/**
 * Draws Rapier's debug lines. One persistent geometry whose attributes are
 * rewritten every frame (and only reallocated when they must grow), disposed on
 * unmount, so toggling debug on and off does not leak GPU buffers (#666).
 */
export const Debug = memo(() => {
  const { world } = useRapier();
  const geometry = useMemo(() => new BufferGeometry(), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // `update` runs after the `rapier` phase, so the lines are drawn from the
  // same step the meshes were just synced to.
  useFrame(
    () => {
      const { vertices, colors } = world.debugRender();
      const vertexCount = vertices.length / 3;

      ensureCapacity(geometry, vertexCount);
      write(geometry.getAttribute("position") as BufferAttribute, vertices);
      write(geometry.getAttribute("color") as BufferAttribute, colors);
      geometry.setDrawRange(0, vertexCount);
    },
    { phase: "update" }
  );

  return (
    <group>
      <lineSegments geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial color={0xffffff} vertexColors />
      </lineSegments>
    </group>
  );
});
