import { ShapeFlags, normalizeClass } from "@vue/shared";
import { isString, isArray, isFunction, isObject } from "@vue/shared";
export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");
export const Comment = Symbol("Comment");
export function isVnode(value) {
  return value.__v_isVnode === true;
}
export interface VNode {
  __v_isVNode: true;
  type: any;
  props: any;
  children: any;
  shapeFlag: number;
}

export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false;
}

// * 生成一个 VNode 对象，并返回
//  * @param type vnode.type
//  * @param props 标签属性或自定义属性
//  * @param children 子节点
//  * @returns vnode 对象
//  */
export function createVNode(type, props, children?): VNode {
  if (props) {
    // 处理 class
    let { class: klass, style } = props;
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass);
    }
  }
  // 通过 bit 位处理 shapeFlag 类型
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  return createBaseVNode(type, props, children, shapeFlag);
}

/**
 * 构建基础 vnode
 */
function createBaseVNode(type, props, children, shapeFlag) {
  const vnode = {
    __v_isVNode: true, //标识
    type,
    props,
    shapeFlag,
  } as VNode;

  normalizeChildren(vnode, children);

  return vnode;
}

//负责处理不同类型的子节点
export function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    // 数组类型的子节点
    type = ShapeFlags.ARRAY_CHILDREN;
    // TODO: array
  } else if (typeof children === "object") {
    // TODO: object
  } else if (isFunction(children)) {
    // TODO: function
  } else {
    // children 为 string
    children = String(children);
    // 为 type 指定 Flags
    type = ShapeFlags.TEXT_CHILDREN;
  }
  // 修改 vnode 的 chidlren
  vnode.children = children;
  // 按位或赋值
  vnode.shapeFlag |= type;
}

// export function createVnode(type, props, children?) {
//   const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
//   const vnode = {
//     __v_isVnode: true,
//     type,
//     props,
//     children,
//     key: props?.key,
//     el: null, // 虚拟节点需要对应的真实节点是
//     shapeFlag,
//   };

//   if (children) {
//     if (Array.isArray(children)) {
//       vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
//     } else {
//       children = String(children);
//       vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
//     }
//   }
//   return vnode;
// }
