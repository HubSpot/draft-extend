import {isValidElement} from 'react';

// function to handle previous techniques to convert to HTML, including
// plain objects with `{start, end}` values and non-HOF functions that return
// either a String or ReactElement

const middlewareAdapter = (middleware) => (next) => (...args) => {
  if (typeof middleware === 'object') {
    // handle old blockToHTML objects
    const block = args[0];

    let objectResult;

    if (typeof block === 'string') {
      // handle case of inline style value
      const style = block;
      if (process.env.NODE_ENV === 'development') {
        console.warn('styleToHTML: Use of plain objects to define HTML output is being deprecated. Please switch to using functions that return a {start, end} object or ReactElement.');
      }

      objectResult = middleware[style];
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('blockToHTML: Use of plain objects to define HTML output is being deprecated. Please switch to using functions that return a {start, end} object or ReactElement.');
      }

      objectResult = middleware[block.type];
    }

    // check for inline style value instead of a raw block
    if (objectResult !== null && objectResult !== undefined) {
      return objectResult;
    }
    return next(...args);
  }

  let returnValue;
  try {
    // try immediately giving the function the content data in case it's a simple
    // function that doesn't expect a `next` function
    const nonMiddlewareResult = middleware(...args);
    if (nonMiddlewareResult === null || nonMiddlewareResult === undefined) {
      // the behavior for non-middleware functions is to delegate by returning
      // `null` or `undefined`, so do delegation for them
      returnValue = next(...args);
    } else if (typeof nonMiddlewareResult === 'string' || isValidElement(nonMiddlewareResult)) {
      // the function was a simple non-middleware function and
      // returned a reasonable value, so return its result
      returnValue = nonMiddlewareResult;
    } else if (typeof nonMiddlewareResult === 'function') {
      // most middleware HOFs will return another function when invoked, so we
      // can assume that it is one here
      returnValue = middleware(next)(...args);
    }
  } catch (e) {
    // it's possible that trying to use a middleware function like a simple non-
    // middleware function will throw, so try it as a middleware HOF
    returnValue = middleware(next)(...args);
  } finally {
    if (returnValue === undefined || returnValue === null) {
      return next(...args);
    }
    return returnValue;
  }
};

export default middlewareAdapter;
