import PropTypes from 'prop-types';
import React from 'react';
import KeyCommandController from './KeyCommandController';

const Toolbar = React.createClass({
  propTypes: {
    editorState: PropTypes.object,
    onChange: PropTypes.func,
    buttons: PropTypes.array,
    addKeyCommandListener: PropTypes.func.isRequired,
    removeKeyCommandListener: PropTypes.func.isRequired
  },

  childContextTypes: {
    getEditorState: PropTypes.func,
    onChange: PropTypes.func
  },

  getChildContext() {
    return {
      getEditorState: this.getEditorState,
      onChange: this.props.onChange
    };
  },

  getEditorState() {
    return this.props.editorState;
  },

  renderButtons() {
    const {
      editorState,
      onChange,
      buttons,
      addKeyCommandListener,
      removeKeyCommandListener,
      ...otherProps
    } = this.props;

    return buttons.map((Button, index) => {
      return (
        <Button
          {...otherProps}
          key={`button-${index}`}
          editorState={editorState}
          onChange={onChange}
          addKeyCommandListener={addKeyCommandListener}
          removeKeyCommandListener={removeKeyCommandListener}
        />
      );
    });
  },

  render() {
    return (
      <ul className="draft-extend-controls">
        {this.renderButtons()}
      </ul>
    );
  }
});

export default KeyCommandController(Toolbar);
