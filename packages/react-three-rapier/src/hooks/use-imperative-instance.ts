import { DependencyList, useCallback, useEffect, useMemo, useRef } from "react";

/**
 * Initiate an instance and return a safe getter
 */
export const useImperativeInstance = <InstanceType>(
  createFn: () => InstanceType,
  destroyFn: (instance: InstanceType) => void,
  dependencyList: DependencyList
) => {
  const ref = useRef<InstanceType>();

  const getInstance = useCallback(() => {
    if (!ref.current) {
      ref.current = createFn();
    }

    return ref.current;
  }, dependencyList);

  useEffect(() => {
    // Save the destroy function and instance
    const instance = getInstance();
    const destroy = () => destroyFn(instance);

    return () => {
      destroy();
      ref.current = undefined;
    };
  }, [getInstance]);

  return getInstance;
};
