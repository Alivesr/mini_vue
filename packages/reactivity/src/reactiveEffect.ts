import { activeEffect, effect } from "./effect";

export function track(target, key) {
  //activeEffect 有这个属性，说明当前正在执行的effect

  if (activeEffect) {
    console.log(key, activeEffect);
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
