import React, {PropTypes} from 'react';
import {OrderedSet} from 'immutable';
import memoize from '../util/memoize';
import compose from '../util/compose';
import accumulateFunction from '../util/accumulateFunction';
import middlewareAdapter from '../util/middlewareAdapter';

const emptyFunction = () => {};
const emptyArray = [];
const emptyObject = {};

const defaultMiddlewareFunction = (next) => (...args) => next(...args);

const memoizedCompose = memoize(compose);
const memoizedAccumulateFunction = memoize(accumulateFunction);
const memoizedAssign = memoize((...args) => Object.assign({}, ...args));
const memoizedConcat = memoize((a1, a2) => a1.concat(a2));
const memoizedCoerceArray = memoize((arg) => Array.isArray(arg) ? arg : [arg]);
const memoizedPassEmptyStyles = memoize((func) => (nodeName, node) => func(nodeName, node, OrderedSet()));
const memoizedMiddlewareAdapter = memoize(middlewareAdapter);

const createPlugin = ({
  displayName = 'Plugin',

  // editor options
  decorators = emptyArray,
  buttons = emptyArray,
  overlays = emptyArray,
  styleMap = emptyObject,
  blockRendererFn = emptyFunction,
  blockStyleFn = emptyFunction,
  keyBindingFn = emptyFunction,
  keyCommandListener = emptyFunction,

  // HTML conversion options
  htmlToStyle = defaultMiddlewareFunction,
  htmlToBlock = defaultMiddlewareFunction,
  htmlToEntity = defaultMiddlewareFunction,
  textToEntity = defaultMiddlewareFunction,
  styleToHTML = defaultMiddlewareFunction,
  blockToHTML = defaultMiddlewareFunction,
  entityToHTML = defaultMiddlewareFunction,
}) => (ToWrap) => {
  decorators = memoizedCoerceArray(decorators);
  buttons = memoizedCoerceArray(buttons);
  overlays = memoizedCoerceArray(overlays);

  if (ToWrap.prototype && ToWrap.prototype.isReactComponent) {
    // wrapping an Editor component
    return React.createClass({
      displayName,

      propTypes: {
        styleMap: PropTypes.object,
        decorators: PropTypes.array,
        buttons: PropTypes.array,
        overlays: PropTypes.array,
        blockRendererFn: PropTypes.func,
        blockStyleFn: PropTypes.func,
        keyBindingFn: PropTypes.func,
        keyCommandListeners: PropTypes.arrayOf(PropTypes.func)
      },

      getDefaultProps() {
        return {
          styleMap: emptyObject,
          decorators: emptyArray,
          buttons: emptyArray,
          overlays: emptyArray,
          blockRendererFn: emptyFunction,
          blockStyleFn: emptyFunction,
          keyBindingFn: emptyFunction,
          keyCommandListeners: emptyArray
        };
      },

      focus() {
        if (this.refs.child.focus) {
          this.refs.child.focus();
        }
      },

      blur() {
        if (this.refs.child.blur) {
          this.refs.child.blur();
        }
      },

      render() {
        const newStyleMap = memoizedAssign(this.props.styleMap, styleMap);
        const newDecorators = memoizedConcat(this.props.decorators, decorators);
        const newButtons = memoizedConcat(this.props.buttons, buttons);
        const newOverlays = memoizedConcat(this.props.overlays, overlays);
        const newBlockRendererFn = memoizedAccumulateFunction(blockRendererFn, this.props.blockRendererFn);
        const newBlockStyleFn = memoizedAccumulateFunction(blockStyleFn, this.props.blockStyleFn);
        const newKeyBindingFn = memoizedAccumulateFunction(keyBindingFn, this.props.keyBindingFn);
        const newKeyCommandListeners = memoizedConcat(this.props.keyCommandListeners, memoizedCoerceArray(keyCommandListener));

        return (
          <ToWrap
            {...this.props}
            ref="child"
            styleMap={newStyleMap}
            decorators={newDecorators}
            buttons={newButtons}
            overlays={newOverlays}
            blockRendererFn={newBlockRendererFn}
            blockStyleFn={newBlockStyleFn}
            keyBindingFn={newKeyBindingFn}
            keyCommandListeners={newKeyCommandListeners}
          />
        );
      }
    });
  } else {
    // wrapping a converter function
    return (...args) => {
      if (args.length === 1 && (typeof args[0] === 'string' || (args[0].hasOwnProperty('_map') && args[0].getBlockMap != null))) {
        // actively converting an HTML string/ContentState, so pass additional options to the next converter function.
        return ToWrap({
          htmlToStyle,
          htmlToBlock,
          htmlToEntity,
          textToEntity,
          styleToHTML,
          blockToHTML,
          entityToHTML
        })(...args);
      } else {
        // receiving a plugin to accumulate upon for a converter - accumulate
        // options and return a new plugin wrapped around the passed one ready
        // to take either another plugin or a string/ContentState

        const oldOptions = args[0];

        const newHTMLToStyle = memoizedCompose(memoizedMiddlewareAdapter(memoizedPassEmptyStyles(htmlToStyle)), memoizedMiddlewareAdapter(oldOptions.htmlToStyle));
        newHTMLToStyle.__isMiddleware = true;

        const newHTMLToBlock = memoizedCompose(memoizedMiddlewareAdapter(htmlToBlock), memoizedMiddlewareAdapter(oldOptions.htmlToBlock));
        newHTMLToBlock.__isMiddleware = true;

        const newHTMLToEntity = memoizedCompose(memoizedMiddlewareAdapter(htmlToEntity), memoizedMiddlewareAdapter(oldOptions.htmlToEntity));
        newHTMLToEntity.__isMiddleware = true;

        const newTextToEntity = memoizedCompose(memoizedMiddlewareAdapter(textToEntity), memoizedMiddlewareAdapter(oldOptions.textToEntity));
        newTextToEntity.__isMiddleware = true;

        const newStyleToHTML = memoizedCompose(memoizedMiddlewareAdapter(styleToHTML), memoizedMiddlewareAdapter(oldOptions.styleToHTML));
        newStyleToHTML.__isMiddleware = true;

        const newBlockToHTML = memoizedCompose(memoizedMiddlewareAdapter(blockToHTML), memoizedMiddlewareAdapter(oldOptions.blockToHTML));
        newBlockToHTML.__isMiddleware = true;

        const newEntityToHTML = memoizedCompose(memoizedMiddlewareAdapter(entityToHTML), memoizedMiddlewareAdapter(oldOptions.entityToHTML));
        newEntityToHTML.__isMiddleware = true;

        return createPlugin({
          htmlToStyle: newHTMLToStyle,
          htmlToBlock: newHTMLToBlock,
          htmlToEntity: newHTMLToEntity,
          textToEntity: newTextToEntity,
          styleToHTML: newStyleToHTML,
          blockToHTML: newBlockToHTML,
          entityToHTML: newEntityToHTML
        })(ToWrap);
      }
    };
  }
};

export default createPlugin;
