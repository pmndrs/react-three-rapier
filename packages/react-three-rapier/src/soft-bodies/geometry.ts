import { BufferAttribute, BufferGeometry } from "three";

/**
 * The result of welding a geometry on position only.
 * @category Soft Bodies
 */
export interface WeldResult {
  /** Flattened positions of the unique vertices, in first-seen order. */
  positions: Float32Array;
  /** Triangle indices into `positions`. */
  index: Uint32Array;
  /** For every original vertex, the index of its welded vertex. */
  map: Uint32Array;
}

/**
 * Welds the vertices of `geometry` that share a position (to 1e-4), looking
 * at **position only**. UV-mapped or hard-edged shapes duplicate vertices
 * along seams, with equal positions but different `uv`/`normal`; those must be
 * one particle of the simulation or the seam would tear open.
 *
 * @category Soft Bodies
 */
export const weld = (geometry: BufferGeometry): WeldResult => {
  const position = geometry.attributes.position as BufferAttribute | undefined;
  if (!position) {
    throw new Error(
      "react-three-rapier: SoftBody geometry must have a position attribute."
    );
  }
  const map = new Uint32Array(position.count);
  const unique: number[] = [];
  const seen = new Map<string, number>();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(
      z * 1e4
    )}`;
    let welded = seen.get(key);
    if (welded === undefined) {
      welded = unique.length / 3;
      seen.set(key, welded);
      unique.push(x, y, z);
    }
    map[i] = welded;
  }

  const source = geometry.index;
  const count = source ? source.count : position.count;
  const index = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    index[i] = map[source ? source.getX(i) : i];
  }
  return { positions: new Float32Array(unique), index, map };
};

/**
 * Builds an indexed geometry with one vertex per welded vertex, using a weld
 * map from {@link weld}. Other attributes (`uv`, `color`, ...) are taken from
 * the first original vertex that welded into each slot.
 *
 * @category Soft Bodies
 */
export const applyWeldMap = (
  geometry: BufferGeometry,
  map: Uint32Array,
  weldedCount: number
): BufferGeometry => {
  const firstSource = new Int32Array(weldedCount).fill(-1);
  for (let i = 0; i < map.length; i++) {
    if (firstSource[map[i]] === -1) firstSource[map[i]] = i;
  }

  const result = new BufferGeometry();
  const source = geometry.index;
  const index = new Uint32Array(source ? source.count : map.length);
  for (let i = 0; i < index.length; i++) {
    index[i] = map[source ? source.getX(i) : i];
  }
  result.setIndex(new BufferAttribute(index, 1));

  const getters = ["getX", "getY", "getZ", "getW"] as const;
  for (const name of Object.keys(geometry.attributes)) {
    const attribute = geometry.attributes[name] as BufferAttribute;
    const { itemSize } = attribute;
    const array = new (attribute.array.constructor as new (
      length: number
    ) => typeof attribute.array)(weldedCount * itemSize);
    for (let v = 0; v < weldedCount; v++) {
      for (let k = 0; k < itemSize; k++) {
        array[v * itemSize + k] = attribute[getters[k]](firstSource[v]);
      }
    }
    const welded = new BufferAttribute(array, itemSize, attribute.normalized);
    if (name === "position") welded.setUsage(35048 /* DynamicDrawUsage */);
    result.setAttribute(name, welded);
  }
  return result;
};

/**
 * Returns a copy of `geometry` welded on position only (see {@link weld}),
 * always indexed.
 *
 * @category Soft Bodies
 */
export const weldGeometry = (geometry: BufferGeometry): BufferGeometry => {
  const { positions, map } = weld(geometry);
  return applyWeldMap(geometry, map, positions.length / 3);
};
