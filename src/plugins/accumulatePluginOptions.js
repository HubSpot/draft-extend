import accumulateFunction from '../util/accumulateFunction';
import memoize from '../util/memoize';

const emptyFunction = () => {};
const emptyArray = [];
const emptyObject = {};

const memoizedAccumulateFunction = memoize(accumulateFunction);
const memoizedAssign = memoize((...args) => Object.assign({}, ...args));
const memoizedConcat = memoize((a1, a2) => a1.concat(a2));
const memoizedCoerceArray = memoize(arg => (Array.isArray(arg) ? arg : [arg]));

export default (accumulation, pluginConfig) => {
  const accumulationWithDefaults = {
    styleMap: emptyObject,
    styleFn: emptyFunction,
    decorators: emptyArray,
    buttons: emptyArray,
    overlays: emptyArray,
    blockRendererFn: emptyFunction,
    blockStyleFn: emptyFunction,
    keyBindingFn: emptyFunction,
    keyCommandListeners: emptyArray,
    ...accumulation,
  };

  const {
    styleMap,
    styleFn,
    decorators,
    buttons,
    overlays,
    blockRendererFn,
    blockStyleFn,
    keyBindingFn,
    keyCommandListener,
  } = pluginConfig;

  const keyCommandListeners = memoizedConcat(
    accumulationWithDefaults.keyCommandListeners,
    memoizedCoerceArray(keyCommandListener)
  );

  return {
    ...accumulationWithDefaults,
    styleMap: memoizedAssign(accumulationWithDefaults.styleMap, styleMap),
    styleFn: memoizedAccumulateFunction(
      accumulationWithDefaults.styleFn,
      styleFn
    ),
    decorators: memoizedConcat(accumulationWithDefaults.decorators, decorators),
    buttons: memoizedConcat(accumulationWithDefaults.buttons, buttons),
    overlays: memoizedConcat(accumulationWithDefaults.overlays, overlays),
    blockRendererFn: memoizedAccumulateFunction(
      blockRendererFn,
      accumulationWithDefaults.blockRendererFn
    ),
    blockStyleFn: memoizedAccumulateFunction(
      blockStyleFn,
      accumulationWithDefaults.blockStyleFn
    ),
    keyBindingFn: memoizedAccumulateFunction(
      keyBindingFn,
      accumulationWithDefaults.keyBindingFn
    ),
    
    // `createPlugin` expects a singular `keyCommandListener`, but Editor
    // component props expect the plural `keyCommandListeners`, so return both
    // since this is used in both contexts
    keyCommandListeners,
    keyCommandListener: keyCommandListeners,
  };
};
