'use es6';
import { Component } from 'react';
import PropTypes from 'prop-types';
import { DraftEditorContext } from 'draft-extend';

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
      return <Comp draftContext={state} {...props} />;
    }
  }
  ContextAwareComp.WrappingComponent = Comp;
  return ContextAwareComp;
};

export const DraftContextPropType = PropTypes.shape({
  getEditorState: PropTypes.func,
  getReadOnly: PropTypes.func,
  setReadOnly: PropTypes.func,
  onChange: PropTypes.func,
  focus: PropTypes.func,
  blur: PropTypes.func,
  editorRef: PropTypes.func,
}).isRequired;
