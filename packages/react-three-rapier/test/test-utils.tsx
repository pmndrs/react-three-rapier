import { Collider } from "@dimforge/rapier3d-compat";
import React, { useRef, MutableRefObject, useEffect } from "react";
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
