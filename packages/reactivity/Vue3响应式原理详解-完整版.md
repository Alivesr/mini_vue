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
  - [详细流程解析](#详细流程解析)
- [示例分析](#示例分析)
  - [示例1：基本响应式对象](#示例1基本响应式对象)
  - [示例2：嵌套对象的响应式](#示例2嵌套对象的响应式)
  - [示例3：使用 ref 和 computed](#示例3使用-ref-和-computed)
  - [示例4：条件渲染中的依赖清理](#示例4条件渲染中的依赖清理)
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

### 详细流程解析

让我们深入了解响应式系统的工作流程：

#### 1. 依赖收集过程

当我们在 `effect` 中访问响应式对象的属性时，会发生以下步骤：

1. 访问属性触发 Proxy 的 `get` 拦截器
2. `get` 拦截器调用 `track(target, key)` 函数
3. `track` 函数首先检查是否有活动的 `effect`（即 `activeEffect`）
4. 如果有活动的 `effect`，则：
   - 获取或创建 `target` 对应的 `depsMap`（一个 Map 对象）
   - 获取或创建 `key` 对应的 `dep`（一个 Set 对象）
   - 调用 `trackEffect(activeEffect, dep)` 将当前 `effect` 添加到 `dep` 中

这样就建立了属性与 `effect` 之间的依赖关系。数据结构如下：

```
targetMap: WeakMap {
  target1: Map {
    key1: Set [effect1, effect2, ...],
    key2: Set [effect1, effect3, ...]
  },
  target2: Map {
    key1: Set [effect2, effect4, ...]
  }
}
```

#### 2. 触发更新过程

当我们修改响应式对象的属性时，会发生以下步骤：

1. 修改属性触发 Proxy 的 `set` 拦截器
2. `set` 拦截器调用 `trigger(target, key, newValue, oldValue)` 函数
3. `trigger` 函数获取 `target` 对应的 `depsMap`
4. 从 `depsMap` 中获取 `key` 对应的 `dep`
5. 调用 `triggerEffects(dep)` 遍历 `dep` 中的所有 `effect`
6. 对于每个 `effect`：
   - 如果 `effect` 有 `scheduler`，则调用 `scheduler`
   - 否则，调用 `effect.run()` 重新执行副作用函数

#### 3. 清理依赖过程

为了避免不必要的更新，Vue 3 在每次 `effect` 执行前会清理旧的依赖关系：

1. 执行 `effect.run()` 前，调用 `preCleanEffect(effect)`
2. `preCleanEffect` 重置 `effect._depsLength` 为 0，并增加 `effect._trackId`
3. 执行副作用函数，重新建立依赖关系
4. 执行完成后，调用 `postCleanEffect(effect)`
5. `postCleanEffect` 清理多余的依赖关系

这种机制确保了只有当前执行中实际访问的属性才会建立依赖关系，避免了不必要的更新。

## 示例分析

### 示例1：基本响应式对象

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

**详细工作流程分析**：

1. **创建响应式对象**：
   ```javascript
   const state = reactive({ count: 0 });
   ```
   - 调用 `reactive` 函数，传入原始对象 `{ count: 0 }`
   - `reactive` 函数调用 `createReactiveObject`
   - 检查 `target` 是否是对象，是否已经是响应式对象，是否已经有对应的代理对象
   - 创建一个新的 Proxy 对象，使用 `mutableHandlers` 作为处理器
   - 将原始对象和代理对象的映射存储在 `reactiveMap` 中
   - 返回代理对象

2. **创建并执行副作用**：
   ```javascript
   effect(() => { console.log('Count is:', state.count); });
   ```
   - 调用 `effect` 函数，传入回调函数
   - 创建一个 `ReactiveEffect` 实例 `_effect`
   - 调用 `_effect.run()` 立即执行副作用函数
   - 在 `run` 方法中：
     - 设置 `activeEffect` 为当前 `_effect`
     - 调用 `preCleanEffect` 清理旧的依赖
     - 执行用户传入的回调函数
     - 在回调函数中访问 `state.count`，触发 Proxy 的 `get` 拦截器
     - `get` 拦截器调用 `track(state, 'count')`
     - `track` 函数创建依赖关系：`targetMap -> state -> count -> Set([_effect])`
     - 打印 "Count is: 0"
     - 调用 `postCleanEffect` 清理多余的依赖
     - 恢复 `activeEffect` 为之前的值

3. **修改响应式数据并触发更新**：
   ```javascript
   state.count++;
   ```
   - 读取 `state.count` 的值，触发 `get` 拦截器
   - 修改 `state.count` 的值，触发 `set` 拦截器
   - `set` 拦截器检查新值是否与旧值不同
   - 调用 `trigger(state, 'count', 1, 0)`
   - `trigger` 函数获取 `state.count` 对应的依赖集合
   - 调用 `triggerEffects(dep)` 遍历依赖集合中的所有 `effect`
   - 对于每个 `effect`，检查是否有 `scheduler`
   - 如果有 `scheduler`，则调用 `scheduler`
   - 否则，调用 `effect.run()` 重新执行副作用函数
   - 副作用函数重新执行，打印 "Count is: 1"

### 示例2：嵌套对象的响应式

```javascript
const user = reactive({
  name: 'Zhang San',
  profile: {
    age: 25,
    address: {
      city: 'Beijing'
    }
  }
});

effect(() => {
  console.log(`${user.name} lives in ${user.profile.address.city}`);
});

// 修改嵌套属性
user.profile.address.city = 'Shanghai';
```

**详细工作流程分析**：

1. **创建嵌套响应式对象**：
   - 当我们创建 `user` 响应式对象时，只有顶层对象被转换为 Proxy
   - 当我们访问 `user.profile` 时，`get` 拦截器检测到返回值是对象，会调用 `reactive(res)` 将其转换为响应式对象
   - 同样，当访问 `user.profile.address` 时，也会被转换为响应式对象
   - 这种延迟转换的方式称为"惰性响应式"，只有在实际访问时才会创建 Proxy

2. **依赖收集过程**：
   - 执行 `effect` 回调函数时，会依次访问 `user.name`、`user.profile`、`user.profile.address` 和 `user.profile.address.city`
   - 每次访问都会触发相应的 `get` 拦截器，并调用 `track` 函数
   - 这样，当前 `effect` 就会被添加到这些属性的依赖集合中

3. **触发更新过程**：
   - 当我们修改 `user.profile.address.city` 时，会触发 `set` 拦截器
   - `set` 拦截器调用 `trigger(user.profile.address, 'city', 'Shanghai', 'Beijing')`
   - `trigger` 函数找到 `city` 属性对应的依赖集合，并触发其中的 `effect`
   - 副作用函数重新执行，打印更新后的信息

### 示例3：使用 ref 和 computed

```javascript
const count = ref(0);
const doubled = computed(() => count.value * 2);

effect(() => {
  console.log(`Count: ${count.value}, Doubled: ${doubled.value}`);
});

// 修改 ref 值
count.value++;
```

**详细工作流程分析**：

1. **创建 ref**：
   ```javascript
   const count = ref(0);
   ```
   - 调用 `ref(0)` 创建一个 `RefImpl` 实例
   - `RefImpl` 构造函数将原始值存储在 `rawValue` 属性中
   - 如果原始值是对象，会调用 `toReactive` 将其转换为响应式对象

2. **创建 computed**：
   ```javascript
   const doubled = computed(() => count.value * 2);
   ```
   - 调用 `computed` 函数，传入 getter 函数
   - 创建一个 `ComputedRefImpl` 实例
   - `ComputedRefImpl` 构造函数创建一个 `ReactiveEffect` 实例，将 getter 函数作为回调
   - 设置 scheduler 为触发计算属性的更新函数

3. **创建并执行副作用**：
   ```javascript
   effect(() => { console.log(`Count: ${count.value}, Doubled: ${doubled.value}`); });
   ```
   - 创建一个 `ReactiveEffect` 实例并执行
   - 在执行过程中：
     - 访问 `count.value`，触发 `RefImpl` 的 `get value()` 方法
     - `get value()` 方法调用 `trackRefValue(this)`，将当前 `effect` 添加到 `count` 的依赖集合中
     - 访问 `doubled.value`，触发 `ComputedRefImpl` 的 `get value()` 方法
     - 由于 `doubled.effect.dirty` 为 true，会执行 `doubled.effect.run()`，计算新值
     - 在计算过程中，访问 `count.value`，将 `doubled.effect` 添加到 `count` 的依赖集合中
     - 计算完成后，调用 `trackRefValue(this)`，将当前 `effect` 添加到 `doubled` 的依赖集合中
     - 打印 "Count: 0, Doubled: 0"

4. **修改 ref 值并触发更新**：
   ```javascript
   count.value++;
   ```
   - 调用 `RefImpl` 的 `set value()` 方法
   - 检查新值是否与旧值不同
   - 更新 `rawValue` 和 `_value`
   - 调用 `triggerRefValue(this)`
   - `triggerRefValue` 函数调用 `triggerEffects(ref.dep)`
   - 触发 `count` 的依赖集合中的所有 `effect`，包括 `doubled.effect` 和我们创建的 `effect`
   - `doubled.effect` 被触发，将 `doubled.effect.dirty` 设置为 true
   - 我们创建的 `effect` 重新执行
   - 在重新执行过程中，访问 `doubled.value`，由于 `doubled.effect.dirty` 为 true，会重新计算值
   - 打印 "Count: 1, Doubled: 2"

### 示例4：条件渲染中的依赖清理

```javascript
const state = reactive({
  showDetails: true,
  user: {
    name: 'Zhang San',
    age: 30
  }
});

effect(() => {
  console.log('Rendering...');
  if (state.showDetails) {
    console.log(`User details: ${state.user.name}, ${state.user.age}`);
  } else {
    console.log('No details shown');
  }
});

// 切换显示状态
state.showDetails = false;

// 修改用户信息（不应该触发更新）
state.user.age = 31;
```

**详细工作流程分析**：

1. **初始渲染**：
   - 执行 `effect` 回调函数
   - 访问 `state.showDetails`，将 `effect` 添加到 `showDetails` 的依赖集合中
   - 由于 `state.showDetails` 为 true，继续执行条件分支
   - 访问 `state.user.name` 和 `state.user.age`，将 `effect` 添加到这些属性的依赖集合中
   - 打印 "Rendering..." 和 "User details: Zhang San, 30"

2. **切换显示状态**：
   ```javascript
   state.showDetails = false;
   ```
   - 修改 `state.showDetails`，触发 `set` 拦截器
   - `set` 拦截器调用 `trigger(state, 'showDetails', false, true)`
   - `trigger` 函数找到 `showDetails` 属性对应的依赖集合，并触发其中的 `effect`
   - 副作用函数重新执行
   - 在重新执行过程中：
     - 调用 `preCleanEffect` 清理旧的依赖
     - 访问 `state.showDetails`，将 `effect` 添加到 `showDetails` 的依赖集合中
     - 由于 `state.showDetails` 为 false，不执行条件分支内的代码
     - 这意味着 `effect` 不再依赖 `state.user.name` 和 `state.user.age`
     - 调用 `postCleanEffect` 清理多余的依赖，从 `state.user.name` 和 `state.user.age` 的依赖集合中移除 `effect`
     - 打印 "Rendering..." 和 "No details shown"

3. **修改用户信息**：
   ```javascript
   state.user.age = 31;
   ```
   - 修改 `state.user.age`，触发 `set` 拦截器
   - `set` 拦截器调用 `trigger(state.user, 'age', 31, 30)`
   - `trigger` 函数找到 `age` 属性对应的依赖集合
   - 由于 `effect` 已经从 `age` 的依赖集合中移除，所以不会触发 `effect` 重新执行
   - 这就是依赖清理的作用，避免了不必要的更新

## 总结

Vue 3 的响应式系统基于 ES6 的 Proxy 实现，相比 Vue 2 基于 Object.defineProperty 的实现，具有以下优势：

1. **可以监听对象属性的添加和删除**：Vue 2 只能监听已存在的属性
2. **可以监听数组索引和长度的变化**：Vue 2 需要通过重写数组方法实现
3. **可以监听 Map、Set、WeakMap 和 WeakSet**：Vue 2 无法监听这些数据结构
4. **更高效的依赖收集和清理机制**：Vue 3 通过 `trackId` 和依赖清理机制，避免了不必要的更新

Vue 3 响应式系统的核心是 `reactive`、`effect`、`ref` 和 `computed` 这几个 API，它们共同构成了一个强大而灵活的响应式编程模型。通过深入理解这些 API 的实现原理，我们可以更好地使用 Vue 3 进行开发，并在遇到问题时更容易排查和解决。
