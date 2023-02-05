import { Euler, Quaternion, Vector3 } from "three";

/**
 * Takes an object resembling a Vector3 and returs a Three.Vector3
 * @category Math helpers
 */
export const vec3 = ({ x, y, z } = { x: 0, y: 0, z: 0 }) => {
  return new Vector3(x, y, z);
};

/**
 * Takes an object resembling a Quaternion and returs a Three.Quaternion
 * @category Math helpers
 */
export const quat = ({ x, y, z, w } = { x: 0, y: 0, z: 0, w: 1 }) => {
  return new Quaternion(x, y, z, w);
};

/**
 * Takes an object resembling an Euler and returs a Three.Euler
 * @category Math helpers
 */
export const euler = ({ x, y, z } = { x: 0, y: 0, z: 0 }) => {
  return new Euler(x, y, z);
};
