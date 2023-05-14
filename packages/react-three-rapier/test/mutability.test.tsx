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
    ref: RefObject<RapierRigidBody>;
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

describe("RigidBody mutability", async () => {
  it.fails(
    "should create a new rigid body when immutable props change",
    async () => {
      let _ref: RefObject<RapierRigidBody>;
      let _setProps: (props: RigidBodyProps) => void;

      await awaitReady(
        <RigidBodyArgsChanger
          onReady={({ ref, setProps }) => {
            _ref = ref;
            _setProps = setProps;
          }}
        />
      );

      let ref = _ref!.current!;
      const firstHandle = ref.handle;

      expect(ref).toBeDefined();
      expect(ref.translation().x).toEqual(0);
      expect(ref.bodyType()).toBe(0);

      await ReactThreeTestRenderer.act(async () => {
        _setProps({
          type: "fixed",
          position: [1, 0, 0],
          canSleep: true
        });
      });

      // This is the same rigidbody, but with new type
      ref = _ref!.current!;

      expect(ref.handle).toBe(firstHandle);
      expect(ref.translation().x).toEqual(1);
      expect(ref.bodyType()).toBe(1);

      await ReactThreeTestRenderer.act(async () => {
        _setProps({
          type: "kinematicPosition",
          position: [1, 0, 0],
          canSleep: false
        });
      });

      // This is now a new rigidbody
      ref = _ref!.current!;

      expect(ref.handle).not.toBe(firstHandle);
      expect(ref.translation().x).toEqual(1);
      expect(ref.bodyType()).toBe(2);
    }
  );
});

const ColliderArgsChanger = ({
  onReady
}: {
  onReady: ({
    setProps,
    ref
  }: {
    setProps: (props: CuboidColliderProps) => void;
    ref: RefObject<RapierCollider>;
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

describe("Collider mutability", async () => {
  it.fails(
    "should create a new collider when immutable props change",
    async () => {
      let _ref: RefObject<RapierCollider>;
      let _setProps: (props: CuboidColliderProps) => void;

      await awaitReady(
        <ColliderArgsChanger
          onReady={({ ref, setProps }) => {
            _ref = ref;
            _setProps = setProps;
          }}
        />
      );

      let ref = _ref!.current!;
      let shape = ref.shape as Cuboid;

      expect(shape.halfExtents.x).toBe(1);
      const firstHandle = ref.handle;

      await ReactThreeTestRenderer.act(async () => {
        _setProps({
          position: [1, 0, 0],
          args: [2, 1, 1]
        });
      });

      // This is a new collider
      ref = _ref!.current!;
      shape = ref.shape as Cuboid;

      expect(ref.handle).not.toBe(firstHandle);
      expect(shape.halfExtents.x).toBe(2);

      await ReactThreeTestRenderer.act(async () => {
        _setProps({
          position: [2, 0, 0],
          args: [3, 1, 1]
        });
      });

      // This is yet another new collider
      ref = _ref!.current!;
      shape = ref.shape as Cuboid;

      expect(ref.handle).not.toBe(firstHandle);
      expect(shape.halfExtents.x).toBe(3);
    }
  );
});
