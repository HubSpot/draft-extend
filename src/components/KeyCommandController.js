import {List} from 'immutable';
import React, {PropTypes} from 'react';
import {EditorState} from 'draft-js';

export default (Component) => React.createClass({
  propTypes: {
    editorState: PropTypes.object,
    onChange: PropTypes.func,
    keyCommandListeners: PropTypes.arrayOf(PropTypes.func),
    addKeyCommandListener: PropTypes.func,
    removeKeyCommandListener: PropTypes.func,
    handleKeyCommand: PropTypes.func
  },

  componentWillMount() {
    this.keyCommandListeners = List(this.props.keyCommandListeners);
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

    const result = this.keyCommandListeners.reduce(({state, hasChanged}, listener) => {
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
