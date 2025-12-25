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

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prevValue, nextValue) {
  let style = el.style;
  for (let key in nextValue) {
    style[key] = nextValue[key];
  }
  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue[key] == null) {
        style[key] = null;
      }
    }
  }
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
  } else {
    return patchAttr(el, key, nextValue);
  }
}

// packages/reactivity/src/reactive.ts
function isObject(val) {
  return typeof val === "object" && val !== null;
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
  } else if (isObject2(value)) {
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
function isObject2(val) {
  return typeof val === "object" && val !== null;
}
function isString(val) {
  return typeof val == "string";
}

// packages/runtime-core/src/createVnode.ts
var Fragment = /* @__PURE__ */ Symbol("Fragment");
var Text = /* @__PURE__ */ Symbol("Text");
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
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject2(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
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

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
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

// packages/runtime-core/src/render.ts
function createRenderer(rendererOptions2) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling
  } = rendererOptions2;
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  };
  const mountElement = (vnode, container) => {
    const { type, children, props, shapeFlag } = vnode;
    const el = hostCreateElement(type);
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
  const patch = (n1, n2, container) => {
    if (n1 == n2) {
      return;
    }
    if (n1 === null) {
      mountElement(n2, container);
    }
  };
  const render2 = (vnode, container) => {
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };
  return {
    render: render2
  };
}

// packages/runtime-dom/src/index.ts
var rendererOptions = Object.assign({ patchProp }, nodeOps);
var render = (vnode, container) => {
  return createRenderer(rendererOptions).render(vnode, container);
};
export {
  Comment,
  Fragment,
  Text,
  createRenderer,
  createVNode,
  h,
  isVNode,
  isVnode,
  normalizeChildren,
  render,
  rendererOptions
};
//# sourceMappingURL=runtime-dom.esm.js.map
