//diff算法
import patchClass from "./modules/patchClass";
import patchStyle from "./modules/patchStyle";
import patchEvent from "./modules/patchEvent";
import patchAttr from "./modules/patchAttr";

//onclick = ()=>{fn()} 通过改这个函数内部的value来实现事件的更新
//创建一个调用函数

export default function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, prevValue, nextValue);
  } else if (/on[^a-z]/.test(key)) {
    //事件 el.addEventListener('click',fn)
    return patchEvent(el, key, nextValue);
  } else if (shouldSetAsProp(el, key)) {
    // 通过 DOM Properties 指定
    patchDOMProp(el, key, nextValue);
  } else {
    // 其他属性
    patchAttr(el, key, nextValue);
  }
}

function shouldSetAsProp(el: Element, key: string) {
  // #1787, #2840 表单元素的表单属性是只读的，必须设置为属性 attribute
  if (key === "form") {
    return false;
  }

  // #1526 <input list> 必须设置为属性 attribute
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }

  // #2766 <textarea type> 必须设置为属性 attribute
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }

  return key in el;
}

export function patchDOMProp(el: any, key: string, value: any) {
  try {
    el[key] = value;
  } catch (e: any) {}
}

// export default function patchProp(el, key, prevValue, nextValue) {
//   if (key === "class") {
//     return patchClass(el, nextValue);
//   } else if (key === "style") {
//     return patchStyle(el, prevValue, nextValue);
//   } else if (/on[^a-z]/.test(key)) {
//     //事件 el.addEventListener('click',fn)
//     return patchEvent(el, key, nextValue);
//   } else {
//     return patchAttr(el, key, nextValue);
//   }
// }
