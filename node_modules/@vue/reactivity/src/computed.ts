import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { triggerRefValue } from "./ref";
import { trackRefValue } from "./ref";

//computed

class ComputedRefImpl {
  public effect;
  public _value;
  public dep;
  constructor(getter, public setter) {
    //我们需要创建一个effect用来收集依赖
    this.effect = new ReactiveEffect(
      () => getter(this._value), // 计算属性依赖的值会对计算属性effect进行收集

      () => triggerRefValue(this) // 计算属性依赖的值变化后会触发此函数 通知effect重新执行
    );
  }
  get value() {
    //这里我们需要判断一下effect是否是激活的
    if (this.effect.dirty) {
      //默认取值一定是脏的 所以第一次取值时 会执行effect.run()
      this._value = this.effect.run();

      //如果当前再effect中访问了计算属性，那么就需要将当前effect添加到计算属性的dep中
      trackRefValue(this);
    } else {
      // 如果不是脏值，那么直接返回缓存的值
      return this._value;
    }
    return this.effect.run();
  }
  set value(v) {
    this.setter(v);
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    // 如果传进来的只有getter，那么setter就是一个空函数
    getter = getterOrOptions;
    setter = () => {};
  } else {
    // 如果传进来的是一个对象，那么getter就是对象的get方法，setter就是对象的set方法
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
