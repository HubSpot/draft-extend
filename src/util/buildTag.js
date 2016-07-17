export const buildTag = (tagName, contents, attrs = {}) => {
  let attrStr = '';
  if (Object.keys(attrs).length) {
    attrStr = Object.keys(attrs)
      .filter(k => attrs[k])
      .map(k => `${k}="${attrs[k]}"`).join(' ');
    if (attrStr.length) {
      attrStr = ` ${attrStr}`;
    }
  }

  return `<${tagName}${attrStr}>${contents}</${tagName}>`;
};
