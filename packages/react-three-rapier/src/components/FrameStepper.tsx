import { useFrame } from "@react-three/fiber";
import { memo } from "react";
import { useRaf } from "../utils/utils-physics";
import { PhysicsProps } from "./Physics";

interface FrameStepperProps {
  type?: PhysicsProps["updateLoop"];
  onStep: (dt: number) => void;
  updatePriority?: number;
}

const UseFrameStepper = ({ onStep, updatePriority }: FrameStepperProps) => {
  useFrame((_, dt) => {
    onStep(dt);
  }, updatePriority);

  return null;
};

const RafStepper = ({ onStep }: FrameStepperProps) => {
  useRaf((dt) => {
    onStep(dt);
  });

  return null;
};

const FrameStepper = ({ onStep, type, updatePriority }: FrameStepperProps) => {
  return type === "independent" ? (
    <RafStepper onStep={onStep} />
  ) : (
    <UseFrameStepper onStep={onStep} updatePriority={updatePriority} />
  );
};

export default memo(FrameStepper);
