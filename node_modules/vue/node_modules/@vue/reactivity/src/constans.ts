export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

// dirty 等级
export enum DirtyLevels {
  NotDirty = 0, // 不是脏值
  Dirty = 4, // 脏值
}
