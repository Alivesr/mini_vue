// packages/compiler-core/src/compile.ts
function baseCompile(template, options) {
  const ast = baseParse(template);
  console.log(JSON.stringify(ast));
  return {};
}

// packages/compiler-core/src/parse.ts
function baseParse(content) {
  const context = createParserContext(content);
  const children = parseChildren(context, []);
  console.log(children);
  return {};
}
function createParserContext(content) {
  return {
    source: content
  };
}
function parseChildren(context, ancestors) {
  const nodes = [];
  while (!isEnd(context, ancestors)) {
    const s = context.source;
    let node;
    if (startsWith(s, "{{")) {
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }
    if (!node) {
      node = parseText(context);
    }
    pushNode(nodes, node);
  }
  return nodes;
}
function startsWith(source, searchString) {
  return source.startsWith(searchString);
}
function isEnd(context, ancestors) {
  const s = context.source;
  if (startsWith(s, "</")) {
    for (let i = ancestors.length - 1; i >= 0; --i) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true;
      }
    }
  }
  return !s;
}
function startsWithEndTagOpen(source, tag) {
  return startsWith(source, "</") && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() && /[\t\r\n\f />]/.test(source[2 + tag.length] || ">");
}
function pushNode(nodes, node) {
  nodes.push(node);
}
function parseElement(context, ancestors) {
  const element = parseTag(context, 0 /* Start */);
  ancestors.push(element);
  const children = parseChildren(context, ancestors);
  ancestors.pop();
  element.children = children;
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, 1 /* End */);
  }
  return element;
}
function parseTag(context, type) {
  const match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  let isSelfClosing = startsWith(context.source, "/>");
  advanceBy(context, isSelfClosing ? 2 : 1);
  let tagType = 0 /* ELEMENT */;
  return {
    type: 1 /* ELEMENT */,
    tag,
    tagType,
    // 属性，目前我们没有做任何处理。但是需要添加上，否则，生成的 ats 放到 vue 源码中会抛出错误
    props: []
  };
}
function advanceBy(context, numberOfCharacters) {
  const { source } = context;
  context.source = source.slice(numberOfCharacters);
}
function parseText(context) {
  const endTokens = ["<", "{{"];
  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  const content = parseTextData(context, endIndex);
  return {
    type: 2 /* TEXT */,
    content
  };
}
function parseTextData(context, length) {
  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  return rawText;
}
export {
  baseCompile,
  baseParse
};
//# sourceMappingURL=compiler-core.esm.js.map
