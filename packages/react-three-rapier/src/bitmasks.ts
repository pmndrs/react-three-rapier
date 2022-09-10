import { InteractionGroups } from "@dimforge/rapier3d-compat";

/**
 * Start creating a collision bitmask, starting with the groups
 * the object is in.
 *
 * @param group One or more numerical layer identifiers.
 * @returns A builder object with additional methods for configuring collisions.
 */
export const collide = (...group: number[]) => ({
  /**
   * Collide the object with other groups.
   *
   * @param mask One or more numerical layer identifiers.
   * @returns A bitmask representing the collision configuration.
   */
  with: (...mask: number[]) => (bitmask(...group) << 16) + bitmask(...mask),

  /**
   * Collide the object with all other groups.
   *
   * @returns A bitmask representing the collision configuration.
   */
  withEverything: () => (bitmask(...group) << 16) + 0b11111111,

  /**
   * Collide the object with nothing.
   *
   * @returns A bitmask representing the collision configuration.
   */
  withNothing: () => (bitmask(...group) << 16)
})

/**
 * Creates a bitmask from a list of numerical layer identifiers.
 *
 * @param layers One or more numerical layer identifiers.
 * @returns A bitmask representing the given layers.
 */
export const bitmask = (...layers: number[]): InteractionGroups =>
  layers.reduce((acc, layer) => acc | (1 << layer), 0);

export const group = (...layers: number[]): InteractionGroups => bitmask(...layers) << 16;
export const mask = (...layers: number[]): InteractionGroups => bitmask(...layers);
