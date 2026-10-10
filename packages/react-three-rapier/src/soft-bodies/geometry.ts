import { BufferAttribute, BufferGeometry } from "three";
import { mergeVertices } from "three-stdlib";

/**
 * Returns a copy of `geometry` welded so that vertices sharing a position
 * become a single vertex.
 *
 * Welds on **position only**. three's `mergeVertices(geometry)` only merges
 * vertices whose *every* attribute matches, but UV-mapped closed shapes (a
 * `SphereGeometry`, for one) duplicate vertices along the UV seam and at the
 * poles that share a position and differ in `uv`/`normal`. Left unwelded those
 * would become separate, unconnected particles and the seam would tear open as
 * soon as the body deforms.
 *
 * The other attributes (`uv`, `color`, ...) are rebuilt around the deduplicated
 * vertex set, taking each value from whichever original vertex welded first
 * into a slot. The returned geometry is always indexed, and its vertex order is
 * the order of the simulated particles (for `cloth` and `rope`).
 *
 * @category Soft Bodies
 */
export const weldGeometry = (geometry: BufferGeometry): BufferGeometry => {
  const position = geometry.attributes.position as BufferAttribute | undefined;
  if (!position) {
    throw new Error(
      "react-three-rapier: SoftBody geometry must have a position attribute."
    );
  }

  const positionOnly = new BufferGeometry();
  positionOnly.setAttribute("position", position);
  if (geometry.index) positionOnly.setIndex(geometry.index);

  const merged = mergeVertices(positionOnly);
  const mergedIndex = merged.index!;
  const weldedCount = merged.attributes.position.count;
  const sourceIndex = geometry.index;

  // The first original vertex that landed in each welded slot is the source of
  // that slot's non-position attributes.
  const firstSource = new Int32Array(weldedCount).fill(-1);
  for (let c = 0; c < mergedIndex.count; c++) {
    const welded = mergedIndex.getX(c);
    if (firstSource[welded] === -1) {
      firstSource[welded] = sourceIndex ? sourceIndex.getX(c) : c;
    }
  }

  const result = new BufferGeometry();
  result.setIndex(mergedIndex);

  // Always give the simulation its own, dynamic, float position buffer
  const weldedPosition = new BufferAttribute(
    new Float32Array(merged.attributes.position.array),
    3
  );
  weldedPosition.setUsage(35048 /* DynamicDrawUsage */);
  result.setAttribute("position", weldedPosition);

  for (const name of Object.keys(geometry.attributes)) {
    if (name === "position") continue;
    const attribute = geometry.attributes[name] as BufferAttribute;
    const { itemSize } = attribute;
    const array = new (attribute.array.constructor as new (
      length: number
    ) => typeof attribute.array)(weldedCount * itemSize);
    const rebuilt = new BufferAttribute(array, itemSize, attribute.normalized);
    for (let v = 0; v < weldedCount; v++) {
      const source = firstSource[v];
      for (let k = 0; k < itemSize; k++) {
        array[v * itemSize + k] = attribute.array[source * itemSize + k];
      }
    }
    result.setAttribute(name, rebuilt);
  }

  return result;
};
