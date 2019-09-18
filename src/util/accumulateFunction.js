// utility function to accumulate the common plugin option function pattern of
// handling args by returning a non-null result or delegate to other plugins
const emptyFunction = () => {};
export default (newFn, acc = emptyFunction) => {
  if (!newFn) {
    return acc;
  }

  return (...args) => {
    const result = newFn(...args);
    if (result === null || result === undefined) {
      return acc(...args);
    }
    return result;
  };
};
