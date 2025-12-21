const person = {
  name: "jw",
  get aliasName() {
    // 这个getter函数内部的this指向至关重要！
    return this.name + " handsome";
  },
};

const handler1 = {
  get(target, key, receiver) {
    console.log(`handler1 - 访问属性: ${key}`);
    // 写法A：使用 target[key]
    return target[key];
  },
};

const handler2 = {
  get(target, key, receiver) {
    console.log(`handler2 - 访问属性: ${key}`);
    // 写法B：使用 Reflect.get(target, key, receiver)
    return Reflect.get(target, key, receiver);
  },
};

const proxy1 = new Proxy(person, handler1);
const proxy2 = new Proxy(person, handler2);

console.log("=== 测试 proxy1 (使用 target[key]) ===");
console.log(proxy1.aliasName); // 输出什么？

console.log("\n=== 测试 proxy2 (使用 Reflect.get) ===");
console.log(proxy2.aliasName); // 输出什么？
