import { useEffect, useMemo, useRef } from "react";

/**
 * Initiate an instance and return a safe getter
 */
export const useImperativeInstance = <InstanceType>(
  createFn: () => InstanceType,
  destroyFn: (instance: InstanceType) => void
) => {
  const ref = useRef<InstanceType>();

  const refGetter = useMemo(
    () => () => {
      if (!ref.current) {
        ref.current = createFn();
      }

      return ref.current;
    },
    []
  );

  useEffect(() => {
    const instance = refGetter();

    return () => {
      destroyFn(instance);
      ref.current = undefined;
    };
  }, []);

  return refGetter;
};
