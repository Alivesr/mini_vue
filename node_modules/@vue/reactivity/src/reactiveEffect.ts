import { activeEffect, effect } from "./effect";
import { trackEffect } from "./effect";
import { triggerEffects } from "./effect";
const targetMap = new WeakMap()

export const createDep = (cleanup,key) => {
  const dep = new Map() as any
  dep.cleanup = cleanup
  dep.name= key
  return dep
}

export function track(target, key) {
  //activeEffect 有这个属性，说明当前正在执行的effect

  if (activeEffect) {
    // console.log(key, activeEffect);
    let depsMap=targetMap.get(target)
    if(!depsMap){
      //新增的
      targetMap.set(target,(depsMap= new Map()))
      //这里的targetMap的key是第一层对象
      //例如 {name:'jw',age:30} 这个对象，targetMap 就会有一个键值对 {name:'jw',age:30} => new Map()
    }
    let dep=depsMap.get(key)
    if(!dep){
      //后面可以用于清理属性
      depsMap.set(key,dep = createDep(()=>{
        depsMap.delete(key)
      },key))
    }
    // console.log(targetMap)
    // console.log(depsMap);
    // console.log(dep)

    trackEffect(activeEffect,dep) //将当前的effect 放到dep中,后续可以根据值的变化触发此dep中存放的effect
    // console.log(targetMap);
  }
}

export function trigger(target, key,newValue,oldValue) {
  // console.log(target, key,newValue,oldValue);
  const depsMap = targetMap.get(target)
  if(!depsMap){
    return
  }
  let dep = depsMap.get(key)
  if(dep){
    triggerEffects(dep)
  }
}



//
// {
//  {name:'jw',age:30} :{
//    age:{
//     effect ,effect
//    },
//    name:{
//     effect ,effect
//    }
//  }
// }
