import minimist from "minimist";
import esbuild from "esbuild";
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

const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));

const buildOptions = {
  entryPoints: [entry], // 入口文件
  outfile: resolve(
    __dirname,
    `../packages/${target}/dist/${target}.${format}.js`
  ), // 输出文件
  bundle: true, // 打包 将所有依赖打包成一个文件
  // 默认不 externalize，当构建特定包（如 reactivity/shared）时才保留其依赖。
  // 对于 runtime-dom，我们希望把 reactivity/shared 一并打包进去（不 external）。
  external: [
    // externalize @vue/reactivity 仅当构建的是 reactivity 本身
    ...(target === "reactivity"
      ? []
      : target === "runtime-dom"
      ? []
      : ["@vue/reactivity"]),
    // externalize @vue/shared 仅当构建的是 shared 本身
    ...(target === "shared"
      ? []
      : target === "runtime-dom"
      ? []
      : ["@vue/shared"]),
  ],
  platform: "browser",
  sourcemap: true,
  format,
  globalName: pkg.buildOptions.name,
};

if (args.once || args._.includes("once")) {
  // 一次性构建（便于捕获并显示错误），不启用 watch
  esbuild
    .build(buildOptions)
    .then(() => console.log("build finished"))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  esbuild.context(buildOptions).then((ctx) => {
    console.log("start build");
    ctx.watch(); // 监听文件变化
  });
}
