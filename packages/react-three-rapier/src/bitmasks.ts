import { InteractionGroups } from "@dimforge/rapier3d-compat";

/**
 * Calculates an InteractionGroup bitmask for use in the `collisionGroups` or `solverGroups`
 * properties of RigidBody or Collider components. The first argument represents a list of
 * groups the entity is in (expressed as numbers from 1 to 16). The second argument is a list
 * of groups that will be filtered against. When it is omitted, all groups are filtered against.
 *
 * @example
 * A RigidBody that is member of group 1 and will collide with everything from groups 1 and 2:
 *
 * ```tsx
 * <RigidBody collisionGroups={interactionGroups([1], [1, 2])} />
 * ```
 *
 * A RigidBody that is member of groups 1 and 2 and will collide with everything else:
 *
 * ```tsx
 * <RigidBody collisionGroups={interactionGroups([1, 2])} />
 * ```
 *
 * A RigidBody that is member of groups 1 and 2 and will not collide with anything:
 *
 * ```tsx
 * <RigidBody collisionGroups={interactionGroups([1, 2], [])} />
 * ```
 *
 * Please note that Rapier needs interaction filters to evaluate to true between _both_ colliding
 * entities for collision events to trigger.
 *
 * @param memberships Groups the collider is a member of. (Values can range from 1 to 16.)
 * @param filters Groups the interaction group should filter against. (Values can range from 1 to 16.)
 * @returns An InteractionGroup bitmask.
 */
export const interactionGroups =
  (memberships: number | number[], filters?: number | number[]): InteractionGroups =>
    (bitmask(memberships) << 16) + (filters !== undefined ? bitmask(filters) : 0b1111_1111_1111_1111)

const bitmask = (groups: number | number[]): InteractionGroups =>
  [groups].flat().reduce((acc, layer) => acc | (1 << (layer - 1)), 0);
