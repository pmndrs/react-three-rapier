// vitest.setup.ts
import "vitest-canvas-mock";

// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

// Ignore all warnings that are repetitive and not helpful
const catcher =
  (logger: any) =>
  (...args: any) => {
    if (
      [
        "Multiple instances of Three.js being imported.",
        "was not wrapped in act(...)"
      ].some((m) => args[0]?.includes?.(m))
    ) {
      return;
    }

    logger(...args);
  };

console.log = catcher(console.log);
console.warn = catcher(console.warn);
console.error = catcher(console.error);
