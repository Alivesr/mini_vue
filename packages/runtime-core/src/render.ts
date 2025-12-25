import { ShapeFlags } from "@vue/shared";
import { Text, Comment, Fragment } from "@vue/runtime-core";
export function createRenderer(rendererOptions) {
  //core 不关心如何渲染

  const {
    insert: hostInsert,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
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

    //根据标签类型创建真实节点
    const el = hostCreateElement(type);
    vnode.el = el;

    //设置属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
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

  //对比更新节点
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 == n2) {
      return;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        // TODO: Text
        break;
      case Comment:
        // TODO: Comment
        break;
      case Fragment:
        // TODO: Fragment
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // TODO: Element
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // TODO: 组件
        }
    }
    if (n1 === null) {
      mountElement(n2, container);
    }
  };

  //多次调用render，需要对比
  const render = (vnode, container) => {
    //将虚拟节点渲染成真实节点
    //_vnode第一次为null，之后为上一次的虚拟节点
    if (vnode == null) {
      if (container._vnode) {
        hostRemove(container._vnode.el);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }

    container._vnode = vnode;
  };
  return {
    render,
  };
}
