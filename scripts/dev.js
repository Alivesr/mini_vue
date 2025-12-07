import minimist from "minimist";
import { resolve, dirname } from "path"; // 路径处理 用于将相对路径转换为绝对路径
import { fileURLToPath } from "url"; // URL处理 用于将URL转换为文件路径
import { createRequire } from "module";

// 获取当前文件的绝对路径
console.log(import.meta.url); // 输出: file://D:/code/min-vue2/scripts/dev.js

const __filename = fileURLToPath(import.meta.url); //fileURLToPath 将URL转换为文件路径

// console.log(__filename); // 输出: D:\code\min-vue2\scripts\dev.js

const __dirname = dirname(__filename); // 获取当前文件的目录路径
// console.log(__dirname); // 输出: D:\code\min-vue2\scripts

const require = createRequire(import.meta.url); // 创建一个require函数
// console.log(require); // 输出: [Function: createRequire]

//process.argv 是Node.js中的一个数组，它包含了启动Node.js进程时传入的命令行参数。
// 第一个元素是Node.js的执行路径，第二个元素是当前脚本的文件路径，第三个元素是传递给脚本的参数。
// [
//   "C:\\nvm4w\\nodejs\\node.exe",
//   "D:\\code\\min-vue2\\scripts\\dev.js",
//   "reactivity",
// ];

// const args = process.argv.slice(2);
// console.log(args);
// 输出: [ 'reactivity' ]

const args = minimist(process.argv.slice(2));
// 获取目标
const target = args._[0] || "reactivity"; // reactivity
// 获取格式
const format = args.f || "esm"; // esm

console.log(target, format); // reactivity esm

// 入口文件 根据目标和格式生成入口文件路径
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);

esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile: resolve(__dirname, `../packages/dist/${target}.${format}.js`), // 输出文件
    bundle: true, // 打包 将所有依赖打包成一个文件
    platform: "browser", // 平台 浏览器
    sourcemap: true, // 源码映射 生成sourcemap文件
    format, // 格式 输出格式
  })
  .then((ctx) => {
    ctx.watch(); // 监听文件变化
  });
