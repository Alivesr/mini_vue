import { isArray, isFunction, isObject, isString } from "@vue/shared";
import { reactive } from "@vue/reactivity";
import { onBeforeMount, onMounted } from "./apiLifecycle";

let uid = 0;

export const enum LifecycleHooks {
  BEFORE_CREATE = "bc",
  CREATED = "c",
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
}

/**
 * 创建组件实例
 */
export function createComponentInstance(vnode) {
  const type = vnode.type;

  const instance = {
    uid: uid++, // 唯一标记
    vnode, // 虚拟节点
    type, // 组件类型
    subTree: null!, // render 函数的返回值
    effect: null!, // ReactiveEffect 实例
    update: null!, // update 函数，触发 effect.run
    render: null, // 组件内的 render 函数
    isMounted: false, // 是否挂载
    bc: null, // beforeCreate
    c: null, // created
    bm: null, // beforeMount
    m: null, // mounted
  };

  return instance;
}

function applyOptions(instance: any) {
  const {
    data: dataOptions,
    beforeCreate,
    created,
    beforeMount,
    mounted,
  } = instance.type;
  // hooks
  if (beforeCreate) {
    callHook(beforeCreate);
  }

  // 存在 data 选项时
  if (dataOptions) {
    // 触发 dataOptions 函数，拿到 data 对象
    const data = dataOptions();
    // 如果拿到的 data 是一个对象
    if (isObject(data)) {
      // 则把 data 包装成 reactiv 的响应性数据，赋值给 instance
      instance.data = reactive(data);
    }
  }

  // hooks
  if (created) {
    callHook(created);
  }
  function registerLifecycleHook(register: Function, hook?: Function) {
    register(hook, instance);
  }
  registerLifecycleHook(onBeforeMount, beforeMount);
  registerLifecycleHook(onMounted, mounted);
}

function callHook(hook: Function) {
  hook();
}

/**
 * 规范化组件实例数据
 */
export function setupComponent(instance) {
  debugger;
  // 为 render 赋值
  const setupResult = setupStatefulComponent(instance);
  return setupResult;
}

function setupStatefulComponent(instance) {
  finishComponentSetup(instance);
}

export function finishComponentSetup(instance) {
  // 获取组件类型 和 render
  const Component = instance.type;

  instance.render = Component.render;
  // 调用 applyOptions 改变组件实例数据
  applyOptions(instance);
}
