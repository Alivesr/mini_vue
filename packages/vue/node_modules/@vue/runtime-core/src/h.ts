import { isObject } from "@vue/reactivity";
import { createVNode, isVnode } from "./createVnode";

//
export function h(type, propsOrChildren, children) {
  //获取用户传递的参数数量
  const l = arguments.length;

  //如果用户只传递了两个参数 ,那么证明第二个参数可能是children也可能是props
  if (l === 2) {
    //如果第二个参数是对象,但不是数组,则第二个参数有两种可能1.是props 2.Vnode
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      //如果是VNode对象 ,那么第二个参数代表children
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      } else {
        //否则第二个参数代表props
        return createVNode(type, propsOrChildren);
      }
    }
    //如果第二个参数不是单纯的Object,则第二个参数代表了children
    else {
      return createVNode(type, null, propsOrChildren);
    }
  } //如果用户传递了三个参数,则第二个参数一定是props,第三个参数一定是children
  else {
    //如果传递的参数大于3个,则说明第三个参数到最后一个参数都是children
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVnode(children)) {
      //如果第三个参数是单个vnode,则包装成数组
      children = [children];
    }
    //触发创建vnode的函数
    return createVNode(type, propsOrChildren, children);
  }
}
