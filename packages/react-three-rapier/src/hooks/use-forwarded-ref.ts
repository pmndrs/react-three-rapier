import {
  ForwardedRef,
  MutableRefObject,
  RefObject,
  useEffect,
  useRef
} from "react";

export const useForwardedRef = <T>(
  forwardedRef: ForwardedRef<T>,
  defaultValue: T | null = null
): MutableRefObject<T> => {
  const innerRef = useRef<T>(defaultValue);

  // Update the forwarded ref when the inner ref changes
  useEffect(() => {
    if (forwardedRef) {
      if (typeof forwardedRef === "function") {
        forwardedRef(innerRef.current);
      } else {
        forwardedRef.current = innerRef.current;
      }
    }
  }, [forwardedRef, innerRef]);

  return innerRef as MutableRefObject<T>;
};
