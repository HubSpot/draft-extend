import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DraftEditorContext } from './Editor';

export const withDraftExtendContext = (Comp) => {
  class ContextAwareComp extends Component {
    render() {
      return <Comp draftContext={this.context} {...this.props} />;
    }
  }
  ContextAwareComp.contextType = DraftEditorContext;

  ContextAwareComp.WrappingComponent = Comp;
  return ContextAwareComp;
};
