import { InteractionGroups } from "@dimforge/rapier3d-compat";

/**
 * Start creating a collision bitmask, starting with the groups
 * the object is in.
 *
 * @param groupLayers One or more numerical layer identifiers.
 * @returns A builder object with additional methods for configuring collisions.
 */
export const collide = (...groupLayers: number[]) => ({
  /**
   * Collide the object with other groups.
   *
   * @param maskLayers One or more numerical layer identifiers.
   * @returns A bitmask representing the collision configuration.
   */
  with: (...maskLayers: number[]) => group(...groupLayers) + mask(...maskLayers),

  /**
   * Collide the object with all other groups.
   *
   * @returns A bitmask representing the collision configuration.
   */
  withEverything: () => group(...groupLayers) + 0b11111111,

  /**
   * Collide the object with nothing.
   *
   * @returns A bitmask representing the collision configuration.
   */
  withNothing: () => group(...groupLayers)
})

/**
 * Creates a bitmask from a list of numerical layer identifiers.
 *
 * @param layers One or more numerical layer identifiers.
 * @returns A bitmask representing the given layers.
 */
export const bitmask = (...layers: number[]): InteractionGroups =>
  layers.reduce((acc, layer) => acc | (1 << layer), 0);

/**
 * Convert the specified numerical layers into a bitmask representing the
 * group association part in Rapier's collision and solver groups properties.
 *
 * @param layers One or more numerical layer identifiers.
 */
export const group = (...layers: number[]): InteractionGroups => bitmask(...layers) << 16;

/**
 * Convert the specified numerical layers into a bitmask representing the
 * mask part in Rapier's collision and solver groups properties.
 *
 * @param layers One or more numerical layer identifiers.
 */
export const mask = (...layers: number[]): InteractionGroups => bitmask(...layers);
