import { Collider } from "@dimforge/rapier3d-compat";
import React, { useRef, useEffect, ReactNode } from "react";
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
  const ref = useRef<Collider>(null!);

  useEffect(() => {
    ready(ref.current);
  }, []);

  return <CuboidCollider ref={ref} {...rest} />;
};

// These helpers await `create` before handing back the instance. Resolving on the `ready`
// callback alone leaves `create`'s act() scope open while the test (or the next test) starts
// its own act(), and overlapping act scopes don't flush reliably on r3f v10.
export const createCollider = async (props: CuboidColliderProps) => {
  let resolveCollider!: (collider: Collider) => void;
  const ready = new Promise<Collider>((resolve) => (resolveCollider = resolve));

  await ReactThreeTestRenderer.create(
    <Physics>
      <TestCollider {...props} ready={resolveCollider} />
    </Physics>
  );

  return ready;
};

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

export const createRigidBody = async (props: RigidBodyProps) => {
  let resolveRigidBody!: (rigidBody: RapierRigidBody) => void;
  const ready = new Promise<RapierRigidBody>(
    (resolve) => (resolveRigidBody = resolve)
  );

  await ReactThreeTestRenderer.create(
    <Physics>
      <TestRigidBody {...props} ready={resolveRigidBody} />
    </Physics>
  );

  return ready;
};

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
  let resolveStep!: (step: (num: number) => void) => void;
  const ready = new Promise<(num: number) => void>(
    (resolve) => (resolveStep = resolve)
  );

  await ReactThreeTestRenderer.create(
    <Physics paused>
      {children}
      <Mounter ready={resolveStep} />
    </Physics>
  );

  return ready;
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
) => renderer.scene.children.map((c: any) => c.instance.position);

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
