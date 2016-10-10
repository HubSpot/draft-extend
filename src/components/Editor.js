import React, {PropTypes} from 'react';
import {List} from 'immutable';
import {
  Editor,
  genKey,
  EditorState,
  CompositeDecorator,
  getDefaultKeyBinding
} from 'draft-js';
import OverlayWrapper from './OverlayWrapper';

const propTypes = {
  className: PropTypes.string,
  editorState: PropTypes.object,
  onChange: PropTypes.func,
  decorators: PropTypes.array,
  styleMap: PropTypes.object,
  buttons: PropTypes.array,
  overlays: PropTypes.array,
  blockRendererFn: PropTypes.func,
  blockStyleFn: PropTypes.func,
  keyBindingFn: PropTypes.func,
  keyCommandListeners: PropTypes.arrayOf(PropTypes.func),
  handleReturn: PropTypes.func,
  onEscape: PropTypes.func,
  onTab: PropTypes.func,
  onUpArrow: PropTypes.func,
  onDownArrow: PropTypes.func,
  readOnly: PropTypes.bool
};

export default React.createClass({
  propTypes,

  childContextTypes: {
    getEditorState: PropTypes.func,
    getReadOnly: PropTypes.func,
    onChange: PropTypes.func
  },

  getDefaultProps() {
    return {
      className: '',
      editorState: EditorState.createEmpty(),
      onChange: () => {},
      decorators: [],
      styleMap: {},
      buttons: [],
      overlays: [],
      blockRendererFn: () => {},
      blockStyleFn: () => {},
      keyBindingFn: () => {},
      keyCommandListeners: [],
      readOnly: false
    };
  },

  getInitialState() {
    const decorator = new CompositeDecorator(this.props.decorators);
    return {
      decorator
    };
  },

  getChildContext() {
    return {
      getEditorState: this.getDecoratedState,
      getReadOnly: this.getReadOnly,
      onChange: this.props.onChange
    };
  },

  componentWillMount() {
    this.keyCommandListeners = List(this.props.keyCommandListeners);
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

    this.setState({decorator: new CompositeDecorator(nextProps.decorators)});
  },

  addKeyCommandListener(listener) {
    this.keyCommandListeners = this.keyCommandListeners.unshift(listener);
  },

  removeKeyCommandListener(listener) {
    this.keyCommandListeners = this.keyCommandListeners.filterNot((l) => {
      return l === listener;
    });
  },

  keyBindingFn(e) {
    const pluginsCommand = this.props.keyBindingFn(e);
    if (pluginsCommand) {
      return pluginsCommand;
    }

    return getDefaultKeyBinding(e);
  },

  handleKeyCommand(command, keyboardEvent = null) {
    const decoratedState = this.getDecoratedState();

    const result = this.keyCommandListeners.reduce(({state, hasChanged}, listener) => {
      if (hasChanged === true) {
        return {
          state,
          hasChanged
        };
      }

      const listenerResult = listener(state, command, keyboardEvent);
      const isEditorState = listenerResult instanceof EditorState;

      if (listenerResult === true || (isEditorState && listenerResult !== state)) {
        if (isEditorState) {
          this.props.onChange(listenerResult);
          return {
            state: listenerResult,
            hasChanged: true
          };
        }
        return {
          state,
          hasChanged: true
        };
      }

      return {
        state,
        hasChanged
      };
    }, {state: decoratedState, hasChanged: false});

    return result.hasChanged;
  },

  handleReturn(e) {
    return (this.props.handleReturn && this.props.handleReturn(e)) || this.handleKeyCommand('return', e);
  },

  onEscape(e) {
    return (this.props.onEscape && this.props.onEscape(e)) || this.handleKeyCommand('escape', e);
  },

  onTab(e) {
    return (this.props.onTab && this.props.onTab(e)) || this.handleKeyCommand('tab', e);
  },

  onUpArrow(e) {
    return (this.props.onUpArrow && this.props.onUpArrow(e)) || this.handleKeyCommand('up-arrow', e);
  },

  onDownArrow(e) {
    return (this.props.onDownArrow && this.props.onDownArrow(e)) || this.handleKeyCommand('down-arrow', e);
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
    return this.props.readOnly;
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
    const decoratedState = this.getDecoratedState();

    return this.props.buttons.map((Button, index) => {
      return (
        <li key={`button-${index}`}>
          <Button
            {...this.getOtherProps()}
            editorState={decoratedState}
            onChange={this.props.onChange}
            addKeyCommandListener={this.addKeyCommandListener}
            removeKeyCommandListener={this.removeKeyCommandListener}
          />
        </li>
      );
    });
  },

  renderOverlays() {
    const decoratedState = this.getDecoratedState();

    return this.props.overlays.map((Overlay) => {
      return (
        <OverlayWrapper key={genKey()}>
          <Overlay
            {...this.getOtherProps()}
            editorState={decoratedState}
            onChange={this.props.onChange}
            addKeyCommandListener={this.addKeyCommandListener}
            removeKeyCommandListener={this.removeKeyCommandListener}
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
      ...otherProps
    } = this.props;

    const decoratedState = this.getDecoratedState();

    const className = `draft-extend ${this.props.className}`;

    return (
      <div className={className}>
        <ul className="draft-extend-controls">
          {this.renderPluginButtons()}
        </ul>
        <div className="draft-extend-editor">
          <Editor
            {...otherProps}
            ref="editor"
            editorState={decoratedState}
            onChange={onChange}
            blockStyleFn={blockStyleFn}
            blockRendererFn={blockRendererFn}
            customStyleMap={styleMap}
            keyBindingFn={this.keyBindingFn}
            handleKeyCommand={this.handleKeyCommand}
            handleReturn={this.handleReturn}
            onEscape={this.onEscape}
            onTab={this.onTab}
            onUpArrow={this.onUpArrow}
            onDownArrow={this.onDownArrow}
          />
          <div className="draft-extend-overlays">
            {this.renderOverlays()}
          </div>
        </div>
      </div>
    );
  }
});
