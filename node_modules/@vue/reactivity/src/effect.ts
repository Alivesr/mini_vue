export function effect(fn, options?: any) {
  //创建一个响应式effect 数据变化后可以重新执行

  // 创建effect 只要数据变化了，就会重新执行
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run;
  });
  _effect.run();
}

export let activeEffect;

class ReactiveEffect {
  public active = true; // 创建的effect 是响应式的

  //fn 用户传入的函数
  //scheduler 调度器
  //如果fn中依赖的数据变化了，就重新调用run方法
  constructor(public fn: any, public scheduler?: any) {}

  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      return this.fn(); //
    } finally {
      activeEffect = lastEffect;
    }
  }
}
