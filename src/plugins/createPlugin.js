import React, {PropTypes} from 'react';
import memoize from '../util/memoize';
import compose from '../util/compose';
import accumulateFunction from '../util/accumulateFunction';
import middlewareAdapter from '../util/middlewareAdapter';

const emptyFunction = () => {};
const emptyArray = [];
const emptyObject = {};

const defaultHTMLToStyle = (nodeName, node, currentStyle) => currentStyle;
const defaultHTMLToBlock = (nodeName, node, lastList) => undefined;
const defaultHTMLToEntity = (nodeName, node) => undefined;
const defaultTextToEntity = (text) => [];
const defaultStyleToHTML = (next) => (style) => next(style);
const defaultBlockToHTML = (next) => (block) => next(block);
const defaultEntityToHTML = (next) => (entity, originalText) => next(entity, originalText);

const memoizedCompose = memoize(compose);
const memoizedAccumulateFunction = memoize(accumulateFunction);
const memoizedAssign = memoize((...args) => Object.assign({}, ...args));
const memoizedConcat = memoize((a1, a2) => a1.concat(a2));
const memoizedCoerceArray = memoize((arg) => Array.isArray(arg) ? arg : [arg]);

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
  htmlToStyle = defaultHTMLToStyle,
  htmlToBlock = defaultHTMLToBlock,
  htmlToEntity = defaultHTMLToEntity,
  textToEntity = defaultTextToEntity,
  styleToHTML = defaultStyleToHTML,
  blockToHTML = defaultBlockToHTML,
  entityToHTML = defaultEntityToHTML,
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

        const newHTMLToStyle = (nodeName, node, currentStyle) => {
          const acc = oldOptions.htmlToStyle(nodeName, node, currentStyle);
          return htmlToStyle(nodeName, node, acc);
        };

        const newHTMLToBlock = memoizedAccumulateFunction(htmlToBlock, oldOptions.htmlToBlock);

        const newHTMLToEntity = memoizedAccumulateFunction(htmlToEntity, oldOptions.htmlToEntity);

        const newTextToEntity = (text) => {
          return oldOptions.textToEntity(text).concat(textToEntity(text));
        };

        const newStyleToHTML = memoizedCompose(middlewareAdapter(styleToHTML), middlewareAdapter(oldOptions.styleToHTML));
        newStyleToHTML.__isMiddleware = true;

        const newBlockToHTML = memoizedCompose(middlewareAdapter(blockToHTML), middlewareAdapter(oldOptions.blockToHTML));
        newBlockToHTML.__isMiddleware = true;

        const newEntityToHTML = memoizedCompose(middlewareAdapter(entityToHTML), middlewareAdapter(oldOptions.entityToHTML));
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
