import { useEffect, useRef } from "react";

export const useRaf = (callback: (dt: number) => void) => {
  const cb = useRef(callback);
  const raf = useRef(0);
  const lastFrame = useRef(0);

  useEffect(() => {
    cb.current = callback;
  }, [callback]);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const delta = now - lastFrame.current;

      raf.current = requestAnimationFrame(loop);
      cb.current(delta / 1000);
      lastFrame.current = now;
    };

    raf.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf.current);
  }, []);
};
