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

// runtime-dom -> runtime-core -> reactivity
