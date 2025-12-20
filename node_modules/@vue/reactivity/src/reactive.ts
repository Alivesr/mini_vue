import { mutableHandlers } from "./basehandler";
import { ReactiveFlags } from "./constans";

export function isReactive(value: any): boolean {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

export function isObject(val: any) {
  return typeof val === "object" && val !== null;
}
// 存储响应式对象的映射 用于缓存响应式对象 可以避免重复创建代理对象
const reactiveMap = new WeakMap();

// 创建响应式对象 返回一个代理对象
function createReactiveObject(target: object) {
  // 如果目标不是对象，则返回
  if (!isObject(target)) {
    return;
  }
  // 这里通过target[ReactiveFlags.IS_REACTIVE]来触发getter 返回true
  // 说明目标对象已经是响应式对象了 不需要再代理
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 如果缓存中存在，则返回缓存中的代理对象
  // 说明目标对象已经被代理过了 不需要再代理
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }

  // 创建代理对象
  //mutableHandlers 是一个代理处理函数 用于处理代理对象的读写操作
  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

// 创建响应式对象 返回一个代理对象
export function reactive(target: object) {
  return createReactiveObject(target);
}

// 转换为响应式对象
export function toReactive(value: any) {
  return isObject(value) ? reactive(value) : value;
}
