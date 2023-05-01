import React, {
  RefObject,
  Suspense,
  createRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { describe, expect, it } from "vitest";

import {
  RigidBody,
  Physics,
  CuboidCollider,
  RapierRigidBody,
  RigidBodyProps,
  ColliderProps,
  RapierCollider,
  CuboidColliderProps
} from "../src";
import { awaitReady, pause } from "./test-utils";
import { Collider, Cuboid, Shape } from "@dimforge/rapier3d-compat";

const RigidBodyArgsChanger = ({
  onReady
}: {
  onReady: ({
    setProps,
    ref
  }: {
    setProps: (props: RigidBodyProps) => void;
    ref: React.RefObject<RapierRigidBody>;
  }) => void;
}) => {
  const ref = useRef<RapierRigidBody>(null);
  const [props, setProps] = useState<RigidBodyProps>({
    type: "dynamic",
    position: [0, 0, 0],
    canSleep: true
  });

  useEffect(() => {
    onReady({
      setProps,
      ref
    });
  }, []);

  return <RigidBody ref={ref} {...props} />;
};

const ColliderArgsChanger = ({
  onReady
}: {
  onReady: ({
    setProps,
    ref
  }: {
    setProps: (props: CuboidColliderProps) => void;
    ref: React.RefObject<RapierCollider>;
  }) => void;
}) => {
  const ref = useRef<RapierCollider>(null);
  const [props, setProps] = useState<CuboidColliderProps>({
    position: [0, 0, 0],
    args: [1, 1, 1]
  });

  useEffect(() => {
    onReady({
      setProps,
      ref
    });
  }, []);

  return <CuboidCollider ref={ref} {...props} />;
};

describe("RigidBody mutability", async () => {
  it("should create a new rigid body when immutable props change", async () => {
    let _ref: RefObject<RapierRigidBody>;
    let _setProps;

    await awaitReady(
      <RigidBodyArgsChanger
        onReady={({ ref, setProps }) => {
          _ref = ref;
          _setProps = setProps;
        }}
      />
    );

    expect(_ref!.current).toBeDefined();
    expect(_ref!.current!.bodyType()).toBe(0);
    const firstHandle = _ref!.current!.handle;

    await ReactThreeTestRenderer.act(async () => {
      _setProps({
        type: "fixed",
        position: [1, 0, 0],
        canSleep: true
      });
    });

    // This is the same handle rigidbody
    expect(_ref!.current!.handle).toBe(firstHandle);
    expect(_ref!.current!.bodyType()).toBe(1);

    await ReactThreeTestRenderer.act(async () => {
      _setProps({
        type: "kinematic",
        position: [2, 0, 0],
        canSleep: false
      });
    });

    // This is now a new rigidbody
    expect(_ref!.current!.handle).not.toBe(firstHandle);
    expect(_ref!.current!.bodyType()).toBe(1);
  });

  it("should create a new collider when immutable props change", async () => {
    let _ref: RefObject<RapierCollider>;
    let _setProps;

    await awaitReady(
      <ColliderArgsChanger
        onReady={({ ref, setProps }) => {
          _ref = ref;
          _setProps = setProps;
        }}
      />
    );

    expect((_ref!.current!.shape as Cuboid).halfExtents.x).toBe(1);
    const firstHandle = _ref!.current!.handle;

    await ReactThreeTestRenderer.act(async () => {
      _setProps({
        type: "fixed",
        position: [1, 0, 0],
        args: [2, 1, 1]
      });
    });

    // This is a new collider
    expect(_ref!.current!.handle).not.toBe(firstHandle);
    expect((_ref!.current!.shape as Cuboid).halfExtents.x).toBe(2);

    await ReactThreeTestRenderer.act(async () => {
      _setProps({
        type: "kinematic",
        position: [2, 0, 0],
        args: [3, 1, 1]
      });
    });

    // This is yet another new collider
    expect(_ref!.current!.handle).not.toBe(firstHandle);
    expect((_ref!.current!.shape as Cuboid).halfExtents.x).toBe(3);
  });
});
