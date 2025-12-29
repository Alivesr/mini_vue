import { baseParse } from "@vue/compiler-core";
import { transform } from "./transforms/transform";
import { transformElement } from "./transforms/transformElement";
import { transformText } from "./transforms/transformText";
import { extend } from "@vue/shared";

export function baseCompile(template: string, options = {}) {
  const ast = baseParse(template);

  transform(
    ast,
    extend(options, {
      nodeTransforms: [transformElement, transformText],
    })
  );
  console.log(JSON.stringify(ast));

  // TODO: 实现代码生成，将 AST 转换为真正的 render 函数
  // 目前返回一个占位函数避免报错
  return function render() {
    console.warn("baseCompile: 代码生成功能尚未实现");
    return null;
  };
}
