import { baseParse } from "@vue/compiler-core";
import { transform } from "./transforms/transform";
import { transformElement } from "./transforms/transformElement";
import { transformText } from "./transforms/transformText";

export function baseCompile(template: string, options) {
  const ast = baseParse(template);

  transform(
    ast,
    extend(options, {
      nodeTransforms: [transformElement, transformText],
    })
  );
  console.log(JSON.stringify(ast));

  return {};
}
