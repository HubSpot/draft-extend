import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DraftEditorContext } from './Editor';

export const withDraftExtendContext = (Comp) => {
  class ContextAwareComp extends Component {
    render() {
      <DraftEditorContext.Consumer>
        {(value) => <Comp draftContext={value} {...this.props} />}
      </DraftEditorContext.Consumer>;
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
