import { useEffect, useMemo, useRef } from "react";

/**
 * Initiate an instance and return a safe getter
 */
export const useImperativeInstance = <InstanceType>(
  createFn: () => InstanceType,
  destroyFn: (instance: InstanceType) => void,
  dependencyList: any[] = []
) => {
  const ref = useRef<InstanceType>();

  const refGetter = useMemo(
    () => () => {
      if (!ref.current) {
        ref.current = createFn();
      }

      return ref.current;
    },
    dependencyList
  );

  useEffect(() => {
    // Save the destroy function and instance
    const instance = refGetter();
    const destroy = () => destroyFn(instance);

    return () => {
      destroy();
      ref.current = undefined;
    };
  }, dependencyList);

  return refGetter;
};
