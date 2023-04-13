import React, { RefObject, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereBufferGeometry,
  Vector3
} from "three";
import { VertexNormalsHelper } from "three-stdlib";
import { AttractorState } from "./Attractor";

const _v3 = new Vector3();

export const AttractorDebugHelper = (
  props: AttractorState & {
    object: RefObject<Object3D>;
  }
) => {
  const { scene } = useThree();
  const ref = useRef<Mesh>();
  const normalsHelper = useRef<VertexNormalsHelper>();
  const color = props.strength > 0 ? 0x0000ff : 0xff0000;

  useEffect(() => {
    ref.current = new Mesh(
      new SphereBufferGeometry(0.2, 6, 6),
      new MeshBasicMaterial({ color, wireframe: true })
    );

    normalsHelper.current = new VertexNormalsHelper(
      ref.current,
      props.range,
      color
    );
    normalsHelper.current.frustumCulled = false;

    scene.add(ref.current);
    scene.add(normalsHelper.current);

    return () => {
      if (normalsHelper.current && ref.current) {
        scene.remove(normalsHelper.current);
        scene.remove(ref.current);
      }
    };
  }, [props, color]);

  useFrame(() => {
    if (ref.current && props.object.current) {
      const worldPosition = props.object.current.getWorldPosition(_v3);

      ref.current.position.copy(worldPosition);
      normalsHelper.current?.update();
    }
  });

  return null;
};
