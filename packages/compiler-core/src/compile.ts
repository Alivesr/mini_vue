import { baseParse } from "packages/compiler-core/src/parse";

export function baseCompile(template: string, options) {
  const ast = baseParse(template);
  console.log(JSON.stringify(ast));

  return {};
}
