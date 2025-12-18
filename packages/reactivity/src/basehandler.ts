import { trigger } from "./reactiveEffect";
import { track } from "./reactiveEffect";
import { reactive } from "./reactive";
import { isObject } from "./reactive";
export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
export const mutableHandlers: ProxyHandler<object> = {
  // 获取属性值
  get(target, key, receiver) {
    // 如果是响应式对象，则返回true
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    track(target, key); //依赖收集

    // console.log(activeEffect, key);

    // 默认行为，使用Reflect获取属性值
    // receiver是代理对象
    let res = Reflect.get(target, key, receiver);

    if (isObject(res)) {
      // 当取的值为对象的时候 我需要对这个对象进行递归代理
      return reactive(res);
    }
    //默认行为
    return res;
    //取值的时候应该给让属性和effect建立联系
    //todo 依赖收集
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    let result = Reflect.set(target, key, value, receiver);
    // 如果属性值没有改变，则不触发更新
    if (oldValue !== value) {
      // 触发更新
      trigger(target, key, value, oldValue);
    }

    return result;
  },
};
