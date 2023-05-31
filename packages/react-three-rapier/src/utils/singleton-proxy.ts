/**
 * Creates a proxy that will create a singleton instance of the given class
 * when a property is accessed, and not before.
 *
 * @returns A proxy and a reset function, so that the instance can created again
 */
export const createSingletonProxy = <
  SingletonClass extends object,
  CreationFn extends () => SingletonClass = () => SingletonClass
>(
  /**
   * A function that returns a new instance of the class
   */
  createInstance: CreationFn
): { proxy: SingletonClass; reset: () => void } => {
  let instance: SingletonClass | undefined;

  const handler: ProxyHandler<SingletonClass> = {
    get(target, prop) {
      if (!instance) {
        instance = createInstance();
      }
      return Reflect.get(instance!, prop);
    },
    set(target, prop, value) {
      if (!instance) {
        instance = createInstance();
      }
      return Reflect.set(instance!, prop, value);
    }
  };

  const proxy = new Proxy({} as SingletonClass, handler) as SingletonClass;

  const reset = () => {
    instance = undefined;
  };

  /**
   * Return the proxy and a reset function
   */
  return { proxy, reset };
};
