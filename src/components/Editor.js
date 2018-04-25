import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import {List} from 'immutable';
import {
  Editor,
  EditorState,
  CompositeDecorator,
  getDefaultKeyBinding
} from 'draft-js';
import KeyCommandController from './KeyCommandController';
import OverlayWrapper from './OverlayWrapper';

const propTypes = {
  className: PropTypes.string,
  editorState: PropTypes.object,
  onChange: PropTypes.func,
  decorators: PropTypes.array,
  baseDecorator: PropTypes.func,
  styleMap: PropTypes.object,
  buttons: PropTypes.array,
  overlays: PropTypes.array,
  blockRendererFn: PropTypes.func,
  blockStyleFn: PropTypes.func,
  keyBindingFn: PropTypes.func,
  addKeyCommandListener: PropTypes.func.isRequired,
  removeKeyCommandListener: PropTypes.func.isRequired,
  handleReturn: PropTypes.func,
  onEscape: PropTypes.func,
  onTab: PropTypes.func,
  onUpArrow: PropTypes.func,
  onDownArrow: PropTypes.func,
  readOnly: PropTypes.bool,
  showButtons: PropTypes.bool
};

const EditorWrapper = createReactClass({
  propTypes,

  childContextTypes: {
    getEditorState: PropTypes.func,
    getReadOnly: PropTypes.func,
    setReadOnly: PropTypes.func,
    onChange: PropTypes.func,
    focus: PropTypes.func,
    blur: PropTypes.func
  },

  getDefaultProps() {
    return {
      className: '',
      editorState: EditorState.createEmpty(),
      onChange: () => {},
      decorators: [],
      baseDecorator: CompositeDecorator,
      styleMap: {},
      buttons: [],
      overlays: [],
      blockRendererFn: () => {},
      blockStyleFn: () => {},
      keyBindingFn: () => {},
      readOnly: false,
      showButtons: true
    };
  },

  getInitialState() {
    const { baseDecorator } = this.props;

    const decorator = new baseDecorator(this.props.decorators);
    return {
      decorator,
      readOnly: false
    };
  },

  getChildContext() {
    return {
      getEditorState: this.getDecoratedState,
      getReadOnly: this.getReadOnly,
      setReadOnly: this.setReadOnly,
      onChange: this.props.onChange,
      focus: this.focus,
      blur: this.blur
    };
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.decorators.length === this.state.decorator._decorators.length) {
      const allDecoratorsMatch = this.state.decorator._decorators.every((decorator, i) => {
        return decorator === nextProps.decorators[i];
      });
      if (allDecoratorsMatch) {
        return;
      }
    }

    this.setState({decorator: new nextProps.baseDecorator(nextProps.decorators)});
  },

  keyBindingFn(e) {
    const pluginsCommand = this.props.keyBindingFn(e);
    if (pluginsCommand) {
      return pluginsCommand;
    }

    return getDefaultKeyBinding(e);
  },

  handleReturn(e) {
    return (this.props.handleReturn && this.props.handleReturn(e)) || this.props.handleKeyCommand('return', e);
  },

  onEscape(e) {
    return (this.props.onEscape && this.props.onEscape(e)) || this.props.handleKeyCommand('escape', e);
  },

  onTab(e) {
    return (this.props.onTab && this.props.onTab(e)) || this.props.handleKeyCommand('tab', e);
  },

  onUpArrow(e) {
    return (this.props.onUpArrow && this.props.onUpArrow(e)) || this.props.handleKeyCommand('up-arrow', e);
  },

  onDownArrow(e) {
    return (this.props.onDownArrow && this.props.onDownArrow(e)) || this.props.handleKeyCommand('down-arrow', e);
  },

  focus() {
    this.refs.editor.focus();
  },

  blur() {
    this.refs.editor.blur();
  },

  getOtherProps() {
    const propKeys = Object.keys(this.props);
    const propTypeKeys = Object.keys(propTypes);

    const propsToPass = propKeys.filter((prop) => {
      return propTypeKeys.indexOf(prop) === -1;
    });

    return propsToPass.reduce((acc, prop) => {
      acc[prop] = this.props[prop];
      return acc;
    }, {});
  },

  getReadOnly() {
    return this.state.readOnly || this.props.readOnly;
  },

  setReadOnly(readOnly) {
    this.setState({readOnly});
  },

  getDecoratedState() {
    const {editorState} = this.props;
    const {decorator} = this.state;

    const currentDecorator = editorState.getDecorator();

    if (currentDecorator && currentDecorator._decorators === decorator._decorators) {
      return editorState;
    }

    return EditorState.set(editorState, {decorator});
  },

  renderPluginButtons() {
    const {
      onChange,
      addKeyCommandListener,
      removeKeyCommandListener,
      showButtons
    } = this.props;

    if (showButtons === false) {
      return null;
    }

    const decoratedState = this.getDecoratedState();

    return this.props.buttons.map((Button, index) => {
      return (
        <Button
          {...this.getOtherProps()}
          key={`button-${index}`}
          attachedToEditor={true}
          editorState={decoratedState}
          onChange={onChange}
          addKeyCommandListener={addKeyCommandListener}
          removeKeyCommandListener={removeKeyCommandListener}
        />
      );
    });
  },

  renderOverlays() {
    const {
      onChange,
      addKeyCommandListener,
      removeKeyCommandListener
    } = this.props;

    const decoratedState = this.getDecoratedState();

    return this.props.overlays.map((Overlay, index) => {
      return (
        <OverlayWrapper key={index}>
          <Overlay
            {...this.getOtherProps()}
            editorState={decoratedState}
            onChange={onChange}
            addKeyCommandListener={addKeyCommandListener}
            removeKeyCommandListener={removeKeyCommandListener}
          />
        </OverlayWrapper>
      );
    });
  },

  render() {
    const {
      styleMap,
      blockRendererFn,
      blockStyleFn,
      onChange,
      handleKeyCommand,
      ...otherProps
    } = this.props;

    const decoratedState = this.getDecoratedState();
    const className = `draft-extend ${this.props.className}`;

    const readOnly = this.getReadOnly();

    return (
      <div className={className}>
        <div className="draft-extend-editor">
          <Editor
            {...otherProps}
            ref="editor"
            editorState={decoratedState}
            readOnly={readOnly}
            onChange={onChange}
            blockStyleFn={blockStyleFn}
            blockRendererFn={blockRendererFn}
            customStyleMap={styleMap}
            handleKeyCommand={handleKeyCommand}
            keyBindingFn={this.keyBindingFn}
            handleReturn={this.handleReturn}
            onEscape={this.onEscape}
            onTab={this.onTab}
            onUpArrow={this.onUpArrow}
            onDownArrow={this.onDownArrow}
          />
          <div className="draft-extend-controls">
            {this.renderPluginButtons()}
          </div>
          <div className="draft-extend-overlays">
            {this.renderOverlays()}
          </div>
        </div>
      </div>
    );
  }
});

export default KeyCommandController(EditorWrapper);
