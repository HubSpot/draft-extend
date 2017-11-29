import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import invariant from 'invariant';
import {List} from 'immutable';
import {EditorState} from 'draft-js';

const providedProps = {
  addKeyCommandListener: PropTypes.func,
  removeKeyCommandListener: PropTypes.func,
  handleKeyCommand: PropTypes.func
};

const KeyCommandController = (Component) => createReactClass({
  displayName: `KeyCommandController(${Component.displayName})`,

  propTypes: {
    editorState: PropTypes.object,
    onChange: PropTypes.func,
    keyCommandListeners: PropTypes.arrayOf(PropTypes.func),
    ...providedProps
  },

  getDefaultProps() {
    return {
      keyCommandListeners: []
    };
  },

  componentWillMount() {
    this.keyCommandOverrides = List(this.props.keyCommandListeners);
    this.keyCommandListeners = List();
  },

  componentDidMount() {
    // ensure valid props for deferral
    const propNames = Object.keys(providedProps);
    const presentProps = propNames.filter((propName) => this.props[propName] !== undefined);
    const nonePresent = presentProps.length === 0;
    const allPresent = presentProps.length === propNames.length;

    invariant(
      nonePresent || allPresent,
      `KeyCommandController: A KeyCommandController is receiving only some props (${presentProps.join(', ')}) necessary to defer to a parent key command controller.`
    );

    if (allPresent) {
      this.props.keyCommandListeners.forEach((listener) => {
        this.props.addKeyCommandListener(listener);
      });
    }
  },

  componentWillUnmount() {
    if (this.props.removeKeyCommandListener) {
      this.props.keyCommandListeners.forEach((listener) => {
        this.props.removeKeyCommandListener(listener);
      });
    }
  },

  addKeyCommandListener(listener) {
    const {addKeyCommandListener} = this.props;

    if (addKeyCommandListener) {
      addKeyCommandListener(listener);
      return;
    }

    this.keyCommandListeners = this.keyCommandListeners.unshift(listener);
  },

  removeKeyCommandListener(listener) {
    const {removeKeyCommandListener} = this.props;

    if (removeKeyCommandListener) {
      removeKeyCommandListener(listener);
      return;
    }

    this.keyCommandListeners = this.keyCommandListeners.filterNot((l) => l === listener);
  },

  handleKeyCommand(command, keyboardEvent = null) {
    const {editorState, onChange, handleKeyCommand} = this.props;

    if (handleKeyCommand) {
      return handleKeyCommand(command, keyboardEvent);
    }

    const result = this.keyCommandListeners.concat(this.keyCommandOverrides).reduce(({state, hasChanged}, listener) => {
      if (hasChanged === true) {
        return {
          state,
          hasChanged
        };
      }

      const listenerResult = listener(state, command, keyboardEvent);
      const isEditorState = listenerResult instanceof EditorState;

      if (listenerResult === true || (isEditorState && listenerResult !== state)) {
        if (isEditorState) {
          onChange(listenerResult);
          return {
            state: listenerResult,
            hasChanged: true
          };
        }
        return {
          state,
          hasChanged: true
        };
      }

      return {
        state,
        hasChanged
      };
    }, {state: editorState, hasChanged: false});

    return result.hasChanged;
  },

  focus() {
    this.refs.editor.focus();
  },

  blur() {
    this.refs.editor.blur();
  },

  render() {
    const {
      editorState,
      onChange,
      keyCommandListeners, // eslint-disable-line no-unused-vars
      ...others
    } = this.props;


    return (
      <Component
        {...others}
        ref="editor"
        editorState={editorState}
        onChange={onChange}
        addKeyCommandListener={this.addKeyCommandListener}
        removeKeyCommandListener={this.removeKeyCommandListener}
        handleKeyCommand={this.handleKeyCommand}
      />
    );
  }
});

export default KeyCommandController;
