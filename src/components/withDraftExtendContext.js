'use es6';
import { Component } from 'react';
import PropTypes from 'prop-types';

export const withDraftExtendContext = (Comp) => {
  class ContextAwareComp extends Component {
    static contextTypes = {
      getEditorState: PropTypes.func,
      getReadOnly: PropTypes.func,
      setReadOnly: PropTypes.func,
      onChange: PropTypes.func,
      focus: PropTypes.func,
      blur: PropTypes.func,
      editorRef: PropTypes.object,
    };
    render() {
      const draftContext = this.context;
      return <Comp draftContext={draftContext} {...props} />;
    }
  }
  ContextAwareComp.WrappingComponent = Comp;
  return ContextAwareComp;
};
