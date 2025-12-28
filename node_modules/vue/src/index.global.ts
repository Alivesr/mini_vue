// 专门用于 global/iife 构建的入口文件
// 使用相对路径导入，确保所有依赖被打包到一个文件中

export * from "../../reactivity/src/index";
export * from "../../runtime-core/src/index";
export * from "../../runtime-dom/src/index";
export { compile } from "../../compiler-dom/src/index";
export * from "../../shared/src/index";
