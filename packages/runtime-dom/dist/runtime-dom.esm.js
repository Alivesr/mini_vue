// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  //插入元素
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
  },
  //删除元素
  remove(el) {
    const parent = el.parentNode;
    if (parent) {
      parent.removeChild(el);
    }
  },
  //创建文本节点
  createText(text) {
    return document.createTextNode(text);
  },
  //创建元素节点
  createElement(type) {
    return document.createElement(type);
  },
  //设置文本节点
  setText(el, text) {
    el.textContent = text;
  },
  //创建注释节点
  createComment: (text) => document.createComment(text),
  //设置元素的文本内容
  setElementText(el, text) {
    el.textContent = text;
  },
  //获取父节点
  parentNode(el) {
    return el.parentNode;
  },
  //获取兄弟节点
  nextSibling(el) {
    return el.nextSibling;
  }
};

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}

// packages/shared/src/shapeFlags.ts
var ShapeFlags = /* @__PURE__ */ ((ShapeFlags2) => {
  ShapeFlags2[ShapeFlags2["ELEMENT"] = 1] = "ELEMENT";
  ShapeFlags2[ShapeFlags2["FUNCTIONAL_COMPONENT"] = 2] = "FUNCTIONAL_COMPONENT";
  ShapeFlags2[ShapeFlags2["STATEFUL_COMPONENT"] = 4] = "STATEFUL_COMPONENT";
  ShapeFlags2[ShapeFlags2["TEXT_CHILDREN"] = 8] = "TEXT_CHILDREN";
  ShapeFlags2[ShapeFlags2["ARRAY_CHILDREN"] = 16] = "ARRAY_CHILDREN";
  ShapeFlags2[ShapeFlags2["SLOTS_CHILDREN"] = 32] = "SLOTS_CHILDREN";
  ShapeFlags2[ShapeFlags2["TELEPORT"] = 64] = "TELEPORT";
  ShapeFlags2[ShapeFlags2["SUSPENSE"] = 128] = "SUSPENSE";
  ShapeFlags2[ShapeFlags2["COMPONENT_SHOULD_KEEP_ALIVE"] = 256] = "COMPONENT_SHOULD_KEEP_ALIVE";
  ShapeFlags2[ShapeFlags2["COMPONENT_KEPT_ALIVE"] = 512] = "COMPONENT_KEPT_ALIVE";
  ShapeFlags2[ShapeFlags2["COMPONENT"] = 6] = "COMPONENT";
  return ShapeFlags2;
})(ShapeFlags || {});

// packages/shared/src/normalizeProp.ts
function normalizeClass(value) {
  let res = "";
  if (isString(value)) {
    res = value;
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}

// packages/shared/src/index.ts
function isFunction(val) {
  return typeof val === "function";
}
function isArray(val) {
  return Array.isArray(val);
}
function isObject(val) {
  return typeof val === "object" && val !== null;
}
function isString(val) {
  return typeof val == "string";
}
var EMPTY_OBJ = Object.freeze({});

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prevValue, nextValue) {
  let style = el.style;
  const isCssString = isString(nextValue);
  if (nextValue && !isCssString) {
    for (let key in nextValue) {
      setStyle(style, key, nextValue[key]);
    }
  }
  if (prevValue && !isCssString) {
    for (let key in prevValue) {
      if (nextValue[key] == null) {
        setStyle(style, key, "");
      }
    }
  }
}
function setStyle(style, key, value) {
  style[key] = value;
}

// packages/runtime-dom/src/modules/patchEvent.ts
function createInvoker(value) {
  const invoker = function(e) {
    invoker.value(e);
  };
  invoker.value = value;
  return invoker;
}
function patchEvent(el, name, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const eventName = name.slice(2).toLowerCase();
  const existingInvokers = invokers[name];
  if (nextValue && existingInvokers) {
    return existingInvokers.value = nextValue;
  }
  if (nextValue) {
    const invoker = invokers[name] = createInvoker(nextValue);
    el.addEventListener(eventName, invoker);
  }
  if (existingInvokers) {
    el.removeEventListener(eventName, existingInvokers);
    invokers[name] = void 0;
  }
}

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key);
  }
}

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, prevValue, nextValue);
  } else if (/on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else if (shouldSetAsProp(el, key)) {
    patchDOMProp(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
}
function shouldSetAsProp(el, key) {
  if (key === "form") {
    return false;
  }
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }
  return key in el;
}
function patchDOMProp(el, key, value) {
  try {
    el[key] = value;
  } catch (e) {
  }
}

// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var activeEffect;
function preCleanEffect(effect3) {
  effect3._depsLength = 0;
  effect3._trackId++;
}
function postCleanEffect(effect3) {
  for (let i = effect3._depsLength; i < effect3.deps.length; i++) {
    cleanDepEffect(effect3.deps[i], effect3);
  }
  effect3.deps.length = effect3._depsLength;
}
var ReactiveEffect = class {
  //fn 用户传入的函数
  //scheduler 调度器
  //如果fn中依赖的数据变化了，就重新调用run方法
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this._trackId = 0;
    //用于标识当前effect执行了几次
    this.active = true;
    // 创建的effect 是响应式的
    this.deps = [];
    //用于存放当前effect 依赖的dep
    this._depsLength = 0;
    //用于记录当前effect 依赖的dep的数量
    this._running = 0;
    this._dirtyLevel = 4 /* Dirty */;
  }
  get dirty() {
    return this._dirtyLevel === 4 /* Dirty */;
  }
  set dirty(v) {
    this._dirtyLevel = v ? 4 /* Dirty */ : 0 /* NotDirty */;
  }
  run() {
    this._dirtyLevel = 0 /* NotDirty */;
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this);
      this._running++;
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
  // 停止effect 依赖收集
  stop() {
    if (this.active) {
      preCleanEffect(this);
      postCleanEffect(this);
      this.active = false;
    }
  }
};
function cleanDepEffect(dep, effect3) {
  dep.delete(effect3);
  if (dep.size == 0) {
    dep.cleanup();
  }
}
function trackEffect(effect3, dep) {
  if (dep.get(effect3) !== effect3._trackId) {
    dep.set(effect3, effect3._trackId);
    let oldDeps = effect3.deps[effect3._depsLength];
    if (oldDeps !== dep) {
      if (oldDeps) {
        cleanDepEffect(oldDeps, effect3);
      }
      effect3.deps[effect3._depsLength++] = dep;
    } else {
      effect3._depsLength++;
    }
  }
}
function triggerEffects(dep) {
  for (const effect3 of dep.keys()) {
    if (effect3._dirtyLevel < 4 /* Dirty */) {
      effect3._dirtyLevel = 4 /* Dirty */;
    }
    if (effect3.scheduler) {
      if (effect3._running == 0) {
        effect3.scheduler();
      }
    }
  }
}

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
var createDep = (cleanup, key) => {
  const dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  dep.name = key;
  return dep;
};
function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(
        key,
        dep = createDep(() => {
          depsMap.delete(key);
        }, key)
      );
    }
    trackEffect(activeEffect, dep);
  }
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
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
    let res = Reflect.get(target, key, receiver);
    if (isObject2(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    let result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return result;
  }
};

// packages/reactivity/src/reactive.ts
function isReactive(value) {
  return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
}
function isObject2(val) {
  return typeof val === "object" && val !== null;
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  if (!isObject2(target)) {
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
function toReactive(value) {
  return isObject2(value) ? reactive(value) : value;
}

// packages/reactivity/src/ref.ts
function isRef(r) {
  return !!(r && r.__v_isRef === true);
}
function ref(value) {
  return createRef(value);
}
function createRef(value) {
  return new RefImpl(value);
}
var RefImpl = class {
  // 用于收集对应的effect
  constructor(rawValue) {
    this.rawValue = rawValue;
    this.__v_isRef = true;
    this._value = toReactive(rawValue);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = newValue;
      triggerRefValue(this);
    }
  }
};
function trackRefValue(ref2) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      ref2.dep = ref2.dep || createDep(() => ref2.dep = void 0, "undefined")
    );
  }
}
function triggerRefValue(ref2) {
  let dep = ref2.dep;
  if (dep) {
    triggerEffects(dep);
  }
}
var ObjectRefImpl = class {
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
    this.__v_isRef = true;
  }
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
};
function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
function toRefs(object) {
  let res = {};
  for (let key in object) {
    res[key] = toRef(object, key);
  }
  return res;
}
function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      let v = Reflect.get(target, key, receiver);
      return v.__v_isRef ? v.value : v;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  });
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.setter = setter;
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      // 计算属性依赖的值会对计算属性effect进行收集
      () => triggerRefValue(this)
      // 计算属性依赖的值变化后会触发此函数 通知effect重新执行
    );
  }
  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();
      trackRefValue(this);
    } else {
      return this._value;
    }
    return this.effect.run();
  }
  set value(v) {
    this.setter(v);
  }
};
function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/reactivity/src/apiWatch.ts
function watch(source, callback, options = {}) {
  return doWatch(source, callback, options);
}
function traverse(source, depth, currentDepth = 0, seen = /* @__PURE__ */ new Set()) {
  if (typeof source !== "object" || source === null) {
    return source;
  }
  if (seen.has(source)) {
    return source;
  }
  seen.add(source);
  if (depth !== void 0 && currentDepth >= depth) {
    return source;
  }
  if (isReactive(source) || isRef(source)) {
    for (let key in source) {
      traverse(source[key], depth, currentDepth + 1, seen);
    }
  }
  return source;
}
function doWatch(source, callback, { deep = false, immediate = false } = {}) {
  let getter;
  if (typeof source === "function") {
    getter = source;
  } else if (isReactive(source)) {
    getter = () => traverse(source, deep ? void 0 : 1);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else {
    getter = () => source;
  }
  let oldValue;
  let clean;
  const onCleanup = (fn) => {
    clean = () => {
      fn();
      clean = void 0;
    };
  };
  const job = () => {
    const newValue = effect3.run();
    if (clean) {
      clean();
    }
    if (callback) {
      callback(newValue, oldValue, onCleanup);
      oldValue = newValue;
    }
  };
  const effect3 = new ReactiveEffect(getter, job);
  if (immediate) {
    job();
  }
  oldValue = effect3.run();
  const unwatch = () => {
    effect3.stop();
  };
  return unwatch;
}
function watchEffect(source, options) {
  return doWatch(source, null, options);
}

// packages/runtime-core/src/createVnode.ts
var Fragment = /* @__PURE__ */ Symbol("Fragment");
var Text = /* @__PURE__ */ Symbol("Text");
var Comment = /* @__PURE__ */ Symbol("Comment");
function isVnode(value) {
  return value.__v_isVnode === true;
}
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
function createVNode(type, props, children) {
  if (props) {
    let { class: klass, style } = props;
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass);
    }
  }
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
  return createBaseVNode(type, props, children, shapeFlag);
}
function createBaseVNode(type, props, children, shapeFlag) {
  const vnode = {
    __v_isVNode: true,
    //标识
    type,
    props,
    shapeFlag,
    key: props?.key || null
  };
  normalizeChildren(vnode, children);
  return vnode;
}
function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    type = 16 /* ARRAY_CHILDREN */;
  } else if (typeof children === "object") {
  } else if (isFunction(children)) {
  } else {
    children = String(children);
    type = 8 /* TEXT_CHILDREN */;
  }
  vnode.children = children;
  vnode.shapeFlag |= type;
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject2(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      } else {
        return createVNode(type, propsOrChildren);
      }
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

// packages/runtime-core/src/componentRenderUtils.ts
function renderComponentRoot(instance) {
  const { vnode, render: render2, data } = instance;
  let result;
  try {
    if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
      result = normalizeVNode(render2.call(data));
    }
  } catch (err) {
    console.error(err);
  }
  return result;
}
function normalizeVNode(child) {
  if (typeof child === "object") {
    return cloneIfMounted(child);
  }
}
function cloneIfMounted(child) {
  return child;
}

// packages/runtime-core/src/apiLifecycle.ts
function injectHook(type, hook, target) {
  if (target) {
    target[type] = hook;
    return hook;
  }
}
var createHook = (lifecycle) => {
  return (hook, target) => injectHook(lifecycle, hook, target);
};
var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
var onMounted = createHook("m" /* MOUNTED */);

// packages/runtime-core/src/component.ts
var uid = 0;
function createComponentInstance(vnode) {
  const type = vnode.type;
  const instance = {
    uid: uid++,
    // 唯一标记
    vnode,
    // 虚拟节点
    type,
    // 组件类型
    subTree: null,
    // render 函数的返回值
    effect: null,
    // ReactiveEffect 实例
    update: null,
    // update 函数，触发 effect.run
    render: null,
    // 组件内的 render 函数
    isMounted: false,
    // 是否挂载
    bc: null,
    // beforeCreate
    c: null,
    // created
    bm: null,
    // beforeMount
    m: null
    // mounted
  };
  return instance;
}
function applyOptions(instance) {
  const {
    data: dataOptions,
    beforeCreate,
    created,
    beforeMount,
    mounted
  } = instance.type;
  if (beforeCreate) {
    callHook(beforeCreate, instance.data);
  }
  if (dataOptions) {
    const data = dataOptions();
    if (isObject(data)) {
      instance.data = reactive(data);
    }
  }
  if (created) {
    callHook(created, instance.data);
  }
  function registerLifecycleHook(register, hook) {
    register(hook?.bind(instance.data), instance);
  }
  registerLifecycleHook(onBeforeMount, beforeMount);
  registerLifecycleHook(onMounted, mounted);
}
function callHook(hook, proxy) {
  hook.bind(proxy)();
}
function setupComponent(instance) {
  const setupResult = setupStatefulComponent(instance);
  return setupResult;
}
function setupStatefulComponent(instance) {
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}
function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult;
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
  const Component = instance.type;
  if (!instance.render) {
    instance.render = Component.render;
  }
  applyOptions(instance);
}

// packages/runtime-core/src/scheduler.ts
var isFlushPending = false;
var resolvedPromise = Promise.resolve();
var currentFlushPromise = null;
var pendingPreFlushCbs = [];
function queuePreFlushCb(cb) {
  queueCb(cb, pendingPreFlushCbs);
}
function queueCb(cb, pendingQueue) {
  pendingQueue.push(cb);
  queueFlush();
}
function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}
function flushJobs() {
  isFlushPending = false;
  flushPreFlushCbs();
}
function flushPreFlushCbs() {
  if (pendingPreFlushCbs.length) {
    let activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
    pendingPreFlushCbs.length = 0;
    for (let i = 0; i < activePreFlushCbs.length; i++) {
      activePreFlushCbs[i]();
    }
  }
}

// packages/runtime-core/src/render.ts
function createRenderer(rendererOptions2) {
  const {
    insert: hostInsert,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createComment: hostCreateComment
  } = rendererOptions2;
  const patchProps = (el, vnode, oldProps, newProps) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev) {
          hostPatchProp(el, key, prev, next);
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  };
  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountElement(newVNode, container, anchor);
    } else {
      patchElement(oldVNode, newVNode);
    }
  };
  const patchElement = (oldVNode, newVNode) => {
    const el = newVNode.el = oldVNode.el;
    const oldProps = oldVNode.props || EMPTY_OBJ;
    const newProps = newVNode.props || EMPTY_OBJ;
    patchChildren(oldVNode, newVNode, el, null);
    patchProps(el, newVNode, oldProps, newProps);
  };
  const patchChildren = (oldVNode, newVNode, container, anchor) => {
    const c1 = oldVNode && oldVNode.children;
    const prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0;
    const c2 = newVNode.children;
    const { shapeFlag } = newVNode;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          patchKeyedChildren(c1, c2, container, anchor);
        } else {
        }
      } else {
        if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(container, "");
        }
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        }
      }
    }
  };
  const processText = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      newVNode.el = hostCreateText(newVNode.children);
      hostInsert(newVNode.el, container, anchor);
    } else {
      const el = newVNode.el = oldVNode.el;
      if (newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children);
      }
    }
  };
  const processCommentNode = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      newVNode.el = hostCreateComment(newVNode.children || "");
      hostInsert(newVNode.el, container, anchor);
    } else {
      newVNode.el = oldVNode.el;
    }
  };
  const processFragment = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountChildren(newVNode.children, container);
    } else {
      patchChildren(oldVNode, newVNode, container, anchor);
    }
  };
  const processComponent = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountComponent(newVNode, container, anchor);
      console.log("\u6302\u8F7D\u7EC4\u4EF6", newVNode);
    }
  };
  const patchKeyedChildren = (oldChildren, newChildren, container, parentAnchor) => {
    let i = 0;
    const newChildrenLength = newChildren.length;
    let oldChildrenEnd = oldChildren.length - 1;
    let newChildrenEnd = newChildrenLength - 1;
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVNode = oldChildren[i];
      const newVNode = normalizeVNode(newChildren[i]);
      if (isSameVNodeType(oldVNode, newVNode)) {
        patch(oldVNode, newVNode, container, null);
      } else {
        break;
      }
      i++;
    }
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVNode = oldChildren[oldChildrenEnd];
      const newVNode = normalizeVNode(newChildren[newChildrenEnd]);
      if (isSameVNodeType(oldVNode, newVNode)) {
        patch(oldVNode, newVNode, container, null);
      } else {
        break;
      }
      oldChildrenEnd--;
      newChildrenEnd--;
    }
  };
  const mountComponent = (initialVNode, container, anchor) => {
    initialVNode.component = createComponentInstance(initialVNode);
    const instance = initialVNode.component;
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  };
  const setupRenderEffect = (instance, initialVNode, container, anchor) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { bm, m } = instance;
        if (bm) {
          bm();
        }
        const subTree = instance.subTree = renderComponentRoot(instance);
        patch(null, subTree, container, anchor);
        if (m) {
          m();
        }
        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        let { next, vnode } = instance;
        if (!next) {
          next = vnode;
        }
        const nextTree = renderComponentRoot(instance);
        const prevTree = instance.subTree;
        instance.subTree = nextTree;
        patch(prevTree, nextTree, container, anchor);
        next.el = nextTree.el;
      }
    };
    const effect3 = instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queuePreFlushCb(update)
    );
    const update = instance.update = () => effect3.run();
    update();
  };
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };
  const mountChildren = (children, container, anchor) => {
    if (isString(children)) {
      children = children.split("");
    }
    for (let i = 0; i < children.length; i++) {
      const child = children[i] = normalizeVNode(children[i]);
      patch(null, child, container, anchor);
    }
  };
  const mountElement = (vnode, container, anchor = null) => {
    const { type, children, props, shapeFlag } = vnode;
    const el = hostCreateElement(type);
    vnode.el = el;
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el, anchor);
    }
    hostInsert(el, container);
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    if (n1 == n2) {
      return;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      case Comment:
        processCommentNode(n1, n2, container, anchor);
        break;
      case Fragment:
        processFragment(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & 6 /* COMPONENT */) {
          processComponent(n1, n2, container, anchor);
        }
    }
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render: render2
  };
}

// packages/runtime-dom/src/index.ts
var rendererOptions = Object.assign({ patchProp }, nodeOps);
var renderer;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}
var render = (...args) => {
  ensureRenderer().render(...args);
};
export {
  Comment,
  EMPTY_OBJ,
  Fragment,
  ReactiveEffect,
  ShapeFlags,
  Text,
  activeEffect,
  cleanDepEffect,
  computed,
  createRenderer,
  createVNode,
  effect,
  h,
  isArray,
  isFunction,
  isObject2 as isObject,
  isReactive,
  isRef,
  isSameVNodeType,
  isString,
  isVNode,
  isVnode,
  normalizeChildren,
  normalizeClass,
  patchProp,
  proxyRefs,
  reactive,
  ref,
  render,
  rendererOptions,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  trackRefValue,
  triggerEffects,
  triggerRefValue,
  watch,
  watchEffect
};
//# sourceMappingURL=runtime-dom.esm.js.map
