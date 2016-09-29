import {EditorState, SelectionState, Entity, Modifier, ContentBlock, genKey, BlockMapBuilder} from 'draft-js';
import {List, Set} from 'immutable';
import invariant from 'invariant';

const camelCaseToHyphen = (camelCase) => {
  return camelCase.replace(/[a-z][A-Z]/g, (str) => {
    return str[0] + '-' + str[1].toLowerCase();
  });
};

const getActiveEntity = (editorState) => {
  const currentBlock = editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getStartKey());
  if (currentBlock) {
    return currentBlock.getEntityAt(editorState.getSelection().getStartOffset());
  }
};

export default {
  camelCaseToHyphen,

  styleObjectToString(styles) {
    return Object.keys(styles).map((styleName) => {
      return `${camelCaseToHyphen(styleName)}: ${styles[styleName]};`;
    }).join(' ').replace(/"/g, '\\"');
  },

  entityStrategy: (entityType) => (contentBlock, callback) => {
    contentBlock.findEntityRanges(
      (character) => {
        const entityKey = character.getEntity();
        return (
          entityKey !== null &&
          Entity.get(entityKey).getType() === entityType
        );
      },
      callback
    );
  },

  getEntitySelection(editorState, entityKey) {
    const selections = [];
    editorState.getCurrentContent().getBlocksAsArray().forEach((block) => {
      block.findEntityRanges(
        (c) => c.getEntity() === entityKey,
        (start, end) => {
          selections.push(SelectionState.createEmpty(block.getKey()).merge({
            anchorOffset: start,
            focusOffset: end,
            isBackward: false,
            hasFocus: true
          }));
        }
      );
    });
    invariant(
      selections.length === 1,
      'getEntitySelection: More than one range with the same entityKey. Please use unique entity instances'
    );
    return selections[0];
  },

  insertBlockAtCursor(editorState, block) {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();

    const afterRemoval = Modifier.removeRange(
      contentState,
      selectionState,
      'backward'
    );

    const targetSelection = afterRemoval.getSelectionAfter();
    const afterSplit = Modifier.splitBlock(afterRemoval, targetSelection);
    const insertionTarget = afterSplit.getSelectionAfter();

    const asType = Modifier.setBlockType(
      afterSplit,
      insertionTarget,
      block.getType()
    );

    const fragmentArray = [
      block,
      new ContentBlock({
        key: genKey(),
        type: 'unstyled',
        text: '',
        characterList: List()
      })
    ];

    const fragment = BlockMapBuilder.createFromArray(fragmentArray);

    const withBlock = Modifier.replaceWithFragment(
      asType,
      insertionTarget,
      fragment
    );

    const newContent = withBlock.merge({
      selectionBefore: selectionState,
      selectionAfter: withBlock.getSelectionAfter().set('hasFocus', true)
    });

    return EditorState.push(editorState, newContent, 'insert-fragment');
  },

  getSelectedInlineStyles(editorState) {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();

    const blocks = contentState.getBlockMap()
      .skipUntil((value, key) => {
        return key === selection.getStartKey();
      })
      .takeUntil((value, key) => {
        return contentState.getKeyBefore(key) === selection.getEndKey();
      }
    );

    return blocks.reduce((styles, block) => {
      const blockKey = block.getKey();
      let start = 0;
      let end = block.getLength() - 1;
      if (blockKey === selection.getStartKey()) {
        start = selection.getStartOffset();
      }
      if (blockKey === selection.getEndKey()) {
        end = selection.getEndOffset();
      }

      for (let i = start; i <= end; i++) {
        styles = styles.union(block.getInlineStyleAt(i));
      }

      return styles;
    }, Set());
  },

  matchAll(string, regex) {
    const result = [];
    let matchArray = regex.exec(string);
    while (matchArray !== null) {
      result.push(matchArray.concat([matchArray.index]));
      matchArray = regex.exec(string);
    }
    return result;
  },

  getActiveEntity,

  isEntityActive(editorState, entityType) {
    const activeEntityKey = getActiveEntity(editorState);
    if (activeEntityKey) {
      const entity = Entity.get(activeEntityKey);
      return entity && entity.type === entityType;
    }
    return false;
  }
};
