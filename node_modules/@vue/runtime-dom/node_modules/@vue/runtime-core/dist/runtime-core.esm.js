// packages/runtime-core/src/index.ts
function createRenderer(rendererOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling
  } = rendererOptions;
  const render = (vnode, container) => {
    console.log(vnode, container);
  };
  return {
    render
  };
}
export {
  createRenderer
};
//# sourceMappingURL=runtime-core.esm.js.map
