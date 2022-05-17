import React from 'react';
import PropTypes from 'prop-types';
import {
  Editor,
  EditorState,
  CompositeDecorator,
  getDefaultKeyBinding,
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
  styleFn: PropTypes.func,
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
  showButtons: PropTypes.bool,
  renderTray: PropTypes.func,
};

const defaultContextFn = () =>
  console.error(
    'DraftEditorContext is not provided in this scope.  Please check your setup.'
  );
export const DraftEditorContext = React.createContext({
  getEditorState: defaultContextFn,
  getReadOnly: defaultContextFn,
  setReadOnly: defaultContextFn,
  onChange: defaultContextFn,
  focus: defaultContextFn,
  blur: defaultContextFn,
  editorRef: defaultContextFn,
});

class EditorWrapper extends React.Component {
  constructor(props) {
    super(props);

    const { baseDecorator } = props;

    const decorator = new baseDecorator(props.decorators);
    this.state = {
      decorator,
      readOnly: false,
    };

    this.keyBindingFn = this.keyBindingFn.bind(this);
    this.handleReturn = this.handleReturn.bind(this);
    this.onEscape = this.onEscape.bind(this);
    this.onTab = this.onTab.bind(this);
    this.onUpArrow = this.onUpArrow.bind(this);
    this.onDownArrow = this.onDownArrow.bind(this);
    this.focus = this.focus.bind(this);
    this.blur = this.blur.bind(this);
    this.getOtherProps = this.getOtherProps.bind(this);
    this.getReadOnly = this.getReadOnly.bind(this);
    this.setReadOnly = this.setReadOnly.bind(this);
    this.getDecoratedState = this.getDecoratedState.bind(this);

    this.contextValue = {
      getEditorState: this.getDecoratedState,
      getReadOnly: this.getReadOnly,
      setReadOnly: this.setReadOnly,
      onChange: this.props.onChange,
      focus: this.focus,
      blur: this.blur,
      editorRef: this.refs.editor,
    };
  }

  getDerivedStateFromProps(props, state) {
    if (props.decorators.length === state.decorator._decorators.length) {
      const allDecoratorsMatch = state.decorator._decorators.every(
        (decorator, i) => {
          return decorator === props.decorators[i];
        }
      );
      if (allDecoratorsMatch) {
        return;
      }
    }

    return {
      decorator: new props.baseDecorator(props.decorators),
    };
  }

  keyBindingFn(e) {
    const pluginsCommand = this.props.keyBindingFn(e);
    if (pluginsCommand) {
      return pluginsCommand;
    }

    return getDefaultKeyBinding(e);
  }

  handleReturn(e, editorState) {
    return (
      (this.props.handleReturn && this.props.handleReturn(e, editorState)) ||
      this.props.handleKeyCommand('return', e)
    );
  }

  onEscape(e) {
    return (
      (this.props.onEscape && this.props.onEscape(e)) ||
      this.props.handleKeyCommand('escape', e)
    );
  }

  onTab(e) {
    return (
      (this.props.onTab && this.props.onTab(e)) ||
      this.props.handleKeyCommand('tab', e)
    );
  }

  onUpArrow(e) {
    return (
      (this.props.onUpArrow && this.props.onUpArrow(e)) ||
      this.props.handleKeyCommand('up-arrow', e)
    );
  }

  onDownArrow(e) {
    return (
      (this.props.onDownArrow && this.props.onDownArrow(e)) ||
      this.props.handleKeyCommand('down-arrow', e)
    );
  }

  focus() {
    this.refs.editor.focus();
  }

  blur() {
    this.refs.editor.blur();
  }

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
  }

  getReadOnly() {
    return this.state.readOnly || this.props.readOnly;
  }

  setReadOnly(readOnly) {
    this.setState({ readOnly });
  }

  getDecoratedState() {
    const { editorState } = this.props;
    const { decorator } = this.state;

    const currentDecorator = editorState.getDecorator();

    if (
      currentDecorator &&
      currentDecorator._decorators === decorator._decorators
    ) {
      return editorState;
    }

    return EditorState.set(editorState, { decorator });
  }

  renderTray() {
    const { renderTray } = this.props;

    if (typeof renderTray !== 'function') {
      return null;
    }

    return renderTray();
  }

  renderPluginButtons() {
    const {
      onChange,
      addKeyCommandListener,
      removeKeyCommandListener,
      showButtons,
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
  }

  renderOverlays() {
    const { onChange, addKeyCommandListener, removeKeyCommandListener } =
      this.props;

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
  }

  render() {
    const {
      styleMap,
      styleFn,
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
      <DraftEditorContext.Provider value={this.contextValue}>
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
              customStyleFn={styleFn}
              handleKeyCommand={handleKeyCommand}
              keyBindingFn={this.keyBindingFn}
              handleReturn={this.handleReturn}
              onEscape={this.onEscape}
              onTab={this.onTab}
              onUpArrow={this.onUpArrow}
              onDownArrow={this.onDownArrow}
            />
            <div className="draft-extend-tray">{this.renderTray()}</div>
            <div className="draft-extend-controls">
              {this.renderPluginButtons()}
            </div>
            <div className="draft-extend-overlays">{this.renderOverlays()}</div>
          </div>
        </div>
      </DraftEditorContext.Provider>
    );
  }
}

EditorWrapper.propTypes = propTypes;

EditorWrapper.defaultProps = {
  className: '',
  editorState: EditorState.createEmpty(),
  onChange: () => {},
  decorators: [],
  baseDecorator: CompositeDecorator,
  styleMap: {},
  styleFn: () => {},
  buttons: [],
  overlays: [],
  blockRendererFn: () => {},
  blockStyleFn: () => {},
  keyBindingFn: () => {},
  readOnly: false,
  showButtons: true,
};

export default KeyCommandController(EditorWrapper);
