# draft-extend
*Build extensible [Draft.js](http://draftjs.org) editors with configurable plugins and integrated serialization*

***

###### Jump to:
- [Overview](#overview)
- [Examples](#examples)
- [Editor](#editor)
- [compose](#compose)
- [Building Plugins](building-plugins.md)

***

## Overview
Draft Extend is a platform to build a full-featured Draft.js editor using modular plugins that can integrate with [draft-convert](http://github.com/HubSpot/draft-convert) to serialize with HTML. The higher-order function API makes it extremely easy to use any number of plugins for rendering and conversion.

#### Usage:
```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import {EditorState} from 'draft-js';
import {Editor, compose} from 'draft-extend';
import {convertFromHTML, convertToHTML} from 'draft-convert';

const plugins = compose(
    FirstPlugin,
    SecondPlugin,
    ThirdPlugin
);

const EditorWithPlugins = plugins(Editor); // Rich text editor component with plugin functionality
const toHTML = plugins(convertFromHTML); // function to convert from HTML including plugin functionality
const fromHTML = plugins(convertToHTML); // function to convert to HTML including plugin functionality

const MyEditor = React.createClass({
    getInitialState() {
        return {
            editorState: EditorState.createWithContent(fromHTML('<div></div>'))
        };
    },

    onChange(editorState) {
        const html = toHTML(editorState.getCurrentContent());
        console.log(html); // don't actually convert to HTML on every change!
        this.setState({editorState});
    },

    render() {
        return (
            <EditorWithPlugins
                editorState={this.state.editorState}
                onChange={this.onChange}
            />
        );
    }
});

ReactDOM.render(
    <MyEditor />,
    document.querySelector('.app')
);
```

***

## Examples

Examples of how to build plugins of different types are included in the [example](example/) directory. To run the examples locally:

1. run `npm install` in the `draft-extend` directory
2. open any HTML file in the `examples` directory in your web browser - no local server is necessary

***

## Editor
**Editor component on which to extend functionality with plugins created by [`createPlugin`](#createplugin).**

#### Props
The most important two props are:
- `editorState` - Draft.js `EditorState` instance to be rendered.
- `onChange: function(editorState: EditorState): void` - Like with vanilla Draft.js, function called on any editor change passing the `EditorState`.

Other props are used by plugins composed around `Editor`. See [Building Plugins](building-plugins.md) for more information. **These should generally not be used outside of the context of a plugin**:
- `buttons`: `Array<Component>` Array of React components to add to the controls of the editor.
- `overlays`: `Array<Component>` Array of React components to add as overlays to the editor.
- `decorators`: `Array<DraftDecorator>` Array of Draft.js decorator objects used to render the EditorState. They are added to the EditorState as a CompositeDecorator within the component and are of shape `{strategy, component}`.
- `styleMap`: `Object` Object map from Draft.js inline style type to style object. Used for the Draft.js Editor's `customStyleMap` prop.

All other props are passed down to the [Draft.js `Editor` component](https://facebook.github.io/draft-js/docs/api-reference-editor.html) and to any buttons and overlays added by plugins.

***

## compose
Since the API of plugins is based around composition, a basic `compose` function is provided to make it easy to apply plugins to the component as well as conversion functions and provides a single source of truth for plugin configuration.
```javascript
// without compose
const EditorWithPlugins = FirstPlugin(SecondPlugin(ThirdPlugin(Editor)));
const fromHTML = FirstPlugin(SecondPlugin(ThirdPlugin(convertFromHTML)));
const toHTML = FirstPlugin(SecondPlugin(ThirdPlugin(convertToHTML)));

// with compose
const plugins = compose(
    FirstPlugin,
    SecondPlugin,
    ThirdPlugin
);

const EditorWithPlugins = plugins(Editor);
const toHTML = plugins(convertToHTML);
const fromHTML = plugins(convertFromHTML);
```

***

## KeyCommandController
**Higher-order component to consolidate key command listeners across the component tree**

An increasingly common pattern for rich text editors is a toolbar detached from the main `Editor` component. This toolbar will be outside of the `Editor` component subtree, but will often need to respond to key commands that would otherwise be encapsulated by the `Editor`. `KeyCommandController` is a higher-order component that allows the subscription to key commands to move up the React tree so that components outside that subtree may listen and emit changes to editor state. `KeyCommandController`. It may be used with any component, but a good example is the `Toolbar` component:

```javascript
import {Editor, Toolbar, KeyCommandController, compose} from 'draft-extend';

const plugins = compose(
  FirstPlugin,
  SecondPlugin
);

const WrappedEditor = plugins(Editor);
const WrappedToolbar = plugins(Toolbar);

const Parent = ({editorState, onChange, handleKeyCommand, addKeyCommandListener, removeKeyCommandListener}) => {
  return (
    <div>
      <WrappedEditor
        editorState={editorState}
        onChange={onChange}
        handleKeyCommand={handleKeyCommand}
        addKeyCommandListener={addKeyCommandListener}
        removeKeyCommandListener={removeKeyCommandListener}
      />
      <Toolbar
        editorState={editorState}
        onChange={onChange}
        addKeyCommandListener={addKeyCommandListener}
        removeKeyCommandListener={removeKeyCommandListener}
      />
    </div>
  );
};

export default KeyCommandController(Parent);
```

`KeyCommandController` provides the final `handleKeyCommand` to use in the `Editor` component as well as subscribe/unsubscribe functions. As long as these props are passed from some common parent wrapped with `KeyCommandController` that also receives `editorState` and `onChange` props, other components may subscribe and emit chagnes to the editor state.

Additionally, `KeyCommandController`s are composable and will defer to the highest parent instance. That is, if a `KeyCommandController` receives `handleKeyCommand`, `addKeyCommandListener`, and `removeKeyCommandListener` props (presumably from another controller) it will delegate to that controller's record of subscribed functions, keeping all listeners in one place.
