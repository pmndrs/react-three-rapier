import type {
  RigidBody as RawRigidBody,
  SoftBody as RawSoftBody,
  SoftBodyCellModel,
  SoftBodyDesc,
  SoftBodyMaterial,
  SoftBodySolver
} from "@dimforge/rapier3d-compat";
import type { RefObject } from "react";
import type { Vector3 } from "three";

/**
 * The kind of deformable body to build from a geometry.
 *
 * - `cloth`: the geometry's welded vertices are particles, connected along the
 *   triangle edges. Use with open surfaces (planes, curtains, flags).
 * - `volume`: the closed surface is filled with tetrahedra; the rendered
 *   vertices are skinned onto them. Use with closed shapes (jelly cubes,
 *   spheres).
 * - `rope`: the geometry's vertices, in order, are the particles of a chain.
 *   Use with a `<line>` or `<points>` whose position attribute lists the rope
 *   from start to end.
 *
 * @category Soft Bodies
 */
export type SoftBodyType = "cloth" | "volume" | "rope";

/**
 * Selects particles of a soft body: either explicit particle indices, or a
 * predicate called for every particle with its rest position in the **mesh's
 * local space** (the space of its geometry before the soft body was created)
 * and its particle index.
 *
 * For `cloth` and `rope` particle indices are vertex indices of the welded
 * geometry. For `volume` they are indices of the internal simulation
 * particles, so prefer a predicate.
 *
 * @category Soft Bodies
 */
export type SoftBodyParticleSelector =
  | number[]
  | ((position: Vector3, index: number) => boolean);

/**
 * Anchors particles of a soft body to a rigid body, so the soft body follows it.
 *
 * @category Soft Bodies
 */
export interface SoftBodyAttachment {
  /** The particles to attach. */
  particles: SoftBodyParticleSelector;
  /**
   * The rigid body to attach to, or a ref to it (e.g. a `<RigidBody ref>`).
   * Particles are attached at their current positions. A ref must already be
   * populated when the soft body is created, so declare the `<RigidBody>`
   * before the `<SoftBody>`.
   */
  body: RawRigidBody | RefObject<RawRigidBody | null | undefined>;
}

/**
 * Payload of `onTear`.
 *
 * @category Soft Bodies
 */
export interface SoftBodyTearPayload {
  /** The soft body that was torn. */
  softBody: RawSoftBody;
  /** The pieces that disconnected and became soft bodies of their own. */
  pieces: RawSoftBody[];
  /**
   * The edges that tore, as flattened particle index pairs (as in Rapier's
   * `SoftBodyTearEvent.tornEdges()`), not edge indices.
   */
  tornEdges: number[];
  /**
   * The cells that tore, as flattened particle indices (empty for `cloth` and
   * `rope`), as in Rapier's `SoftBodyTearEvent.tornCells()`.
   */
  tornCells: number[];
}

/**
 * Options shared by {@link SoftBody} and {@link useSoftBody}. They are read
 * once, when the body is created; changing them afterwards has no effect
 * (like `<RigidBody>`'s creation props). Remount with a `key` to rebuild.
 *
 * @category Soft Bodies
 */
export interface SoftBodyOptions {
  /** What to build from the geometry. @defaultValue "cloth" */
  type?: SoftBodyType;

  /**
   * Natural frequency (Hz) of the body's springs. Higher is stiffer. Leave
   * undefined for Rapier's default.
   */
  stiffness?: number;
  /**
   * Damping ratio of the springs: `0` oscillates forever, `1` is critically
   * damped. Leave undefined for Rapier's default.
   */
  damping?: number;
  /**
   * Full material control; overrides `stiffness` and `damping`. Rapier
   * materials need the wasm to be initialised: pass a function
   * (`material={() => new SoftBodyMaterial()}`) when defining it at module
   * scope or before `<Physics>` has loaded.
   */
  material?: SoftBodyMaterial | (() => SoftBodyMaterial);

  /** Total mass of the body, spread over its particles. */
  mass?: number;
  /** Particles that never move. */
  pinned?: SoftBodyParticleSelector;
  /** Particles anchored to rigid bodies. */
  attachments?: SoftBodyAttachment[];

  /**
   * `volume` only: edge length of the tetrahedral cells. Smaller is more
   * detailed and more expensive. Defaults to a fifth of the largest dimension.
   */
  cellSize?: number;
  /** `volume` only: the constitutive model of the cells. */
  cellModel?: SoftBodyCellModel;
  /** The solver used to hold the body together. */
  solver?: SoftBodySolver;
  /** Resist changes of volume (`volume` bodies). */
  volumePreservation?: boolean;
  /** Collide with itself. */
  selfContacts?: boolean;
  /** Thickness of the particles, which keeps cloth off surfaces. */
  particleRadius?: number;

  /** Multiplier on world gravity. @defaultValue 1 */
  gravityScale?: number;
  /** Velocity lost to drag. */
  linearDamping?: number;
  /** Extra solver iterations to make the body behave more rigidly. */
  additionalSolverIterations?: number;
  /** Whether the body may fall asleep. @defaultValue true */
  canSleep?: boolean;

  /**
   * Collide with rigid bodies and colliders. @defaultValue true
   */
  collisions?: boolean;
  /** Friction against colliders. */
  friction?: number;
  /** Bounciness against colliders. */
  restitution?: number;
  /** Rapier collision groups bitmask for the body's colliders. */
  collisionGroups?: number;
  /** Rapier solver groups bitmask for the body's colliders. */
  solverGroups?: number;

  /**
   * Escape hatch: receives the `SoftBodyDesc` right before the body is
   * created, to call any Rapier setter that has no prop. Return a descriptor
   * to replace it.
   */
  configure?: (desc: SoftBodyDesc) => SoftBodyDesc | void;

  /**
   * Called when the body tears (requires `material.tearStrain` or
   * `tearForce`, or a manual `softBody.tearEdge()`). For `cloth` and `rope`
   * the rendered triangles that cross a tear are removed so the tear is
   * visible. After the first tear a cloth's vertices are split per particle,
   * so seams of the original geometry (UV/hard-edge duplicates) are lost.
   *
   * Volume bodies also report tears, but only the main piece is rendered.
   */
  onTear?: (payload: SoftBodyTearPayload) => void;
}

/**
 * Re-exported for convenience in props.
 * @category Soft Bodies
 */
export type { RawSoftBody };
