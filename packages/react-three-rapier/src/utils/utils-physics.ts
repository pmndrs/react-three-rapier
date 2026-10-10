import { useEffect, useRef } from "react";

/**
 * The subset of the r3f v10 scheduler (`@pmndrs/scheduler`) the stepper uses.
 * Fixed-step members (`getOverstep`, `getPhaseTimestep`) only exist from
 * scheduler 0.3, so they are optional here and feature-detected at runtime.
 * @internal
 */
export interface StepperScheduler {
  addPhase(
    name: string,
    options?: {
      before?: string;
      after?: string;
      timestep?: number;
      maxSubsteps?: number;
    }
  ): void;
  hasPhase(name: string): boolean;
  getOverstep?: (phase?: string, rootId?: string) => number;
  getPhaseTimestep?: (name: string) => number | undefined;
  setPhaseTimestep?: (
    name: string,
    timestep: number | undefined,
    options?: { maxSubsteps?: number }
  ) => void;
}

/**
 * Per-frame scheduler phase owned by react-three-rapier. Runs after every fixed
 * physics phase and before `update`, and hosts the mesh sync job (and, without
 * scheduler fixed-step support or with `timeStep="vary"`, the step itself).
 * @internal
 */
export const RAPIER_PHASE = "rapier";

/**
 * Per-frame phase right before `render`. Hosts the late sync pass that
 * re-expresses synced poses when an ancestor moved during `update`.
 * @internal
 */
export const RAPIER_LATE_PHASE = "rapier:late";

/** Upper bound for a single variable step, in seconds. @internal */
export const MAX_VARIABLE_STEP = 0.5;

/** @internal */
export const DEFAULT_MAX_SUB_STEPS = 5;

// Same tolerance the scheduler uses, so both clocks agree on float edges
// (e.g. three deltas of 1/60 must yield exactly three steps).
const TIMESTEP_EPSILON = 1e-9;

/**
 * Whether the installed scheduler can run fixed-timestep phases
 * (`@pmndrs/scheduler` >= 0.3, `@react-three/fiber` >= 10.0.0-canary.a056612).
 * @internal
 */
export const supportsFixedPhases = (
  scheduler: Partial<StepperScheduler> | null | undefined
): scheduler is FixedStepScheduler =>
  !!scheduler &&
  typeof scheduler.addPhase === "function" &&
  typeof scheduler.hasPhase === "function" &&
  typeof scheduler.getOverstep === "function" &&
  typeof scheduler.getPhaseTimestep === "function" &&
  typeof scheduler.setPhaseTimestep === "function";

/** @internal */
export type FixedStepScheduler = StepperScheduler &
  Required<
    Pick<
      StepperScheduler,
      "getOverstep" | "getPhaseTimestep" | "setPhaseTimestep"
    >
  >;

/** @internal */
export const sanitizeMaxSubSteps = (maxSubSteps: number | undefined) =>
  maxSubSteps !== undefined && Number.isFinite(maxSubSteps) && maxSubSteps >= 1
    ? Math.floor(maxSubSteps)
    : DEFAULT_MAX_SUB_STEPS;

/** @internal */
export const ensureRapierPhase = (scheduler: StepperScheduler) => {
  if (!scheduler.hasPhase(RAPIER_PHASE)) {
    scheduler.addPhase(RAPIER_PHASE, { before: "update" });
  }
  return RAPIER_PHASE;
};

/** @internal */
export const ensureLatePhase = (scheduler: StepperScheduler) => {
  if (!scheduler.hasPhase(RAPIER_LATE_PHASE)) {
    scheduler.addPhase(RAPIER_LATE_PHASE, { before: "render" });
  }
  return RAPIER_LATE_PHASE;
};

const FIXED_PHASE_PREFIX = "rapier:fixed:";

// Fixed phases currently owned by a mounted world. Kept on the scheduler
// singleton itself so duplicate copies of this module (or HMR) share it.
const IN_USE = Symbol.for("@react-three/rapier/fixed-phases-in-use");
const phasesInUse = (scheduler: StepperScheduler): Set<string> =>
  ((scheduler as any)[IN_USE] ??= new Set<string>());

/**
 * Gives a world its own fixed-timestep phase, `rapier:fixed:<n>`, reusing a
 * phase released by an unmounted world when possible.
 *
 * Why one phase per world: phase timesteps are global to the scheduler
 * singleton, so retiming r3f's shared `physics` phase would change it for
 * every other user and rule out worlds with different timesteps. A phase per
 * world can be retimed in place (`setPhaseTimestep`) when `timeStep` or
 * `maxSubSteps` change. The scheduler has no `removePhase`, hence the reuse:
 * the number of phases is bounded by the most worlds ever mounted at once.
 * @internal
 */
export const acquireFixedPhase = (
  scheduler: FixedStepScheduler,
  timeStep: number,
  maxSubSteps: number
) => {
  ensureRapierPhase(scheduler);
  const inUse = phasesInUse(scheduler);

  let index = 0;
  while (inUse.has(FIXED_PHASE_PREFIX + index)) index++;
  const name = FIXED_PHASE_PREFIX + index;
  inUse.add(name);

  if (scheduler.hasPhase(name)) {
    scheduler.setPhaseTimestep(name, timeStep, { maxSubsteps: maxSubSteps });
  } else {
    scheduler.addPhase(name, {
      before: RAPIER_PHASE,
      timestep: timeStep,
      maxSubsteps: maxSubSteps
    });
  }
  return name;
};

/** @internal */
export const releaseFixedPhase = (
  scheduler: StepperScheduler,
  name: string
) => {
  phasesInUse(scheduler).delete(name);
};

/** @internal */
export interface AccumulatorState {
  accumulator: number;
}

/**
 * Banks `delta` into `state.accumulator` and returns how many fixed steps are
 * owed. Mirrors the scheduler's fixed clock: at most `maxSubSteps` per call,
 * surplus time is dropped (keeping the sub-step fraction) so a long frame costs
 * one slow frame instead of a spiral of slower ones.
 * @internal
 */
export const advanceAccumulator = (
  state: AccumulatorState,
  delta: number,
  timeStep: number,
  maxSubSteps: number
) => {
  if (!(delta > 0)) delta = 0;
  state.accumulator += delta;

  let steps = Math.floor((state.accumulator + TIMESTEP_EPSILON) / timeStep);
  if (steps < 0) steps = 0;
  const overflow = steps > maxSubSteps;
  if (overflow) steps = maxSubSteps;

  state.accumulator -= steps * timeStep;
  if (overflow && state.accumulator >= timeStep) {
    state.accumulator %= timeStep;
  }
  if (state.accumulator < 0) state.accumulator = 0;

  return steps;
};

/**
 * Interpolation alpha for an accumulator, in [0, 1).
 * @internal
 */
export const accumulatorAlpha = (state: AccumulatorState, timeStep: number) =>
  Math.min(0.999999, Math.max(0, state.accumulator / timeStep));

/**
 * Runs `callback(deltaSeconds)` on every animation frame, independent of r3f.
 * The first frame reports a delta of 0.
 * @internal
 */
export const useRaf = (callback: (dt: number) => void) => {
  const cb = useRef(callback);
  const raf = useRef(0);
  const lastFrame = useRef<number | null>(null);

  useEffect(() => {
    cb.current = callback;
  }, [callback]);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const delta = lastFrame.current === null ? 0 : now - lastFrame.current;
      lastFrame.current = now;

      raf.current = requestAnimationFrame(loop);
      cb.current(delta / 1000);
    };

    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      lastFrame.current = null;
    };
  }, []);
};
