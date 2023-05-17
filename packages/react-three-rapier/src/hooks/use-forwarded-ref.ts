import { ForwardedRef, MutableRefObject, useRef } from "react";

// Need to catch the case where forwardedRef is a function... how to do that?
export const useForwardedRef = <T>(
  forwardedRef: ForwardedRef<T>,
  defaultValue: T | null = null
): MutableRefObject<T> => {
  const innerRef = useRef<T>(defaultValue);

  // Update the forwarded ref when the inner ref changes
  if (forwardedRef && typeof forwardedRef !== "function") {
    if (!forwardedRef.current) {
      forwardedRef.current = innerRef.current;
    }
    return forwardedRef as MutableRefObject<T>;
  }

  return innerRef as MutableRefObject<T>;
};
