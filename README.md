# PinMe 📌❤️

> **PinMe** 是为 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 打造的快捷模型与思考强度收藏插件。

一键收藏常用的「模型 + 思考强度」组合（如 `Gemini 3.8 Flash High`、`Claude Sonnet Thinking Medium`），并将它们直接展示在输入栏下方作为快捷药丸标签（Pills），实现**单次点击瞬间直达**，彻底告别繁琐的多级菜单操作！

---
<img width="1947" height="258" alt="image" src="https://github.com/user-attachments/assets/4f33798f-f63f-45a5-b1b7-b164046e5c55" />

## ✨ 核心特性

- 🚀 **一键切换**：在输入框下方的模型选择器旁边直接展示已收藏的模型组合标签，点击即刻生效切换。
- ❤️ **心形收藏**：收藏统一放在思考强度（Off / Low / Medium / High / Max）二级菜单中，与档位文字、选中勾号并存；无思考档位的模型提供单一 `Default` 档位，依然可收藏。
- 📌 **当前组合快捷收藏**：菜单顶部「Model Configuration」右侧还有一个心形，随时把「当前模型 + 当前思考强度」一键收藏，无需进入二级菜单。
- 🧹 **极简空态**：没有收藏时不显示任何占位；收藏栏只在存在预设时出现（类似浏览器书签栏）。
- 🔄 **会话实时同步**：深度兼容 DSH 的 `ModelDirectoryResolver` 和 `Session` 控制器，多会话切换状态无缝保持。
- 💾 **本地持久化**：预设配置自动保存至浏览器 `localStorage`，跨窗口及多会话随时可用。
- 🎨 **原生融合风格**：外观风格完全对齐 DSH 官方设计规范，适配深色与浅色主题，支持高亮联动与便捷删除（×）。

---

## 📸 交互效果图解

### 1. 快捷标签栏（输入框工具栏）
在模型选择器旁水平排布收藏胶囊标签（无收藏时整栏隐藏）：
```
┌────────────────────────────────────────────────────────────────────────┐
│ [输入框 Prompt Input ...]                                              │
├────────────────────────────────────────────────────────────────────────┤
│ [⭐ 3.8 Flash High]  [Sonnet 4.6 Med]  [Gemini 3.8 Flash High ▾]        │
└────────────────────────────────────────────────────────────────────────┘
                        ↑ 点击快捷标签直接切换模型+思考强度（× 删除）
```

### 2. 心形收藏（「思考强度」二级菜单内）
收藏只出现在「思考强度」二级菜单，与档位设置并存（`✓` 为当前选中档位）：
```
┌─────────────────────────┐
│ ← Back                  │
│ Thinking Intensity      │
├─────────────────────────┤
│ ✓ Low           [ ♡ ]   │
│   Medium        [ ♥ ]   │ ← 已收藏（模型 + Medium）
│   High          [ ♡ ]   │
└─────────────────────────┘
```
没有思考档位的模型（如部分第三方供应商）会提供单一 `Default` 档位，收藏项形如 `模型名 · Default`。

---

## 🛠️ 安装

PinMe 是一个标准 DSH **组合包（bundle）**，用 `dsh plugin` 装进 profile 即可，无需改 DSH 源码。

### 方式一：从 npm 安装（无需构建授权，推荐）
```bash
dsh plugin --profile web add dsh-plugin-pinme
```
包内已带编译好的 `lib/`，安装即可用。

### 方式二：从 GitHub 源码安装
```bash
dsh plugin --profile web add github:bruceyork00-a11y/PinMe#v0.1.4
```
pnpm ≥10 默认拒绝运行 git 依赖的构建脚本，首次会失败并在输出里给出授权键。把该键写进 profile 的 `pnpm-workspace.yaml` 后重试：
```yaml
# ~/.dsh/profiles/web/pnpm-workspace.yaml
allowBuilds:
  dsh-plugin-pinme: true
```
> 授权构建 = 允许该包代码在安装时于本机执行；请固定 commit/tag，只对可信源码授权。

### 方式三：从 Release 产物（tarball）安装
```bash
dsh plugin --profile web add ./dsh-plugin-pinme-0.1.4.tgz
```
tarball 已含 `lib/`，同样不需要构建授权。

安装后重启 DSH 即可，插件会自动出现（无需 `--patch`）。卸载：`dsh plugin --profile web remove dsh-plugin-pinme`。

---

## 🧑‍💻 本地开发调试

```bash
npm install
npm run build
```
用 `--patch` 直接挂载本地 `cordis.yml`（不写 profile）：
```bash
pnpm dsh web --patch E:/PinMe/cordis.yml
```
随后打开 `http://127.0.0.1:3080` 即可体验。

---

## 📦 发布（维护者）

```bash
npm run build                 # 产出 lib/（prepare 也会在 npm pack/publish 时自动执行）
npm pack                      # 生成 dsh-plugin-pinme-<version>.tgz，可挂到 GitHub Release
npm publish                   # 发布到 npm（需已登录）
git tag v0.1.4 && git push origin v0.1.4   # 打 tag，供 github:owner/repo#v0.1.4 安装
```

---

## 📁 项目工程结构

```
PinMe/
├── package.json               # 声明 dsh.bundle（组合包层）与 dsh.client（浏览器半边）
├── cordis.patch.yml           # 组合包层：向 profile 插入 PinMe 插件行
├── cordis.yml                 # 本地 --patch 调试覆盖层
├── build.js                   # tsc + esbuild 打包为 DSH ModuleLoader 格式
├── tsconfig.json              # TypeScript 编译配置
├── src/
│   ├── index.ts               # Host 进程（Cordis 模块声明）
│   └── client/
│       ├── index.ts           # Client 入口：注入 conversation.input.model 插槽
│       ├── PinMeSelect.tsx    # 增强版模型选择器（整合心形收藏与快捷药丸）
│       ├── FavoriteTags.tsx   # 快捷标签栏组件（空态隐藏）
│       ├── HeartButton.tsx    # 心形收藏交互按钮
│       ├── storage.ts         # LocalStorage 读写与响应式监听
│       ├── locales.ts         # PinMe 自有 i18n 命名空间（zh / en）
│       ├── types.ts           # 数据契约定义
│       ├── clsx.ts            # 零依赖 classNames 组合器
│       └── styles.ts          # 内联样式注入
└── README.md
```

---

## 📄 许可证

[MIT License](LICENSE)
