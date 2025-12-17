export function effect(fn, options?: any) {
  //创建一个响应式effect 数据变化后可以重新执行

  // 创建effect 只要数据变化了，就会重新执行
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
}

export let activeEffect;

class ReactiveEffect {
  _trackId = 0; //用于标识当前effect执行了几次
  public active = true; // 创建的effect 是响应式的
  deps=[] //用于存放当前effect 依赖的dep
  _depsLength=0 //用于记录当前effect 依赖的dep的数量

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
      return this.fn(); // 执行用户传入的函数
    } finally {
      activeEffect = lastEffect;
    }
  }
}


export function trackEffect(effect, dep) {
  dep.set(effect, effect._trackId);
  effect.deps[effect._depsLength++]=dep

}


export function triggerEffects(dep) {
  for(const effect of dep.keys()){
    if(effect.scheduler){
      effect.scheduler() // effect.run
    }
  }
}