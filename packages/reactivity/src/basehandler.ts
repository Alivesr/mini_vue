import { activeEffect } from "./effect";
import { track } from "./reactiveEffect";
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
    return Reflect.get(target, key, receiver);

    //取值的时候应该给让属性和effect建立联系
    //todo 依赖收集
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
  },
};
