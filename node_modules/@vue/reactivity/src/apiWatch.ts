import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
import { isRef } from "./ref";

export function watch(
  source: any,
  callback: (newVal: any, oldVal: any) => void,
  options: any = {}
) {
  return doWatch(source, callback, options);
}

// 遍历对象并建立依赖关系
function traverse(
  source: any,
  depth?: number,
  currentDepth = 0,
  seen = new Set()
) {
  if (typeof source !== "object" || source === null) {
    return source;
  }

  // 检查循环引用
  if (seen.has(source)) {
    return source;
  }
  seen.add(source);

  // 深度控制
  if (depth !== undefined && currentDepth >= depth) {
    return source;
  }

  // 如果是响应式对象或 ref，访问其值以建立依赖
  if (isReactive(source) || isRef(source)) {
    for (let key in source) {
      // 递归访问所有属性，建立依赖
      traverse(source[key], depth, currentDepth + 1, seen);
    }
  }

  return source;
}

function doWatch(
  source: any,
  callback: (newVal: any, oldVal: any) => void,
  { deep = false } = {}
) {
  let getter;

  // 处理不同类型的 source
  if (typeof source === "function") {
    // getter 函数
    getter = source;
  } else if (isReactive(source)) {
    // 响应式对象
    getter = () => traverse(source, deep ? undefined : 1);
  } else if (isRef(source)) {
    // ref
    getter = () => source.value;
  } else {
    // 其他类型，直接返回值
    getter = () => source;
  }

  let oldValue;

  //job就是依赖函数
  const job = () => {
    // 步骤1：重新运行 effect，获取最新值
    const newValue = effect.run();
    // 此时 effect.run() 会再次执行 getter 函数，收集最新的依赖

    // 步骤2：调用用户传入的回调函数
    callback(newValue, oldValue);
    // 参数：newValue - 新值，oldValue - 旧值
    // 如果是第一次执行，oldValue 是 undefined

    // 步骤3：更新 oldValue 为当前值，为下一次变化做准备
    oldValue = newValue;
  };

  const effect = new ReactiveEffect(getter, job);

  // 立即执行一次收集初始依赖
  oldValue = effect.run();
}
