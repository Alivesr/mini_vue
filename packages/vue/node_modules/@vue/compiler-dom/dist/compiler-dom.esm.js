// packages/compiler-core/src/parse.ts
function baseParse(content) {
  const context = createParserContext(content);
  console.log(context);
  return {};
}
function createParserContext(content) {
  return {
    source: content
  };
}

// packages/compiler-core/src/compile.ts
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
