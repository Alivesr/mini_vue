# Min-Vue2 Monorepo 使用指南

## 📦 项目结构

```
min-vue2/
├── packages/
│   ├── shared/              # 共享工具函数（最底层）
│   ├── reactivity/          # 响应式系统
│   ├── compiler-core/       # 编译器核心（模板编译）
│   ├── runtime-core/        # 运行时核心
│   ├── runtime-dom/         # DOM 运行时
│   └── vue/                 # 完整的 Vue 包
├── scripts/
│   └── dev.js              # 统一构建脚本
└── package.json            # 根配置
```

## 🔗 依赖关系

```
shared (无依赖)
  ├── reactivity
  ├── compiler-core
  └── runtime-core
      └── runtime-dom
          └── vue (完整包)
```

## 🚀 开发命令

### 1. 安装依赖

```bash
pnpm install
```

### 2. 开发模式（watch 模式）

```bash
# 开发特定包（自动监听文件变化）
pnpm dev:compiler        # 开发 compiler-core
pnpm dev:reactivity      # 开发 reactivity
pnpm dev:runtime-core    # 开发 runtime-core
pnpm dev:runtime-dom     # 开发 runtime-dom（默认）
pnpm dev:shared          # 开发 shared
pnpm dev:vue             # 开发完整 vue 包

# 或使用默认命令
pnpm dev                 # 默认开发 runtime-dom
```

### 3. 一次性构建

```bash
# 构建单个包
pnpm build:shared
pnpm build:reactivity
pnpm build:compiler
pnpm build:runtime-core
pnpm build:runtime-dom
pnpm build:vue

# 按依赖顺序构建所有包
pnpm build:all
```

## 📝 开发 Compiler 的步骤

### 1. 编写代码

在 [packages/compiler-core/src](packages/compiler-core/src) 中编写你的编译器代码：

- `parse.ts` - 模板解析器
- `compile.ts` - 编译主逻辑
- `index.ts` - 导出 API

### 2. 启动开发模式

```bash
pnpm dev:compiler
```

这会启动 watch 模式，每次保存文件都会自动重新构建。

### 3. 输出位置

构建产物在：`packages/compiler-core/dist/compiler-core.esm.js`

### 4. 在其他包中使用

由于使用了 `workspace:*` 协议，其他包可以直接导入：

```typescript
// 在 vue 包中使用 compiler-core
import { compile } from "@vue/compiler-core";
```

## 🔧 包配置说明

### package.json 字段解释

```json
{
  "name": "@vue/compiler-core", // 包名
  "version": "1.0.0",
  "module": "dist/compiler-core.esm-bundler.js", // ES 模块入口
  "types": "dist/compiler-core.d.ts", // TypeScript 类型定义
  "buildOptions": {
    "name": "VueCompilerCore", // 全局变量名（global 格式时使用）
    "formats": ["esm-bundler", "cjs"] // 支持的构建格式
  },
  "dependencies": {
    "@vue/shared": "workspace:*" // 内部依赖使用 workspace 协议
  }
}
```

### 依赖声明规则

- **`workspace:*`**: 表示依赖工作区内的包，pnpm 会自动链接
- 所有内部包依赖都必须在 `dependencies` 中显式声明
- 开发工具（如 esbuild, typescript）放在根目录的 `devDependencies`

## 🏗️ 构建原理

### dev.js 脚本

- 使用 **esbuild** 进行快速构建
- 支持 watch 模式和一次性构建
- 根据包的依赖关系自动配置 `external`

### External 配置策略

```javascript
shared: []                    // 无依赖
reactivity: ["@vue/shared"]   // external shared
compiler-core: ["@vue/shared"]
runtime-core: ["@vue/shared", "@vue/reactivity"]
runtime-dom: ["@vue/shared", "@vue/reactivity", "@vue/runtime-core"]
vue: [所有内部包]              // 最终包，external 所有内部依赖
```

这样设计确保：

- 底层包独立构建
- 上层包只打包自己的代码，依赖通过 import 引入
- 避免代码重复打包

## 🎯 最佳实践

### 1. 开发新功能时

```bash
# 1. 先构建依赖的底层包
pnpm build:shared

# 2. 启动要开发的包的 watch 模式
pnpm dev:compiler

# 3. 在另一个终端启动使用该包的上层包
pnpm dev:vue
```

### 2. 修改底层包时

如果修改了 `shared` 或 `reactivity`，需要重新构建依赖它们的包：

```bash
pnpm build:shared
pnpm build:reactivity
pnpm build:compiler  # 重新构建使用它们的包
```

### 3. 完整构建流程

```bash
pnpm build:all
```

这会按正确的依赖顺序构建所有包。

## 🐛 常见问题

### Q: 为什么找不到 `@vue/shared` 模块？

A: 需要先构建 `shared` 包：

```bash
pnpm build:shared
```

### Q: 修改了 shared 但其他包没更新？

A: 在 watch 模式下，需要重启 watch 或手动触发重新构建。

### Q: TypeScript 报错找不到类型？

A: 确保：

1. 运行了 `pnpm install`
2. 构建了相关包生成 `.d.ts` 文件
3. 检查 `tsconfig.json` 的 paths 配置

## 📚 下一步

现在你可以：

1. ✅ 在 `packages/compiler-core/src` 中编写编译器代码
2. ✅ 使用 `pnpm dev:compiler` 进行开发
3. ✅ 在 `packages/vue` 中整合 compiler
4. ✅ 编写测试和示例

祝开发顺利！🎉
