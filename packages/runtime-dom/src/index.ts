// export * from '@vue/shared'

import { nodeOps } from "./nodeOps";
import patchProp from "./patchProp"; // 默认导入
import { createRenderer } from "@vue/runtime-core";

// 将节点操作和属性操作合并
const rendererOptions = Object.assign({ patchProp }, nodeOps);

let renderer;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}

export const render = (...args) => {
  ensureRenderer().render(...args);
};

// 明确导出 patchProp
export { patchProp, rendererOptions };

export * from "@vue/runtime-core";

// 为了让页面可以直接从 runtime-dom 导入 reactive/shared，
// 重新导出这两个包的接口，保证运行时只加载一份实现。
export * from "@vue/reactivity";
export * from "@vue/shared";
// explicitly export isObject from @vue/reactivity to resolve naming conflict
export { isObject } from "@vue/reactivity";
