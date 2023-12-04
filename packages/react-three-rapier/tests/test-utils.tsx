import { Collider } from "@dimforge/rapier3d-compat";
import React, { useRef, MutableRefObject, useEffect, ReactNode } from "react";
import {
  CuboidColliderProps,
  CuboidCollider,
  Physics,
  RapierRigidBody,
  RigidBodyProps,
  RigidBody,
  RapierContext,
  useRapier
} from "../src";
import ReactThreeTestRenderer from "@react-three/test-renderer";

export const pause = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const UseRapierMounter = ({
  ready
}: {
  ready: (context: RapierContext) => void;
}) => {
  const result = useRapier();

  useEffect(() => {
    ready(result);
  }, []);

  return null;
};

export const TestCollider = ({
  ready,
  ...rest
}: { ready: (collider: Collider) => void } & Pick<CuboidColliderProps, "args"> &
  Partial<CuboidColliderProps>) => {
  const ref = useRef() as MutableRefObject<Collider>;

  useEffect(() => {
    ready(ref.current);
  }, []);

  return <CuboidCollider ref={ref} {...rest} />;
};

export const createCollider = (props: CuboidColliderProps) =>
  new Promise<Collider>(
    async (resolve) =>
      await ReactThreeTestRenderer.act(async () => {
        await ReactThreeTestRenderer.create(
          <Physics>
            <TestCollider {...props} ready={resolve} />
          </Physics>
        );
      })
  );

export const TestRigidBody = ({
  ready,
  ...rest
}: { ready?: (rigidBody: RapierRigidBody) => void } & RigidBodyProps) => {
  const ref = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (ref.current) ready?.(ref.current);
  }, []);

  return (
    <RigidBody ref={ref} {...rest}>
      <CuboidCollider args={[1, 1, 1]} />
    </RigidBody>
  );
};

export const createRigidBody = (props: RigidBodyProps) =>
  new Promise<RapierRigidBody>(
    async (resolve) =>
      await ReactThreeTestRenderer.act(async () => {
        await ReactThreeTestRenderer.create(
          <Physics>
            <TestRigidBody {...props} ready={resolve} />
          </Physics>
        );
      })
  );

const Mounter = ({
  ready
}: {
  ready: (step: (num: number) => void) => void;
}) => {
  const { step } = useRapier();

  useEffect(() => {
    ready(step);
  }, []);

  return null;
};

export const awaitReady = async (children: ReactNode) => {
  const step = await new Promise<(num: number) => void>(async (resolve) => {
    await ReactThreeTestRenderer.create(
      <Physics paused>
        {children}
        <Mounter ready={resolve} />
      </Physics>
    );
  });

  return step;
};

export const RapierContextCatcher = ({
  callback
}: {
  callback: (obj: ReturnType<typeof useRapier>) => void;
}) => {
  const rapierContext = useRapier();

  useEffect(() => {
    callback(rapierContext);
  }, []);

  return null;
};

export const getScenePositions = (
  renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>
) => renderer.scene.children.map((c) => c.instance.position);

import { renderHook } from "@testing-library/react"; // v14.0.0
import { Mock, vitest } from "vitest";

// This suppresses console.error from cluttering the test output.
export const supressConsoleError = () => {
  vitest.spyOn(console, "error").mockImplementation(() => {});
};

export const restoreConsoleError = () => {
  if ((console.error as Mock).mockRestore !== undefined) {
    (console.error as Mock).mockRestore();
  }
};

export const renderHookWithErrors = (hook: () => void) => {
  supressConsoleError();
  renderHook(hook);
  restoreConsoleError();
};
