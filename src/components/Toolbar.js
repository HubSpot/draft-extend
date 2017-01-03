'use es6';

import React, {PropTypes} from 'react';
import KeyCommandController from './KeyCommandController';

const Toolbar = React.createClass({
  propTypes: {
    editorState: PropTypes.object,
    onChange: PropTypes.func,
    buttons: PropTypes.array,
    addKeyCommandListener: PropTypes.func.isRequired,
    removeKeyCommandListener: PropTypes.func.isRequired
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
