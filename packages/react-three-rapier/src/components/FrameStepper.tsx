import { getScheduler, useFrame } from "@react-three/fiber";
import React, { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AccumulatorState,
  FixedStepScheduler,
  MAX_VARIABLE_STEP,
  RAPIER_PHASE,
  StepperScheduler,
  accumulatorAlpha,
  acquireFixedPhase,
  advanceAccumulator,
  ensureLatePhase,
  ensureRapierPhase,
  releaseFixedPhase,
  supportsFixedPhases,
  useRaf
} from "../utils/utils-physics";
import { PhysicsProps } from "./Physics";

/**
 * How a <Physics> world is advanced. Resolved from props and scheduler support.
 * - `fixed-phase`: scheduler-owned fixed timestep phase (scheduler >= 0.3)
 * - `accumulator`: our own fixed-step accumulator inside a per-frame job
 * - `vary`: one variable step per frame
 * - `independent`: our own requestAnimationFrame loop
 * @internal
 */
export type SteppingMode =
  "fixed-phase" | "accumulator" | "vary" | "independent";

interface FrameStepperProps {
  type: NonNullable<PhysicsProps["updateLoop"]>;
  timeStep: number | "vary";
  maxSubSteps: number;
  paused: boolean;
  interpolate: boolean;
  updatePriority?: number;
  /** Advance the world by exactly one step of `dt` seconds */
  stepWorld: (dt: number) => void;
  /** Write body poses into their Object3Ds, interpolated by `alpha` */
  syncMeshes: (alpha: number) => void;
  /** Re-express synced poses if an ancestor moved after the sync */
  lateSync: () => void;
}

/** @internal */
export const resolveSteppingMode = (
  type: FrameStepperProps["type"],
  timeStep: FrameStepperProps["timeStep"],
  scheduler: Partial<StepperScheduler> | null | undefined
): SteppingMode => {
  if (type === "independent") return "independent";
  if (timeStep === "vary") return "vary";
  return supportsFixedPhases(scheduler) ? "fixed-phase" : "accumulator";
};

/**
 * Steps once per fixed substep inside this world's own fixed scheduler phase,
 * then syncs meshes once per frame using the phase's overstep as the alpha.
 */
const FixedPhaseStepper = (props: FrameStepperProps & { timeStep: number }) => {
  const { timeStep, maxSubSteps } = props;
  const scheduler = getScheduler() as unknown as FixedStepScheduler;
  const [phase, setPhase] = useState<string | null>(null);

  // Own a phase while mounted (released for reuse on unmount). Acquired in an
  // effect so StrictMode's double mount releases and re-acquires the same one.
  useLayoutEffect(() => {
    const name = acquireFixedPhase(scheduler, timeStep, maxSubSteps);
    setPhase(name);
    return () => releaseFixedPhase(scheduler, name);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retimed below
  }, [scheduler]);

  // Retime our own phase in place; this never touches other worlds' phases.
  useLayoutEffect(() => {
    if (phase) {
      scheduler.setPhaseTimestep(phase, timeStep, { maxSubsteps: maxSubSteps });
    }
  }, [scheduler, phase, timeStep, maxSubSteps]);

  return phase ? (
    <FixedPhaseJobs {...props} phase={phase} scheduler={scheduler} />
  ) : null;
};

const FixedPhaseJobs = ({
  phase,
  scheduler,
  paused,
  interpolate,
  updatePriority = 0,
  stepWorld,
  syncMeshes
}: FrameStepperProps & { phase: string; scheduler: FixedStepScheduler }) => {
  useFrame(
    (_, dt) => {
      stepWorld(dt);
    },
    { phase, priority: updatePriority, enabled: !paused }
  );

  useFrame(
    (state) => {
      const alpha =
        paused || !interpolate
          ? 1
          : scheduler.getOverstep(phase, state.internal.rootId);
      syncMeshes(alpha);
    },
    { phase: RAPIER_PHASE, priority: updatePriority }
  );

  return null;
};

const createFrameAdvancer = (
  accumulator: AccumulatorState,
  { timeStep, maxSubSteps, paused, interpolate, stepWorld }: FrameStepperProps
) => {
  return (delta: number) => {
    if (paused) return 1;

    if (timeStep === "vary") {
      const dt = Math.min(Math.max(delta, 0), MAX_VARIABLE_STEP);
      if (dt > 0) stepWorld(dt);
      return 1;
    }

    const steps = advanceAccumulator(accumulator, delta, timeStep, maxSubSteps);
    for (let i = 0; i < steps; i++) {
      stepWorld(timeStep);
    }

    return interpolate ? accumulatorAlpha(accumulator, timeStep) : 1;
  };
};

/** Accumulator state, reset whenever the timestep changes (banked time would
 * otherwise be reinterpreted in the new step length). */
const useAccumulator = (timeStep: FrameStepperProps["timeStep"]) => {
  const state = useRef<AccumulatorState & { timeStep: typeof timeStep }>({
    accumulator: 0,
    timeStep
  });
  if (state.current.timeStep !== timeStep) {
    state.current.timeStep = timeStep;
    state.current.accumulator = 0;
  }
  return state.current;
};

/**
 * Fallback without scheduler fixed-step support, and `timeStep="vary"`:
 * one per-frame job that steps and then syncs.
 */
const FrameJobStepper = (props: FrameStepperProps) => {
  const { updatePriority = 0, syncMeshes, timeStep } = props;
  const scheduler = getScheduler() as unknown as StepperScheduler;
  const accumulator = useAccumulator(timeStep);

  useMemo(() => {
    ensureRapierPhase(scheduler);
  }, [scheduler]);

  const advance = createFrameAdvancer(accumulator, props);

  useFrame(
    (_, dt) => {
      syncMeshes(advance(dt));
    },
    { phase: RAPIER_PHASE, priority: updatePriority }
  );

  return null;
};

/**
 * `updateLoop="independent"`: our own requestAnimationFrame loop.
 */
const RafStepper = (props: FrameStepperProps) => {
  const { syncMeshes, timeStep } = props;
  const accumulator = useAccumulator(timeStep);

  const advance = createFrameAdvancer(accumulator, props);

  useRaf((dt) => {
    syncMeshes(advance(dt));
  });

  return null;
};

/**
 * Right before render: re-express synced poses if an ancestor moved after the
 * sync (e.g. in a regular `useFrame`). Nearly free when nothing moved.
 */
const LateSync = ({ lateSync }: Pick<FrameStepperProps, "lateSync">) => {
  const scheduler = getScheduler() as unknown as StepperScheduler;
  const phase = useMemo(() => ensureLatePhase(scheduler), [scheduler]);

  useFrame(lateSync, { phase });

  return null;
};

const Stepper = (props: FrameStepperProps) => {
  const mode = resolveSteppingMode(props.type, props.timeStep, getScheduler());

  switch (mode) {
    case "independent":
      return <RafStepper {...props} />;
    case "fixed-phase":
      return (
        <FixedPhaseStepper {...props} timeStep={props.timeStep as number} />
      );
    default:
      return <FrameJobStepper {...props} />;
  }
};

const FrameStepper = (props: FrameStepperProps) => (
  <>
    <Stepper {...props} />
    <LateSync lateSync={props.lateSync} />
  </>
);

export default memo(FrameStepper);
