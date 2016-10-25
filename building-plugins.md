# Building Plugins
Draft Extend's plugin infrastructure gives you the tools to modularly add functionality to your editor using familiar Draft.js concepts while also including support for conversion to and from HTML.

## Example
Here's an example plugin: a button that adds a link to `http://draftjs.org` around any selected text when the button is clicked. The options available for defining a plugin are described in the [createPlugin](#createplugin) section. A live example of this can be run using its [example file](example/link.html).

```javascript
// LinkPlugin.js

import React from 'react';
import {Entity, Modifier, EditorState} from 'draft-js';
import {createPlugin, pluginUtils} from 'draft-extend';

const ENTITY_TYPE = 'LINK';

// Button component to add below the editor
const LinkButton = ({editorState, onChange}) => {
    const addLink = () => {
        const contentState = Modifier.applyEntity(
            editorState.getCurrentContent(),
            editorState.getSelection(),
            Entity.create(
                ENTITY_TYPE,
                'MUTABLE',
                {
                    href: 'http://draftjs.org',
                    target: '_blank'
                }
            )
        );
        onChange(
            EditorState.push(
                editorState,
                contentState,
                'apply-entity'
            )
        );
    }

    return <button onClick={addLink}>Add Draft Link</button>;
};

// Decorator to render links while editing
const LinkDecorator = {
    strategy: pluginUtils.entityStrategy(ENTITY_TYPE),
    component: (props) => {
        const entity = Entity.get(props.entityKey);
        const {href, target} = entity.getData();

        return (
            <a href={href} target={target}>
                {props.children}
            </a>
        );
    }
};

// Convert links in input HTML to entities
const htmlToEntity = (nodeName, node) => {
    if (nodeName === 'a') {
        return Entity.create(
            ENTITY_TYPE,
            'MUTABLE',
            {
                href: node.getAttribute('href'),
                target: node.getAttribute('target')
            }
        )
    }
};

// Convert entities to HTML for output
const entityToHTML = (entity, originalText) => {
    if (entity.type === ENTITY_TYPE) {
        return (
            <a href={entity.data.href} target={entity.data.target}>
                {originalText}
            </a>
        );
    }
    return originalText;
};

const LinkPlugin = createPlugin({
    displayName: 'LinkPlugin',
    buttons: LinkButton,
    decorators: LinkDecorator,
    htmlToEntity,
    entityToHTML
});

export default LinkPlugin;
```

## createPlugin
Factory function to create plugins. `createPlugin` takes one `options` object argument. All properties of `options` are optional.
### Plugin options
#### Editor rendering options
- `displayName: string` - `displayName` of the higher-order component when wrapping around `Editor`.
    - default: `'Plugin'`
- `buttons: Array<Component> | Component` - Zero or more button components to add to the Editor. If only one button is needed it may be passed by itself without an array.  See [Buttons & Overlays](#buttons--overlays) for more information on props and usage.
    - default: `[]`
- `overlays: Array<Component> | Component` - Zero or more overlay components to add to the Editor. If only one overlay is needed it may be passed by itself without an array.  See [Buttons & Overlays](#buttons--overlays) for more information on props and usage.
     - default: `[]`
- `decorators: Array<Decorator> | Decorator` - Zero or more decorator objects that the plugin uses to decorate editor content. If only one decorator is needed it may be passed by itself without an array. Decorator objects are of shape `{strategy, component}`. See [Draft.js' Decorator documentation](https://facebook.github.io/draft-js/docs/advanced-topics-decorators.html) for more information.
    - default: `[]`
- `styleMap: {[inlineStyleType: string]: Object}` - Object map of styles to apply to any inline styles in the editor. Used in the `customStyleMap` prop on the Draft.js `Editor` component.
    - default: `{}`
- `blockStyleFn: function(contentBlock: ContentBlock): ?string` - Function that inspects a Draft.js ContentBlock and returns a string `class` that if it exists is applied to the block element in the DOM. If no class should be added it may return nothing. See [Draft.js' block styling documentation](https://facebook.github.io/draft-js/docs/advanced-topics-block-styling.html) for more information.
    - default: `() => {}`
- `blockRendererFn: function(contentBlock: ContentBlock): ?BlockRendererObject` - Function that inspects a Draft.js ContentBlock and returns a custom block renderer object if it should be rendered differently. If no custom renderer should be used it may return nothing. The block renderer object is of shape `{component, editable, props}`. See [Draft.js' custom block components documentation](https://facebook.github.io/draft-js/docs/advanced-topics-block-components.html) for more information.
    - default: `() => {}`
- `keyBindingFn: function(e: SyntheticKeyboardEvent): ?string` - Function to assign named key commands to key events on the editor. Works as described in [Draft.js' key bindings documentation](https://facebook.github.io/draft-js/docs/advanced-topics-key-bindings.html). If the plugin should not name the key command it may return `undefined`. Note that if no plugin names a key commmand the `Editor` component will fall back to `Draft.getDefaultKeyBinding`.
- `keyCommandListener: function(editorState: EditorState, command: string, keyboardEvent: SyntheticKeyboardEvent): boolean | EditorState` - Function to handle key commands without using a button or overlay component.

#### Conversion Options
Plugins can include options to handle serialization and deserialization of their functionality to and from HTML.

**Middleware usage**
`draft-extend` conversion options are all [middleware functions](http://redux.js.org/docs/advanced/Middleware.html) that allow plugins to transform the result of those that were composed before it. An example plugin leveraging middleware is a block alignment plugin that adds an `align` property to the block's metadata. This plugin should add a `text-align: right` style to any block with the property regardless of block type. Transforming the result of `next(block)` instead of building markup from scratch allows the plugin to only apply the changes it needs to. If middleware functionality is not necessary, any conversion option may omit the higher-order function receiving `next` and merely return `null` or `undefined` to defer the entire result to subsequent plugins.
```javascript
const AlignmentPlugin = createPlugin({
    ...
    blockToHTML: (next) => (block) => {
        const result = next(block);
        if (block.data.align && React.isValidElement(result)) {
            const style = result.props.style || {};
            style.textAlign = block.data.align;
            return React.cloneElement(result, {style});
        }
        return result;
    }
});
```

**Options**
- `styleToHTML: (next: function) => (style: string) => (ReactElement | MarkupObject)` - Function that takes inline style types and returns an empty `ReactElement` (most likely created via JS) or HTML markup for output. A `MarkupObject` is an object of shape `{start, end}`, for example:
    ```javascript
    const styleToHTML = (style) => {
        if (style === 'BOLD') {
            return {
                start: '<strong>',
                end: '</strong>'
            };
        }
    };
    ```
- `blockToHTML: (next: function) => (block: RawBlock) => (ReactElement | {element: ReactElement, nest?: ReactElement} | BlockMarkupObject)` - Function accepting a raw block object and returning `ReactElement`s or HTML markup for output. If using `ReactElement`s as return values for nestable blocks (`ordered-list-item` and `unordered-list-item`), a `ReactElement` for both the wrapping element and the block being nested may be included in an object of shape `{element, nest}`. A `BlockMarkupObject` is identical to `MarkupObject` with the exception of nestable blocks. These block types include properties for handling nesting. The default values for `ordered-list-item` are:
    ```javascript
    {
        start: '<li>',
        end: '</li>',
        nestStart: '<ol>',
        nestEnd: '</ol>'
    }
    ```
- `entityToHTML: (next: function) => (entity: RawEntity, originalText: string): (ReactElement | MarkupObject | string)` - Function to transform instances into HTML output. A `RawEntity` is an object of shape `{type: string, mutability: string, data: object}`. If the returned `ReactElement` contains no children it will be wrapped around `originalText`. A `MarkupObject` will also be wrapped around `orignalText`.
- `htmlToStyle: (next: function) => (nodeName: string, node: Node) => OrderedSet` - Function that is passed an HTML Node. It should return a list of styles to be applied to all children of the node. The function will be invoked on all HTML nodes in the input.
- `htmlToBlock: (next: function) => (nodeName: string, node: Node) => RawBlock | string` - Function that inspects an HTML `Node` and can return data to assign to the block in the shape `{type, data}`. If no data is necessary a block type may be returned as a string. If no custom type should be used it may return `null` or `undefined`.
- `htmlToEntity: (next: function) => (nodeName: string, node: Node) => ?string` - Function that inspects an HTML Node and converts it to any Draft.js Entity that should be applied to the contents of the Node. If an Entity should be applied this function should call `Entity.create()` and return the string return value that is the Entity instance's key. If no entity is necessary it may return nothing.
- `textToEntity: (next: function) => (text: string) => Array<TextEntityObject>` - Function to convert plain input text to entities. Note that `textToEntity` is invoked with the value of each individual text DOM Node. For example, with input `<div>node one<span>node two</span></div>` `textToEntity` will be called with strings `'node one'` and `'node two'`. Implementations of this function generally uses a regular expression to return an array of as many `TextEntityObject`s as necessary for the text string. A `TextEntityObject` is an object with properties:
    - `offset: number`: Offset of the entity to add within `text`
    - `length: number`: Length of the entity starting at `offset` within `text`
    - `result: string`: If necessary, a new string to replace the substring in `text` defined by `offset` and `length`. If omitted from the object no replacement will be made.
    - `entity: string`: key of the Entity instance to be applied for this range. This is generally the result of `Entity.create()`.

***

## Buttons & Overlays
Plugins can augment the rendered UI of the editor by adding always-visible controls by passing a component to the `buttons` option or by adding UI on top of the editor itself (e.g. at-mention typeahead results) using the `overlays` option. Either of these component types may want to respond to or handle keyboard events within the Draft.js editor, so they are provided props to handle subscription to Draft.js key commands. [Draft.js' key bindings documentation](https://facebook.github.io/draft-js/docs/advanced-topics-key-bindings.html) has more information on key commands.

#### Button & Overlay Props
- `editorState: EditorState` - current EditorState of the `Editor` component.
- `onChange: function(editorState: EditorState)` - handler for making changes to editor state. Passed down from the `Editor` component
- `addKeyCommandListener(listener: (editorState: EditorState, command: string, keyboardEvent: SyntheticKeyboardEvent): ?boolean)`- Subscribes a listener function to handle `Editor` key commands. Subscription should usually happen on component mount. If no further handling should be made by other handlers then a listener may return `true`. Listeners are called in order of most recently added to least recently added. Key events normally handled in Draft.js by `handleReturn`, `onEscape`, `onTab`, `onUpArrow`, and `onDownArrow` props (and therefore not in the normal `handleKeyCommand`) are also routed through the listener. These events are the only ones that include the `keyboardEvent` argument and have commands `'return'`, `'escape'`, `'tab'`, `'up-arrow'`, and `'down-arrow'` respectively. `keyboardEvent` is useful for calling `preventDefault()` since Draft.js' built in event handling cannot respsect the return value of the listener.
- `removeKeyCommandListener(listener: function): void` - Unsubscribes a listener function that was previously subscribed. Unsubscription should generally happen before component unmount.

#### Overlay notes
Overlay components are often absolutely positioned using `Draft.getVisibleSelectionRect(window)`'s coordinates. To make sure that no parent elements with `position: relative` style affect positioning, the overlay components are 'portaled' out of the component tree to be children of `document.body`.

***

## pluginUtils
A collection of useful functions for building plugins.

- `camelCaseToHyphen: function(camelCase: string): string` - Converts a camelCased word to a hyphenated-string. Used in `styleObjectToString`.
- `styleObjectToString: function(styles: object): string` -  Converts a style object (i.e. object passed into the `style` prop of a React component) to a CSS string for use in a `style` HTML attribute. Useful for converting inline style types to HTML while keeping a single source of truth for the style for both `styleMap` and `styleToHTML`.
- `entityStrategy: function(entityType: string): function(contentBlock, callback)` - factory function to generate decorator strategies to decorate all instances of a given entity type. For example:
    ```
        const MyPlugin = createPlugin({
            ...
            decorators: {
                strategy: entityStrategy('myEntity'),
                component: MyEntityComponent
            }
        });
    ```
- `getEntitySelection: function(editorState: EditorState, entityKey: string): SelectionState` - Returns the selection of an Entity instance in `editorState` with key `entityKey`.
- `getSelectedInlineStyles: function(editorState): Set` - Returns a `Set` of all inline style types matched by any character in the current selection. Ths acts differently from `EditorState.getCurrentInlineStyle()` when the selection is not collapsed since `getSelectedInlineStyles` will include styles from every character in the selection instead of the single character at the focus index of the selection.
- `getActiveEntity(editorState: EditorState): ?string` - Returns the key for the Entity that the current selection start is within, if it exists. Returns `undefined` if the selection start is not within an entity range.
- `isEntityActive(editorState, entityType): bool` - Returns `true` if the current selection start is within an entity of type `entityType`, and false otherwise. Useful for setting a button's active state when associated with an entity type.
