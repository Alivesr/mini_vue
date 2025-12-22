import { isObject } from "@vue/reactivity";
import { createVnode } from "./createVnode";
function isVnode(value) {
  return value.__v_isVnode === true;
}

export function h(type, propsOrChildren, children) {
  let l = arguments.length;

  //需要查看是否是虚拟节点
  if (l === 2) {
    //如果第二个参数是数组，那么就认为是children
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        //虚拟节点
        return createVnode(type, null, [propsOrChildren]);
      } else {
        //属性
        return createVnode(type, propsOrChildren);
      }
    }
    // 是数组或者字符串
    return createVnode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (l == 3 && isVnode(children)) {
      children = [children];
    }
    return createVnode(type, propsOrChildren, children);
  }
}
