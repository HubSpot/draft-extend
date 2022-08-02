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

  ContextAwareComp.WrappingComponent = Comp;
  return ContextAwareComp;
};
