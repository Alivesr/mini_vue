import { ShapeFlags } from "@vue/shared";
export function createRenderer(rendererOptions) {
  //core 不关心如何渲染

  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = rendererOptions;

  //挂载子节点
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      //可能是纯文本 进行递归设置内部内容
      patch(null, children[i], container);
    }
  };

  //挂载元素
  const mountElement = (vnode, container) => {
    //从vnode中获取关键元素
    const { type, children, props, shapeFlag } = vnode;
    // console.log(props, "props");
    // console.log(type, "type"); //h1 //标签类型

    //根据标签类型创建真实节点
    const el = hostCreateElement(type);
    //设置属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // console.log(vnode);
    //根据类型 处理子节点
    // hostSetElementText(el, children);
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本子节点 如果传的是文本 则直接将children也就是文本内容设置到el上
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 数组子节点 如果传的是数组 则遍历数组
      mountChildren(children, el);
    }
    hostInsert(el, container);
  };

  const patch = (n1, n2, container) => {
    if (n1 == n2) {
      return;
    }
    //初始化
    if (n1 === null) {
      mountElement(n2, container);
    }
  };

  //多次调用render，需要对比
  const render = (vnode, container) => {
    //将虚拟节点渲染成真实节点
    //_vnode第一次为null，之后为上一次的虚拟节点
    patch(container._vnode || null, vnode, container);

    container._vnode = vnode;
  };
  return {
    render,
  };
}
