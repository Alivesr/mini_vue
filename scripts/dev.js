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

// 依赖关系配置：定义哪些包需要 external 哪些依赖
// 对于底层包（shared），不 external 任何东西
// 对于中间层包（reactivity, compiler-core），只 external shared
// 对于上层包（runtime-core, runtime-dom），external shared 和 reactivity
// 对于最终包（vue），external 所有内部依赖
const externalConfig = {
  shared: [], // 最底层，无依赖
  reactivity: ["@vue/shared"],
  "compiler-core": ["@vue/shared"],
  "compiler-dom": ["@vue/shared", "@vue/compiler-core"],
  "runtime-core": ["@vue/shared", "@vue/reactivity"],
  "runtime-dom": ["@vue/shared", "@vue/reactivity", "@vue/runtime-core"],
  vue: [
    "@vue/shared",
    "@vue/reactivity",
    "@vue/compiler-core",
    "@vue/compiler-dom",
    "@vue/runtime-core",
    "@vue/runtime-dom",
  ],
};

// esbuild 插件：自动解析 @vue/* 包到源文件
const vueAliasPlugin = {
  name: "vue-alias",
  setup(build) {
    const needsAlias =
      build.initialOptions.format === "iife" ||
      (build.initialOptions.format === "esm" && format === "esm-browser");
    if (!needsAlias) return;

    build.onResolve({ filter: /^@vue\// }, (args) => {
      const pkgName = args.path.split("/")[1]; // 例如从 "@vue/shared" 提取 "shared"
      return {
        path: resolve(__dirname, `../packages/${pkgName}/src/index.ts`),
      };
    });
  },
};

const buildOptions = {
  entryPoints: [entry], // 入口文件
  outfile: resolve(
    __dirname,
    `../packages/${target}/dist/${target}.${format}.js`
  ), // 输出文件
  bundle: true, // 打包 将所有依赖打包成一个文件
  external:
    format === "iife" || format === "esm-browser"
      ? []
      : externalConfig[target] || [], // global 和 esm-browser 格式不使用 external
  platform: "browser",
  sourcemap: true,
  format:
    format === "global" ? "iife" : format === "esm-browser" ? "esm" : format, // global 转为 iife, esm-browser 转为 esm
  globalName: pkg.buildOptions?.name,
  plugins: [vueAliasPlugin],
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
