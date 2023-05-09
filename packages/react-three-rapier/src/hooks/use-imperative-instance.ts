import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

/**
 * Initiate an instance and return a safe getter
 */
export const useImperativeInstance = <InstanceType>(
  createFn: () => InstanceType,
  destroyFn: (instance: InstanceType) => void,
  dependencyList: any[] = []
) => {
  const ref = useRef<InstanceType>();

  const getInstance = useMemo(
    () => () => {
      if (!ref.current) {
        ref.current = createFn();
      }

      return ref.current;
    },
    dependencyList
  );

  useLayoutEffect(() => {
    // Save the destroy function and instance
    const instance = getInstance();
    const destroy = () => destroyFn(instance);

    return () => {
      destroy();
      ref.current = undefined;
    };
  }, dependencyList);

  return getInstance;
};
