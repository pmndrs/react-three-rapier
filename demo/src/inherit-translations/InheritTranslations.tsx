import React from "react";
import { Dispatch, FC, memo, ReactNode, useEffect, useState } from "react";

import { Box, Html, Plane, Sphere, useGLTF } from "@react-three/drei";
import {
  CuboidCollider,
  RigidBody,
  useBall,
  useConvexHull,
  useCuboid,
  useCylinder,
} from "@react-three/rapier";
import { Mesh } from "three";

export const InheritTranslations: FC<{ setUI: Dispatch<ReactNode> }> = ({
  setUI,
}) => {
  useEffect(() => {
    setUI(<></>);
  }, []);

  return (
    <group>
      <group position={[0, 0, 0]}>
        <RigidBody>
          <Box />

          <CuboidCollider />
        </RigidBody>
      </group>
    </group>
  );
};
