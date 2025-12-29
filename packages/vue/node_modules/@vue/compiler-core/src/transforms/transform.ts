import { NodeTypes } from "../ast";
import { isSingleElementRoot } from "../hoiststatic";

/**
 * transform 上下文对象
 */
export interface TransformContext {
  /**
   * AST 根节点
   */
  root;
  /**
   * 每次转化时记录的父节点
   */
  parent: ParentNode | null;
  /**
   * 每次转化时记录的子节点索引
   */
  childIndex: number;
  /**
   * 当前处理的节点
   */
  currentNode;
  /**
   * 协助创建 JavaScript AST 属性 helpers，该属性是一个 Map，key 值为 Symbol(方法名)，表示 render 函数中创建 节点 的方法
   */
  helpers: Map<symbol, number>;
  helper<T extends symbol>(name: T): T;
  /**
   * 转化方法集合
   */
  nodeTransforms: any[];
}

/**
 * 创建 transform 上下文
 */
export function createTransformContext(
  root,
  { nodeTransforms = [] }
): TransformContext {
  const context: TransformContext = {
    // options
    nodeTransforms,

    // state
    root,
    helpers: new Map(),
    currentNode: root,
    parent: null,
    childIndex: 0,

    // methods
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
  };

  return context;
}

/**
 * 遍历转化节点，转化的过程一定要是深度优先的（即：孙 -> 子 -> 父），因为当前节点的状态往往需要根据子节点的情况来确定。
 * 转化的过程分为两个阶段：
 * 1. 进入阶段：存储所有节点的转化函数到 exitFns 中
 * 2. 退出阶段：执行 exitFns 中缓存的转化函数，且一定是倒叙的。因为只有这样才能保证整个处理过程是深度优先的
 */
export function traverseNode(node, context: TransformContext) {
  // 通过上下文记录当前正在处理的 node 节点
  context.currentNode = node;
  // 获取当前所有 node 节点的 transform 方法
  const { nodeTransforms } = context;
  // 存储转化函数的数组
  const exitFns: any = [];
  // 循环获取节点的 transform 方法，缓存到 exitFns 中
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context);
    if (onExit) {
      exitFns.push(onExit);
    }
  }

  // 继续转化子节点
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context);
      break;
  }

  // 在退出时执行 transform
  context.currentNode = node;
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

/**
 * 循环处理子节点
 */
export function traverseChildren(parent, context: TransformContext) {
  parent.children.forEach((node, index) => {
    context.parent = parent;
    context.childIndex = index;
    traverseNode(node, context);
  });
}

/**
 * 根据 AST 生成 JavaScript AST
 * @param root AST
 * @param options 配置对象
 */
export function transform(root, options) {
  // 创建 transform 上下文
  const context = createTransformContext(root, options);
  // 按照深度优先依次处理 node 节点转化
  traverseNode(root, context);
  createRootCodegen(root);
  root.helpers = [...context.helpers.keys()];
  root.components = [];
  root.directives = [];
  root.imports = [];
  root.hoists = [];
  root.temps = [];
  root.cached = [];
}

/**
 * 生成 root 节点下的 codegen
 */
function createRootCodegen(root) {
  const { children } = root;

  // 仅支持一个根节点的处理
  if (children.length === 1) {
    // 获取单个根节点
    const child = children[0];
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      const codegenNode = child.codegenNode;
      root.codegenNode = codegenNode;
    }
  }
}
