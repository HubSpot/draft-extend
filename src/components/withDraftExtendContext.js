import React, { Component } from 'react';
import PropTypes from 'prop-types';

export const withDraftExtendContext = (Comp) => {
  class ContextAwareComp extends Component {
    render() {
      const draftContext = this.context;
      return <Comp draftContext={draftContext} {...this.props} />;
    }
  }
  ContextAwareComp.contextTypes = {
    getEditorState: PropTypes.func,
    getReadOnly: PropTypes.func,
    setReadOnly: PropTypes.func,
    onChange: PropTypes.func,
    focus: PropTypes.func,
    blur: PropTypes.func,
    editorRef: PropTypes.object,
  };

  ContextAwareComp.WrappingComponent = Comp;
  return ContextAwareComp;
};