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
  } else {
    return patchAttr(el, key, nextValue);
  }
}
