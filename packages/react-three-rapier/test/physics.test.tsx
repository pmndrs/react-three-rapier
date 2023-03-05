import { it, describe, expect, vi } from "vitest";
import {
  CuboidCollider,
  Physics,
  RapierContext,
  RapierRigidBody,
  RigidBody,
  useBeforePhysicsStep,
  vec3
} from "../src";
import React, { useEffect } from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { Box } from "@react-three/drei";
import { pause, UseRapierMounter } from "./test-utils";
import { useFrame } from "@react-three/fiber";

describe("physics", () => {
  describe("useRapier exposed things", () => {
    it("exposes a manual step function", async () => {
      const rigidBody = React.createRef<RapierRigidBody>();
      const rapierContext = await new Promise<RapierContext>(
        async (resolve, reject) => {
          try {
            await ReactThreeTestRenderer.create(
              <Physics paused>
                <UseRapierMounter ready={resolve} />

                <RigidBody
                  colliders="cuboid"
                  restitution={2}
                  ref={rigidBody}
                  linearVelocity={[20, 20, 20]}
                >
                  <Box />
                </RigidBody>
              </Physics>
            );
          } catch (e) {
            reject(e);
          }
        }
      );

      expect(vec3(rigidBody.current?.translation()).toArray()).to.deep.eq([
        0, 0, 0
      ]);

      await ReactThreeTestRenderer.act(async () => {
        rapierContext.step(1 / 60);
      });

      expect(vec3(rigidBody.current?.translation()).toArray()).to.deep.eq([
        0.3333333432674408, 0.3333333432674408, 0.3333333432674408
      ]);

      await ReactThreeTestRenderer.act(async () => {
        rapierContext.step(1 / 60);
      });

      expect(vec3(rigidBody.current?.translation()).toArray()).to.deep.eq([
        0.6666666865348816, 0.6639417409896851, 0.6666666865348816
      ]);

      await pause(100);

      // expect nothing to have changed
      expect(vec3(rigidBody.current?.translation()).toArray()).to.deep.eq([
        0.6666666865348816, 0.6639417409896851, 0.6666666865348816
      ]);
    });
  });

  describe("updateloop updates", () => {
    const BeforeStepper = ({
      onBeforePhysicsStep,
      onFrame,
      onReady
    }: {
      onBeforePhysicsStep: () => void;
      onReady: (value: unknown) => void;
      onFrame: () => void;
    }) => {
      useBeforePhysicsStep(onBeforePhysicsStep);

      useFrame(onFrame);

      useEffect(() => {
        onReady(null);
      }, []);

      return null;
    };

    it.only("updates on frame when using the 'follow' strategy", async () => {
      const beforeStepCallback = vi.fn();
      const frameCallback = vi.fn();

      let renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;

      await new Promise(async (resolve) => {
        renderer = await ReactThreeTestRenderer.create(
          <Physics>
            <RigidBody colliders="cuboid" restitution={2}>
              <CuboidCollider args={[1, 1, 1]} />
            </RigidBody>

            <BeforeStepper
              onBeforePhysicsStep={beforeStepCallback}
              onFrame={frameCallback}
              onReady={resolve}
            />
          </Physics>
        );
      });

      expect(beforeStepCallback).toBeCalledTimes(0);
      expect(frameCallback).toBeCalledTimes(0);

      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(1, 1 / 60);
      });

      expect(beforeStepCallback).toBeCalledTimes(1);
      expect(frameCallback).toBeCalledTimes(1);

      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(1, 1 / 60);
      });

      expect(beforeStepCallback).toBeCalledTimes(2);
      expect(frameCallback).toBeCalledTimes(2);
    });

    it.only("updates when using the 'independent' strategy", async () => {
      const beforeStepCallback = vi.fn();
      const frameCallback = vi.fn();

      let renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;

      await new Promise(async (resolve) => {
        renderer = await ReactThreeTestRenderer.create(
          <Physics updateLoop="independent">
            <RigidBody colliders="cuboid" restitution={2}>
              <CuboidCollider args={[1, 1, 1]} />
            </RigidBody>
            <BeforeStepper
              onBeforePhysicsStep={beforeStepCallback}
              onFrame={frameCallback}
              onReady={resolve}
            />
          </Physics>,
          { frameloop: "demand" }
        );
      });

      await ReactThreeTestRenderer.act(async () => {});

      expect(beforeStepCallback).toHaveBeenCalled();
      expect(frameCallback).toHaveBeenCalled();

      frameCallback.mockClear();

      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(1, 1 / 60);
      });

      expect(beforeStepCallback).toHaveBeenCalled();
      expect(frameCallback).toBeCalledTimes(1);

      frameCallback.mockClear();

      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(1, 1 / 60);
      });

      expect(beforeStepCallback).toHaveBeenCalled();
      expect(frameCallback).toBeCalledTimes(1);
    });
  });
});
