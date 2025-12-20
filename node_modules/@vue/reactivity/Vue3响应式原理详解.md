# Vue 3 响应式原理详解

## 目录

- [简介](#简介)
- [核心概念](#核心概念)
- [响应式系统实现](#响应式系统实现)
  - [reactive](#reactive)
  - [effect](#effect)
  - [ref](#ref)
  - [computed](#computed)
- [响应式系统工作流程](#响应式系统工作流程)
- [示例分析](#示例分析)
- [总结](#总结)

## 简介

Vue 3 的响应式系统是其核心特性之一，它允许我们自动跟踪 JavaScript 状态变化并在变化时高效地更新 DOM。本文档将详细解析 Vue 3 响应式系统的实现原理，帮助您理解其内部工作机制。

## 核心概念

Vue 3 响应式系统主要由以下几个核心概念组成：

1. **响应式对象（Reactive Objects）**：通过 `reactive()` 函数创建的对象，使用 Proxy 拦截对象的属性访问和修改。
2. **副作用（Effects）**：当响应式数据变化时需要执行的函数，通常用于更新 DOM。
3. **依赖收集（Dependency Tracking）**：跟踪哪些副作用依赖于哪些响应式数据。
4. **响应式引用（Refs）**：通过 `ref()` 函数创建的响应式基本类型值。
5. **计算属性（Computed Properties）**：基于其他响应式数据计算得出的响应式值。

## 响应式系统实现

### reactive

`reactive` 函数是创建响应式对象的核心，它使用 ES6 的 Proxy 来拦截对象的属性访问和修改操作。

```javascript
// 创建响应式对象
export function reactive(target) {
  return createReactiveObject(target);
}

function createReactiveObject(target) {
  // 如果目标不是对象，则直接返回
  if (!isObject(target)) {
    return target;
  }
  
  // 如果目标已经是响应式对象，则直接返回
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  
  // 如果目标已经有对应的代理对象，则返回缓存的代理对象
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }
  
  // 创建代理对象
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
```

`mutableHandlers` 是代理处理器，包含 `get` 和 `set` 拦截器：

```javascript
export const mutableHandlers = {
  get(target, key, receiver) {
    // 检查是否是响应式对象
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    
    // 依赖收集
    track(target, key);
    
    // 获取属性值
    const res = Reflect.get(target, key, receiver);
    
    // 如果属性值是对象，则递归创建响应式对象
    if (isObject(res)) {
      return reactive(res);
    }
    
    return res;
  },
  
  set(target, key, value, receiver) {
    const oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);
    
    // 如果值发生变化，则触发更新
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    
    return result;
  }
};
```

### effect

`effect` 函数用于创建副作用函数，当依赖的响应式数据变化时，副作用函数会重新执行。

```javascript
export function effect(fn, options) {
  // 创建响应式副作用
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  
  // 立即执行一次副作用函数
  _effect.run();
  
  // 应用选项
  if (options) {
    Object.assign(_effect, options);
  }
  
  // 返回可调用的函数
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
```

`ReactiveEffect` 类是副作用的核心实现：

```javascript
export class ReactiveEffect {
  _trackId = 0;
  public active = true;
  deps = [];
  _depsLength = 0;
  _running = 0;
  _dirtyLevel = DirtyLevels.Dirty;
  
  constructor(public fn, public scheduler) {}
  
  get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty;
  }
  
  set dirty(v) {
    this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NotDirty;
  }
  
  run() {
    this._dirtyLevel = DirtyLevels.NotDirty;
    
    if (!this.active) {
      return this.fn();
    }
    
    // 保存当前活动的副作用
    const lastEffect = activeEffect;
    
    try {
      // 设置当前活动的副作用
      activeEffect = this;
      
      // 清理旧的依赖
      preCleanEffect(this);
      this._running++;
      
      // 执行副作用函数
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
}
```

### ref

`ref` 函数用于创建响应式的基本类型值：

```javascript
export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  __v_isRef = true;
  _value;
  dep;
  
  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }
  
  get value() {
    trackRefValue(this);
    return this._value;
  }
  
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = toReactive(newValue);
      triggerRefValue(this);
    }
  }
}
```

### computed

`computed` 函数用于创建计算属性，它是基于其他响应式数据计算得出的响应式值：

```javascript
export function computed(getterOrOptions) {
  let getter;
  let setter;
  
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  
  return new ComputedRefImpl(getter, setter);
}

class ComputedRefImpl {
  public effect;
  public _value;
  public dep;
  
  constructor(getter, public setter) {
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => triggerRefValue(this)
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
}
```

## 响应式系统工作流程

Vue 3 响应式系统的工作流程可以概括为以下几个步骤：

1. **创建响应式数据**：
   - 使用 `reactive()` 创建响应式对象
   - 使用 `ref()` 创建响应式基本类型值
   - 使用 `computed()` 创建计算属性

2. **依赖收集**：
   - 当在 `effect` 中访问响应式数据的属性时，会调用 `track` 函数
   - `track` 函数会将当前活动的 `effect` 添加到该属性的依赖集合中

3. **触发更新**：
   - 当修改响应式数据的属性时，会调用 `trigger` 函数
   - `trigger` 函数会遍历该属性的依赖集合，执行所有相关的 `effect`

4. **清理依赖**：
   - 每次 `effect` 执行前会清理旧的依赖关系
   - 执行过程中会重新建立新的依赖关系

## 示例分析

让我们通过一个简单的例子来分析 Vue 3 响应式系统的工作流程：

```javascript
// 创建响应式对象
const state = reactive({
  count: 0
});

// 创建副作用
effect(() => {
  console.log('Count is:', state.count);
});

// 修改响应式数据
state.count++; // 会触发副作用函数重新执行，打印 "Count is: 1"
```

工作流程分析：

1. 调用 `reactive({count: 0})` 创建响应式对象 `state`
   - 创建一个 Proxy 对象，拦截对 `state` 的属性访问和修改

2. 调用 `effect(() => { console.log('Count is:', state.count); })`
   - 创建一个 `ReactiveEffect` 实例
   - 立即执行副作用函数
   - 在执行过程中，访问 `state.count`，触发 Proxy 的 `get` 拦截器
   - `get` 拦截器调用 `track(state, 'count')`，将当前 `effect` 添加到 `state.count` 的依赖集合中
   - 打印 "Count is: 0"

3. 执行 `state.count++`
   - 触发 Proxy 的 `set` 拦截器
   - `set` 拦截器调用 `trigger(state, 'count', 1, 0)`
   - `trigger` 函数遍历 `state.count` 的依赖集合，执行所有相关的 `effect`
   - 副作用函数重新执行，打印 "Count is: 1"

## 总结

Vue 3 的响应式系统基于 ES6 的 Proxy 实现，相比 Vue 2 基于 Object.defineProperty 的实现，具有以下优势：

1. **可以监听对象属性的添加和删除**：Vue 2 只能监听已存在的属性
2. **可以监听数组索引和长度的变化**：Vue 2 需要通过重写数组方法实现
3. **可以监听 Map、Set、WeakMap 和 WeakSet**：Vue 2 无法监听这些数据结构

Vue 3 响应式系统的核心是 `reactive`、`effect`、`ref` 和 `computed` 这几个 API，它们共同构成了一个强大而灵活的响应式编程模型。通过深入理解这些 API 的实现原理，我们可以更好地使用 Vue 3 进行开发，并在遇到问题时更容易排查和解决。
