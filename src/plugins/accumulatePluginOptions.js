import accumulateFunction from '../util/accumulateFunction';

const emptyFunction = () => {};
const emptyArray = [];
const emptyObject = {};

const concat = (a1 = [], a2) => a1.concat(a2);
const assign = (...args) => Object.assign({}, ...args);

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
    keyCommandListener: emptyFunction,
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

  return {
    ...accumulationWithDefaults,
    styleMap: assign(accumulationWithDefaults.styleMap, styleMap),
    styleFn: accumulateFunction(accumulationWithDefaults.styleFn, styleFn),
    decorators: concat(decorators, accumulationWithDefaults.decorators),
    buttons: concat(buttons, accumulationWithDefaults.buttons),
    overlays: concat(overlays, accumulationWithDefaults.overlays),
    blockRendererFn: accumulateFunction(
      accumulationWithDefaults.blockRendererFn,
      blockRendererFn
    ),
    blockStyleFn: accumulateFunction(
      accumulationWithDefaults.blockStyleFn,
      blockStyleFn
    ),
    keyBindingFn: accumulateFunction(
      accumulationWithDefaults.keyBindingFn,
      keyBindingFn
    ),
    keyCommandListener: accumulateFunction(
      accumulationWithDefaults.keyCommandListener,
      keyCommandListener
    ),
  };
};
