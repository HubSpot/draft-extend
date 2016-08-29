export default function blockTypeObjectFunction(typeObject) {
  if (typeof typeObject === 'function') {
    return typeObject;
  }

  return (block) => {
    return typeObject[block.type];
  };
}
