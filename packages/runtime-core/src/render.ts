import { ShapeFlags } from "@vue/shared";
import { Text, Comment, Fragment } from "@vue/runtime-core";
import { EMPTY_OBJ, isString } from "@vue/shared";
import { isSameVNodeType } from "./createVnode";
import { normalizeVNode } from "./componentRenderUtils";
import { createComponentInstance, setupComponent } from "./component";
import { ReactiveEffect } from "@vue/reactivity";
import { renderComponentRoot } from "./componentRenderUtils";
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
    createComment: hostCreateComment,
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

  const processText = (oldVNode, newVNode, container, anchor) => {
    // 不存在旧的节点，则为 挂载 操作
    if (oldVNode == null) {
      // 生成节点
      newVNode.el = hostCreateText(newVNode.children as string);
      // 挂载
      hostInsert(newVNode.el, container, anchor);
    }
    // 存在旧的节点，则为 更新 操作
    else {
      const el = (newVNode.el = oldVNode.el!);
      if (newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children as string);
      }
    }
  };

  /**
   * Comment 的打补丁操作
   */
  const processCommentNode = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      // 生成节点
      newVNode.el = hostCreateComment((newVNode.children as string) || "");
      // 挂载
      hostInsert(newVNode.el, container, anchor);
    } else {
      // 无更新
      newVNode.el = oldVNode.el;
    }
  };

  /**
   * Fragment 的打补丁操作
   */
  const processFragment = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountChildren(newVNode.children, container);
    } else {
      patchChildren(oldVNode, newVNode, container, anchor);
    }
  };

  /**
   * 组件的打补丁操作
   */
  const processComponent = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      // 挂载

      mountComponent(newVNode, container, anchor);
      console.log("挂载组件", newVNode);
    }
  };

  const mountComponent = (initialVNode, container, anchor) => {
    // 生成组件实例
    initialVNode.component = createComponentInstance(initialVNode);
    // 浅拷贝，绑定同一块内存空间

    const instance = initialVNode.component;

    // 标准化组件实例数据
    setupComponent(instance);

    // 设置组件渲染
    setupRenderEffect(instance, initialVNode, container, anchor);
  };

  /**
   * 设置组件渲染
   */
  const setupRenderEffect = (instance, initialVNode, container, anchor) => {
    // 组件挂载和更新的方法
    const componentUpdateFn = () => {
      // 当前处于 mounted 之前，即执行 挂载 逻辑
      if (!instance.isMounted) {
        //获取hook
        const { bm, m } = instance;

        // beforeMount hook
        if (bm) {
          bm();
        }

        // 从 render 中获取需要渲染的内容
        const subTree = (instance.subTree = renderComponentRoot(instance));

        // 通过 patch 对 subTree，进行打补丁。即：渲染组件
        patch(null, subTree, container, anchor);

        // mounted hook
        if (m) {
          m();
        }

        // 把组件根节点的 el，作为组件的 el
        initialVNode.el = subTree.el;
      } else {
      }
    };

    // 创建包含 scheduler 的 effect 实例
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => update
    ));

    // 生成 update 函数
    const update = (instance.update = () => effect.run());

    // 触发 update 函数，本质上触发的是 componentUpdateFn
    update();
  };

  //卸载节点
  const unmount = (vnode) => {
    hostRemove(vnode.el!);
  };

  //挂载子节点
  // const mountChildren = (children, container) => {
  //   for (let i = 0; i < children.length; i++) {
  //     //可能是纯文本 进行递归设置内部内容
  //     patch(null, children[i], container);
  //   }
  // };
  const mountChildren = (children, container, anchor?) => {
    // 处理 Cannot assign to read only property '0' of string 'xxx'
    if (isString(children)) {
      children = children.split("");
    }
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]));
      patch(null, child, container, anchor);
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
        processText(n1, n2, container, anchor);
        break;
      case Comment:
        // TODO: Comment
        processCommentNode(n1, n2, container, anchor);
        break;
      case Fragment:
        // TODO: Fragment
        processFragment(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
          // TODO: Element
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // TODO: 组件
          processComponent(n1, n2, container, anchor);
        }
    }
  };

  //多次调用render，需要对比
  const render = (vnode, container) => {
    //将虚拟节点渲染成真实节点
    //_vnode第一次为null，之后为上一次的虚拟节点
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
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
