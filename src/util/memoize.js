import {Map, List} from 'immutable';

// memoization higher-order function using Immutable.js.
// used to memoize accumulated options when rendering plugin wrapper components.

export default function memoize(func) {
  let _cache = Map();

  return (...args) => {
    const argList = List.of(...args);
    if (!_cache.has(argList)) {
      _cache = _cache.set(argList, func(...args));
    }
    return _cache.get(argList);
  };
};
