# PinMe - 开发日志 (DevLog)

本文档记录 **PinMe**（DeepSeek Harness 快捷模型与思考强度收藏插件）的设计决策、开发历程、关键技术攻坚与版本演进。

---

## 2026-09-26 | v0.1.0 初始版本设计、研发与首发上线

### 1. 需求背景与痛点分析
- **原生痛点**：在 DeepSeek Harness (DSH) 原生客户端中，切换模型与思考强度需要展开多级菜单（`Trigger` -> `Root Pane` -> `Model List` -> `Effort List`），每次切换至少需要 3~4 次点击，高频切换常用组合时极其繁琐。
- **目标 UX（对齐用户示意图）**：
  - **图 1（快捷标签直达）**：在输入框工具栏的模型选择器旁，水平展示已收藏模型组合的胶囊药丸标签（Pills），单次点击直接秒切（模型 + 思考强度）。
  - **图 2（心形收藏交互）**：在模型选择器的思考强度（Low / Medium / High）以及模型列表项后方，增加心形收藏图标（♡ / ♥），随时自由收藏或取消。

---

### 2. 生态调研结果
- 检索了 GitHub `dsh-plugin` 生态及社区插件集合（如 `awesome-dsh-plugins`、`dsh-market` 等）：
  - `dsh-model-filter`：仅增加了下拉框过滤搜索框。
  - `dsh-plugin-model-icons`：仅美化了各供应商的品牌 Logo。
  - `dsh-session-favorites`：收藏的是聊天会话（Session），而非模型配置。
- **结论**：DSH 社区内尚无类似功能插件，PinMe 填补了该交互场景的生态空白。

---

### 3. 技术选型与架构设计
- **技术路线**：选择方案 1（基于 DSH Slot 插槽覆盖增强），无侵入式接入，无需修改 DSH 源码。
- **工程目录与文件分工**：
  - `E:\PinMe\src\index.ts`：Host 进程（Node.js 端空 apply 声明）。
  - `E:\PinMe\src\client\types.ts`：数据类型定义（`ModelFavorite`、`ModelSelection`）。
  - `E:\PinMe\src\client\storage.ts`：LocalStorage 响应式读写与跨窗口广播机制（`useSyncExternalStore`）。
  - `E:\PinMe\src\client\HeartButton.tsx`：心形收藏交互组件（支持空心与实心动画）。
  - `E:\PinMe\src\client\FavoriteTags.tsx`：快捷直达胶囊栏（当前选中高亮、悬停删除 ×、空状态引导）。
  - `E:\PinMe\src\client\PinMeSelect.tsx`：集成标签栏与改造后菜单的完整模型选择组件。
  - `E:\PinMe\src\client\styles.ts`：内联 CSS 动态注入（零 CSS Loader 依赖）。
  - `E:\PinMe\build.js`：基于 `esbuild` 的定制化构建打包流水线。
  - `E:\PinMe\cordis.yml`：开发测试补丁配置。

---

### 4. 关键技术攻坚与踩坑记录 (Deep Debugging)

#### 踩坑 1：DSH Combo Bundle 打包规范与 `__ModuleLoader__` 契约
- **现象**：浏览器控制台报错：
  ```text
  failed to import loader entry 4d460e55 (@deepseek-ai/dsh-client-hmr): client-modules: bundle ... loaded without registering "@deepseek-ai/dsh-client-hmr" via __ModuleLoader__.load
  ```
- **排查**：DSH 客户端采用合并请求（Combo Bundle）把所有插件脚本拼接执行。DSH 强制要求所有前端模块必须输出为 `window.__ModuleLoader__.load({ id: string, factory: (require) => ... })` 格式。纯 `tsc` 输出的未打包 ES 模块带有原生 `import`/`export` 语句，直接引发浏览器非模块脚本语法解析中断，导致其后所有核心模块未被注册。
- **解决**：编写 `build.js`，引入 `esbuild` 打包并将产物包裹在 DSH 标准的 `window.__ModuleLoader__.load` 闭包中，将 `react`、`@deepseek-ai/*` 等标记为 external。

#### 踩坑 2：`require("clsx") missed the module table`
- **现象**：运行时报错：
  ```text
  client-modules: require("clsx") missed the module table — not a platform seed word, not a materialized module...
  ```
- **排查**：深入分析 `dsh-client-modules/lib/client.js` 源码发现，DSH 浏览器的 `makeRequire` 仅维护平台预埋模块表（`staticModules` / seed words）。外部第三方 npm 库（如 `clsx`）不在模块表中，必须完全打包进文件内部，不能留给客户端 `require`。
- **解决**：编写内置零依赖的 `src/client/clsx.ts`，并在 `build.js` 的 external 列表中彻底移除 `clsx`。

#### 踩坑 3：插槽优先级遮蔽与初始空白态
- **现象**：DSH 启动成功且无任何报错，但界面依然显示原版模型选择器，看不到 PinMe 组件。
- **排查**：
  1. 查阅 `@deepseek-ai/dsh-client-ui-slots` 的 `SlotCore.prototype.register` 源码：
     ```typescript
     const priority = options.priority ?? 0
     // single-kind: lowest renders
     rec.entries.sort((a, b) => (a.options.priority ?? 0) - (b.options.priority ?? 0))
     ```
     DSH 原生模型选择器默认以 `priority: 0` 注册在 `conversation.input.model` 插槽上。当 PinMe 未声明 priority（默认 0）时，触发了 single 槽位的唯一性冲突，被 DSH 槽位系统丢弃。
  2. 初始状态下本地 `localStorage` 无数据，`FavoriteTags` 在列表为空时直接返回了 `null`，视觉上缺少占位。
- **解决**：
  1. 在 `src/client/index.ts` 的插槽注册中显式声明 **`priority: -100`**（比官方的 0 更低，按规则获得绝对优先渲染权）。
  2. 在 `FavoriteTags.tsx` 中增加空白态引导胶囊：`[♡ 点击菜单 ♡ 收藏预设]`，未收藏时常驻提示，且点击直接唤起菜单。
  3. 调整菜单弹出定位（`Math.max(10, rect.right - 260)`），防止右侧超出视口。

---

### 5. 验证与交付状态
- **本地编译**：`npm run build` 耗时 ~1.8s，输出合规的 `lib/client.js`。
- **Combo 测试**：模拟浏览器带 Token 请求，Combo Bundle 响应状态 200 OK，体积 ~11.1MB，语法检验 100% 通过。
- **服务启动**：DSH Web（带 Patch 覆盖层）在端口 3080 正常以守护进程启动运行。
- **远程仓库**：代码已完整提交并推送到 GitHub 仓库：
  - Repo: `https://github.com/bruceyork00-a11y/PinMe`
  - Commits:
    - `910551d`: feat: initial commit for PinMe DSH model favorites plugin
    - `1d1a606`: fix: update dsh.client configuration format
    - `cfa75bc`: fix: bundle client as DSH ModuleLoader factory format
    - `94a5e81`: fix: replace external clsx with zero-dependency inline helper
    - `0bae0db`: fix: set slot registration priority to -100 to shadow built-in model selector and add guide pill

---

## 2026-09-26 | v0.1.1 线上排障与交互精简

### 1. 现象
在真实 DSH 环境启动后模型选择器区域不可用：`conversation.input.model` 插槽条目崩溃，控制台报
`Error: cannot get property "remote.session" without inject`。

### 2. 根因一：注入依赖不完整（crashed slot）
- `ModelDirectoryResolver.directoryFor()` 内部经由服务方法调用链需要调用方上下文具备 `remote` / `remote.session`。
- 对比 DSH 内置 `@deepseek-ai/dsh-client-ui-model-selection` 的 `inject = ["commandUi","locale","sessions","slots","remote","remote.session"]`。
- PinMe 之前只注入了 `slots` / `modelDirectories` / `sessions`，导致插槽条目的 inject face 一执行就抛错，整条目被错误边界吞掉，界面看不到插件。
- **修复**：客户端入口的 `inject` 与 `ctx.inject([...])` 补齐 `locale` / `remote` / `remote.session`。`src/client/index.ts`

### 3. 根因二：状态契约过期（菜单点不开）
- PinMe 沿用了旧版契约 `busy = state.pending !== null`，但当前 store 快照根本没有 `pending` 字段（`undefined !== null` 恒为 `true`），于是 `show()` 永远提前返回，菜单点击无反应。
- 当前真实契约：`status: 'idle' | 'loading' | 'ready' | 'error' | 'selecting'`，busy 判定为 `status === 'selecting'`；另有 `routable`，无 `pending` / `retainedEffort`。
- **修复**：更新 `ModelDirectoryState` 类型，移除 `pending` / `retainedEffort`，重写 `busy` 判定并移除对打开菜单的错误阻断。`src/client/PinMeSelect.tsx`

### 4. 交互精简（按产品反馈）
- **取消空态占位**：没有收藏时 `FavoriteTags` 直接返回 `null`，不再常驻「点击菜单 ♡ 收藏预设」，也不再有 `+` 胶囊——对齐浏览器书签栏只展示已有书签的逻辑。
- **心形实时联动**：`PinMeSelect` 通过 `useFavorites()` 订阅收藏集合，用 `Set<id>` 做 O(1) 判定；点击心形后实心状态立即翻转，不再依赖其它状态变更才刷新。
- **键盘可达**：快捷胶囊补 `onKeyDown`（Enter / Space）。
- **清理**：删除未被引用的 `styles.module.css` 与 `css.d.ts`（实际样式以 `styles.ts` 内联注入）。

### 5. 验证
- 在 DSH Web（`--patch E:/PinMe/cordis.yml`）实测：无收藏时收藏栏不渲染；心形收藏后胶囊即时出现并高亮当前项；`×` 删除后收藏栏消失；模型按钮打开菜单、选择模型/思考强度均正常。
- 控制台无 `remote.session` / slot crash 报错。
