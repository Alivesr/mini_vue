import { activeEffect, trackEffect } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";
import { triggerEffects } from "./effect";

export function ref(value: any) {
  return createRef(value);
}
function createRef(value: any) {
  return new RefImpl(value);
}

class RefImpl {
  __v_isRef = true;
  _value: any;
  dep; // 用于收集对应的effect
  constructor(public rawValue: any) {
    this._value = toReactive(rawValue);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      // 如果新值和旧值不同
      this.rawValue = newValue; // 更新原始值
      this._value = newValue; // 更新响应式值
      triggerRefValue(this);
    }
  }
}

function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      (ref.dep = createDep(() => (ref.dep = undefined), "undefined"))
    );
  }
}

function triggerRefValue(ref) {
  let dep = ref.dep;
  if (dep) {
    triggerEffects(dep); // 触发dep中存放的effect
  }
}
