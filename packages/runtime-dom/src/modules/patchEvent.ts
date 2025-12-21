function createInvoker(value) {
  const invoker = function (e) {
    invoker.value(e); //通过更改invoker.value来实现事件的更新
  };
  invoker.value = value;
  return invoker;
}

export default function patchEvent(el, name, nextValue) {
  //事件 el.addEventListener('click',fn)
  //vue3中事件的调用
  const invokers = el._vei || (el._vei = {});
  const eventName = name.slice(2).toLowerCase();

  const existingInvokers = invokers[name]; //是否存在同名的事件绑定

  //同名事件换绑 假如将hander1换绑为hander2 之前existingInvoker.value = handler1
  //如果存在同名的事件绑定，直接更新value
  if (nextValue && existingInvokers) {
    return (existingInvokers.value = nextValue);
  }

  if (nextValue) {
    // // 1. 首先创建 invoker 函数
    // const newInvoker = createInvoker(nextValue);

    // // 2. 将这个函数赋值给 invokers 对象的 name 属性
    // invokers[name] = newInvoker;

    // // 3. 同时将这个函数赋值给 invoker 常量
    // const invoker = newInvoker;

    //invokers是事件的缓存 而invoker是事件的调用函数
    const invoker = (invokers[name] = createInvoker(nextValue)); // 创建一个调用函数,并且内部会执行nextValue
    el.addEventListener(eventName, invoker);
  }

  //如果没传入nextValue，说明要删除事件
  if (existingInvokers) {
    el.removeEventListener(eventName, existingInvokers);
    invokers[name] = undefined;
  }
}
