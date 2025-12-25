// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  //插入元素
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
  },
  //删除元素
  remove(el) {
    const parent = el.parentNode;
    if (parent) {
      parent.removeChild(el);
    }
  },
  //创建文本节点
  createText(text) {
    return document.createTextNode(text);
  },
  //创建元素节点
  createElement(type) {
    return document.createElement(type);
  },
  //设置文本节点
  setText(el, text) {
    el.textContent = text;
  },
  //创建注释节点
  createComment: (text) => document.createComment(text),
  //设置元素的文本内容
  setElementText(el, text) {
    el.textContent = text;
  },
  //获取父节点
  parentNode(el) {
    return el.parentNode;
  },
  //获取兄弟节点
  nextSibling(el) {
    return el.nextSibling;
  }
};

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}

// packages/shared/src/normalizeProp.ts
function normalizeClass(value) {
  let res = "";
  if (isString(value)) {
    res = value;
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}

// packages/shared/src/index.ts
function isFunction(val) {
  return typeof val === "function";
}
function isArray(val) {
  return Array.isArray(val);
}
function isObject(val) {
  return typeof val === "object" && val !== null;
}
function isString(val) {
  return typeof val == "string";
}
var EMPTY_OBJ = Object.freeze({});

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prevValue, nextValue) {
  let style = el.style;
  const isCssString = isString(nextValue);
  if (nextValue && !isCssString) {
    for (let key in nextValue) {
      setStyle(style, key, nextValue[key]);
    }
  }
  if (prevValue && !isCssString) {
    for (let key in prevValue) {
      if (nextValue[key] == null) {
        setStyle(style, key, "");
      }
    }
  }
}
function setStyle(style, key, value) {
  style[key] = value;
}

// packages/runtime-dom/src/modules/patchEvent.ts
function createInvoker(value) {
  const invoker = function(e) {
    invoker.value(e);
  };
  invoker.value = value;
  return invoker;
}
function patchEvent(el, name, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const eventName = name.slice(2).toLowerCase();
  const existingInvokers = invokers[name];
  if (nextValue && existingInvokers) {
    return existingInvokers.value = nextValue;
  }
  if (nextValue) {
    const invoker = invokers[name] = createInvoker(nextValue);
    el.addEventListener(eventName, invoker);
  }
  if (existingInvokers) {
    el.removeEventListener(eventName, existingInvokers);
    invokers[name] = void 0;
  }
}

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key);
  }
}

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, prevValue, nextValue);
  } else if (/on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else if (shouldSetAsProp(el, key)) {
    patchDOMProp(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
}
function shouldSetAsProp(el, key) {
  if (key === "form") {
    return false;
  }
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }
  return key in el;
}
function patchDOMProp(el, key, value) {
  try {
    el[key] = value;
  } catch (e) {
  }
}

// packages/reactivity/src/reactive.ts
function isObject2(val) {
  return typeof val === "object" && val !== null;
}

// packages/runtime-core/src/createVnode.ts
var Fragment = /* @__PURE__ */ Symbol("Fragment");
var Text2 = /* @__PURE__ */ Symbol("Text");
var Comment = /* @__PURE__ */ Symbol("Comment");
function isVnode(value) {
  return value.__v_isVnode === true;
}
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
function createVNode(type, props, children) {
  if (props) {
    let { class: klass, style } = props;
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass);
    }
  }
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
  return createBaseVNode(type, props, children, shapeFlag);
}
function createBaseVNode(type, props, children, shapeFlag) {
  const vnode = {
    __v_isVNode: true,
    //标识
    type,
    props,
    shapeFlag
  };
  normalizeChildren(vnode, children);
  return vnode;
}
function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    type = 16 /* ARRAY_CHILDREN */;
  } else if (typeof children === "object") {
  } else if (isFunction(children)) {
  } else {
    children = String(children);
    type = 8 /* TEXT_CHILDREN */;
  }
  vnode.children = children;
  vnode.shapeFlag |= type;
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject2(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      } else {
        return createVNode(type, propsOrChildren);
      }
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

// packages/runtime-core/src/componentRenderUtils.ts
function normalizeVNode(child) {
  if (typeof child === "object") {
    return cloneIfMounted(child);
  } else {
    return createVNode(Text, null, String(child));
  }
}
function cloneIfMounted(child) {
  return child;
}

// packages/runtime-core/src/render.ts
function createRenderer(rendererOptions2) {
  const {
    insert: hostInsert,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createComment: hostCreateComment
  } = rendererOptions2;
  const patchProps = (el, vnode, oldProps, newProps) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev) {
          hostPatchProp(el, key, prev, next);
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  };
  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      console.log("\u6302\u8F7D\u64CD\u4F5C", newVNode);
      mountElement(newVNode, container, anchor);
    } else {
      patchElement(oldVNode, newVNode);
    }
  };
  const patchElement = (oldVNode, newVNode) => {
    const el = newVNode.el = oldVNode.el;
    const oldProps = oldVNode.props || EMPTY_OBJ;
    const newProps = newVNode.props || EMPTY_OBJ;
    patchChildren(oldVNode, newVNode, el, null);
    patchProps(el, newVNode, oldProps, newProps);
  };
  const patchChildren = (oldVNode, newVNode, container, anchor) => {
    const c1 = oldVNode && oldVNode.children;
    const prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0;
    const c2 = newVNode.children;
    const { shapeFlag } = newVNode;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        } else {
        }
      } else {
        if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(container, "");
        }
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        }
      }
    }
  };
  const processText = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      newVNode.el = hostCreateText(newVNode.children);
      hostInsert(newVNode.el, container, anchor);
    } else {
      const el = newVNode.el = oldVNode.el;
      if (newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children);
      }
    }
  };
  const processCommentNode = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      newVNode.el = hostCreateComment(newVNode.children || "");
      hostInsert(newVNode.el, container, anchor);
    } else {
      newVNode.el = oldVNode.el;
    }
  };
  const processFragment = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountChildren(newVNode.children, container);
    } else {
      patchChildren(oldVNode, newVNode, container, anchor);
    }
  };
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };
  const mountChildren = (children, container, anchor) => {
    if (isString(children)) {
      children = children.split("");
    }
    for (let i = 0; i < children.length; i++) {
      const child = children[i] = normalizeVNode(children[i]);
      patch(null, child, container, anchor);
    }
  };
  const mountElement = (vnode, container, anchor = null) => {
    const { type, children, props, shapeFlag } = vnode;
    const el = hostCreateElement(type);
    vnode.el = el;
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el);
    }
    hostInsert(el, container);
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    if (n1 == n2) {
      return;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text2:
        processText(n1, n2, container, anchor);
        break;
      case Comment:
        processCommentNode(n1, n2, container, anchor);
        break;
      case Fragment:
        processFragment(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & 6 /* COMPONENT */) {
        }
    }
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render: render2
  };
}

// packages/runtime-dom/src/index.ts
var rendererOptions = Object.assign({ patchProp }, nodeOps);
var renderer;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}
var render = (...args) => {
  ensureRenderer().render(...args);
};
export {
  Comment,
  Fragment,
  Text2 as Text,
  createRenderer,
  createVNode,
  h,
  isSameVNodeType,
  isVNode,
  isVnode,
  normalizeChildren,
  patchProp,
  render,
  rendererOptions
};
//# sourceMappingURL=runtime-dom.esm.js.map
