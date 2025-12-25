import { ShapeFlags } from "@vue/shared";
import { Text, Comment, Fragment } from "@vue/runtime-core";
import { EMPTY_OBJ } from "@vue/shared";
import { isSameVNodeType } from "./createVnode";

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

  /**
   * 为 props 打补丁
   */
  const patchProps = (el: Element, vnode, oldProps, newProps) => {
    // 新旧 props 不相同时才进行处理
    if (oldProps !== newProps) {
      // 遍历新的 props，依次触发 hostPatchProp ，赋值新属性
      for (const key in newProps) {
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev) {
          hostPatchProp(el, key, prev, next);
        }
      }
      // 存在旧的 props 时
      if (oldProps !== EMPTY_OBJ) {
        // 遍历旧的 props，依次触发 hostPatchProp ，删除不存在于新props 中的旧属性
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  };

  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      // 挂载操作
      console.log("挂载操作", newVNode);
      mountElement(newVNode, container, anchor);
    } else {
      // TODO: 更新操作
      patchElement(oldVNode, newVNode);
    }
  };

  //更新元素
  const patchElement = (oldVNode, newVNode) => {
    // 获取指定的 el
    const el = (newVNode.el = oldVNode.el!);

    // 新旧 props
    const oldProps = oldVNode.props || EMPTY_OBJ;
    const newProps = newVNode.props || EMPTY_OBJ;

    // 更新子节点
    patchChildren(oldVNode, newVNode, el, null);

    // 更新 props
    patchProps(el, newVNode, oldProps, newProps);
  };

  /**
   * 为子节点打补丁
   */
  const patchChildren = (oldVNode, newVNode, container, anchor) => {
    // 旧节点的 children
    const c1 = oldVNode && oldVNode.children;
    // 旧节点的 prevShapeFlag
    // 如果oldvalue存在,则prevShapeFlag为oldVNode.shapeFlag,否则为0
    const prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0;
    // 新节点的 children
    const c2 = newVNode.children;

    // 新节点的 shapeFlag
    const { shapeFlag } = newVNode;

    //如果新节点为文本,旧节点为数组,则卸载旧节点
    // 新子节点为 TEXT_CHILDREN
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧子节点为 ARRAY_CHILDREN
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // TODO: 卸载旧子节点
      }
      // 新旧子节点不同
      if (c2 !== c1) {
        // 挂载新子节点的文本
        hostSetElementText(container, c2 as string);
      }
    } else {
      // 旧子节点为 ARRAY_CHILDREN
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新子节点也为 ARRAY_CHILDREN
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO: 这里要进行 diff 运算
        }
        // 新子节点不为 ARRAY_CHILDREN，则直接卸载旧子节点
        else {
          // TODO: 卸载
        }
      } else {
        // 旧子节点为 TEXT_CHILDREN
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 删除旧的文本
          hostSetElementText(container, "");
        }
        // 新子节点为 ARRAY_CHILDREN
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO: 单独挂载新子节点操作
        }
      }
    }
  };

  //卸载节点
  const unmount = (vnode) => {
    hostRemove(vnode.el!);
  };

  //挂载子节点
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      //可能是纯文本 进行递归设置内部内容
      patch(null, children[i], container);
    }
  };

  //挂载元素
  const mountElement = (vnode, container, anchor = null) => {
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
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1); // 需要先实现 unmount 函数
      n1 = null; // 将 n1 设为 null，后续会走挂载流程
    }
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
          processElement(n1, n2, container, anchor);
          // TODO: Element
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // TODO: 组件
        }
    }
  };

  //多次调用render，需要对比
  const render = (vnode, container) => {
    //将虚拟节点渲染成真实节点
    //_vnode第一次为null，之后为上一次的虚拟节点
    if (vnode == null) {
      // if (container._vnode) {
      //   hostRemove(container._vnode.el);
      // }
    } else {
      patch(container._vnode || null, vnode, container);
    }

    container._vnode = vnode;
  };
  return {
    render,
  };
}
