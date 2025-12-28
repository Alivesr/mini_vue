// packages/compiler-core/src/compile.ts
import { baseParse } from "@vue/compiler-core";
function baseCompile(template, options) {
  const ast = baseParse(template);
  console.log(JSON.stringify(ast));
  return {};
}

// packages/compiler-dom/src/index.ts
function compile(template, options) {
  return baseCompile(template, options);
}
export {
  compile
};
//# sourceMappingURL=compiler-dom.esm.js.map
