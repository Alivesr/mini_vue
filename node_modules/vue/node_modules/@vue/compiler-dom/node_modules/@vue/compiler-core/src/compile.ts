import { baseParse } from "@vue/compiler-core";

export function baseCompile(template: string, options) {
  const ast = baseParse(template);
  console.log(JSON.stringify(ast));

  return {};
}
