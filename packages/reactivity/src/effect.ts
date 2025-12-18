export function effect(fn, options?: any) {
  //创建一个响应式effect 数据变化后可以重新执行

  // 创建effect 只要数据变化了，就会重新执行
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();

  if (options) {
    Object.assign(_effect, options);
  }

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner; //外界可以调用runner 来手动触发effect
}

export let activeEffect;

//用于清空当前effect 依赖的dep
function preCleanEffect(effect) {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行id都是+1,如果id相同,说明是同一个effect
}

// 清理当前effect剩余的dep
function postCleanEffect(effect) {
  for (let i = effect._depsLength; i < effect.deps.length; i++) {
    cleanDepEffect(effect.deps[i], effect); //删除多余dep中的effect
  }
  effect.deps.length = effect._depsLength;
}

class ReactiveEffect {
  _trackId = 0; //用于标识当前effect执行了几次
  public active = true; // 创建的effect 是响应式的
  deps = []; //用于存放当前effect 依赖的dep
  _depsLength = 0; //用于记录当前effect 依赖的dep的数量
  _running = 0;

  //fn 用户传入的函数
  //scheduler 调度器
  //如果fn中依赖的数据变化了，就重新调用run方法
  constructor(public fn: any, public scheduler?: any) {}

  run() {
    if (!this.active) {
      return this.fn();
    }
    // 记录当前的effect 用于嵌套 调用
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      //每次执行都要将上一次的依赖进行清空
      preCleanEffect(this);
      this._running++;
      return this.fn(); // 执行用户传入的函数
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
}

// 清理dep 中的effect
export function cleanDepEffect(dep, effect) {
  //清理dep中存放的effect
  dep.delete(effect);
  //如果dep中没有effect了,就调用cleanup方法,清理dep本身
  if (dep.size == 0) {
    dep.cleanup();
  }
}

export function trackEffect(effect, dep) {
  //需要重新记录effect的id,因为每次执行effect都要将上一次的依赖进行清空

  // 在effect中存deps主要是为了清理 在dep是中存effect主要是为了触发
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId);
    //这里每次是从零开始记录依赖的dep,如果dep 已经存在,说明是同一个dep,就不需要记录了
    let oldDeps = effect.deps[effect._depsLength];
    if (oldDeps !== dep) {
      if (oldDeps) {
        cleanDepEffect(oldDeps, effect);
      }
      effect.deps[effect._depsLength++] = dep;
      //只替换的话 并没有清理dep中的effect 还会重新触发
    } else {
      effect._depsLength++;
    }
  }

  // if(effect._trackId !== dep.get(effect)){
  //   dep.set(effect, effect._trackId);
  //   effect.deps[effect._depsLength++]=dep
  // }
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect.scheduler) {
      //如果effect 正在执行中,就不触发 预防死循环
      if (effect._running == 0) {
        effect.scheduler(); // effect.run
      }
    }
  }
}
