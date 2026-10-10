import { getScheduler, useFrame } from "@react-three/fiber";
import React, { memo, useMemo, useRef } from "react";
import {
  AccumulatorState,
  MAX_VARIABLE_STEP,
  RAPIER_PHASE,
  StepperScheduler,
  accumulatorAlpha,
  advanceAccumulator,
  ensureFixedPhase,
  ensureRapierPhase,
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
  | "fixed-phase"
  | "accumulator"
  | "vary"
  | "independent";

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
 * Steps once per fixed substep inside a dedicated fixed scheduler phase, then
 * syncs meshes once per frame using the phase's overstep as the alpha.
 */
const FixedPhaseStepper = ({
  timeStep,
  maxSubSteps,
  paused,
  interpolate,
  updatePriority = 0,
  stepWorld,
  syncMeshes
}: FrameStepperProps & { timeStep: number }) => {
  const scheduler = getScheduler() as unknown as StepperScheduler &
    Required<Pick<StepperScheduler, "getOverstep">>;

  // Phases must exist before useFrame's layout effect registers into them.
  const phase = useMemo(
    () => ensureFixedPhase(scheduler, timeStep, maxSubSteps),
    [scheduler, timeStep, maxSubSteps]
  );

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

/**
 * Fallback without scheduler fixed-step support, and `timeStep="vary"`:
 * one per-frame job that steps and then syncs.
 */
const FrameJobStepper = (props: FrameStepperProps) => {
  const { updatePriority = 0, syncMeshes, timeStep } = props;
  const scheduler = getScheduler() as unknown as StepperScheduler;
  const accumulator = useRef<AccumulatorState>({ accumulator: 0 });

  useMemo(() => {
    ensureRapierPhase(scheduler);
  }, [scheduler]);

  // A timestep change would otherwise reinterpret banked time.
  useMemo(() => {
    accumulator.current.accumulator = 0;
  }, [timeStep]);

  const advance = createFrameAdvancer(accumulator.current, props);

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
  const accumulator = useRef<AccumulatorState>({ accumulator: 0 });

  useMemo(() => {
    accumulator.current.accumulator = 0;
  }, [timeStep]);

  const advance = createFrameAdvancer(accumulator.current, props);

  useRaf((dt) => {
    syncMeshes(advance(dt));
  });

  return null;
};

const FrameStepper = (props: FrameStepperProps) => {
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

export default memo(FrameStepper);
