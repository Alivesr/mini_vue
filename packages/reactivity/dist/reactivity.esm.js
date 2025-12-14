// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run;
  });
  _effect.run();
}
var activeEffect;
var ReactiveEffect = class {
  // 创建的effect 是响应式的
  //fn 用户传入的函数
  //scheduler 调度器
  //如果fn中依赖的数据变化了，就重新调用run方法
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = lastEffect;
    }
  }
};

// packages/reactivity/src/reactiveEffect.ts
function track(target, key) {
  if (activeEffect) {
    console.log(key, activeEffect);
  }
}

// packages/reactivity/src/basehandler.ts
var mutableHandlers = {
  // 获取属性值
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
  }
};

// packages/reactivity/src/reactive.ts
function isObject(val) {
  return typeof val === "object" && val !== null;
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  if (!isObject(target)) {
    return;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }
  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
function reactive(target) {
  return createReactiveObject(target);
}
export {
  activeEffect,
  effect,
  reactive
};
//# sourceMappingURL=reactivity.esm.js.map
