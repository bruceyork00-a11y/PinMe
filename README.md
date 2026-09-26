# PinMe 📌❤️

> **PinMe** 是为 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 打造的快捷模型与思考强度收藏插件。

一键收藏常用的「模型 + 思考强度」组合（如 `Gemini 3.8 Flash High`、`Claude Sonnet Thinking Medium`），并将它们直接展示在输入栏下方作为快捷药丸标签（Pills），实现**单次点击瞬间直达**，彻底告别繁琐的多级菜单操作！

---

## ✨ 核心特性

- 🚀 **一键切换**：在输入框下方的模型选择器旁边直接展示已收藏的模型组合标签，点击即刻生效切换。
- ❤️ **心形收藏**：在思考强度（Low / Medium / High）与模型列表中内置心形收藏按钮（♡ / ♥），随时自由增删预设。
- 🔄 **会话实时同步**：深度兼容 DSH 的 `ModelDirectoryResolver` 和 `Session` 控制器，多会话切换状态无缝保持。
- 💾 **本地持久化**：预设配置自动保存至浏览器 `localStorage`，跨窗口及多会话随时可用。
- 🎨 **原生融合风格**：外观风格完全对齐 DSH 官方设计规范，适配深色与浅色主题，支持高亮联动与便捷删除（×）。

---

## 📸 交互效果图解

### 1. 快捷标签栏（输入框工具栏）
在模型选择器右侧水平排布收藏胶囊标签：
```
┌────────────────────────────────────────────────────────────────────────┐
│ [输入框 Prompt Input ...]                                              │
├────────────────────────────────────────────────────────────────────────┤
│ [+] [Gemini 3.8 Flash High ▾]  [⭐ 3.8 Flash High]  [Sonnet 4.6 Med]   │
└────────────────────────────────────────────────────────────────────────┘
                                     ↑ 点击快捷标签直接切换模型+思考强度
```

### 2. 心形收藏（下拉菜单钻取项）
在思考强度与模型选项右侧点击心形图标一键收藏或取消：
```
┌─────────────────────────┐
│ Thinking Intensity      │
├─────────────────────────┤
│ Low             [ ♡ ]   │
│ Medium          [ ♥ ]   │ ← 已收藏
│ High            [ ♡ ]   │
└─────────────────────────┘
```

---

## 🛠️ 安装与本地调试

### 1. 安装依赖与编译

在 `E:\PinMe` 目录下执行：
```bash
npm install
npm run build
```

### 2. 在 DeepSeek Harness 中加载测试

使用 DSH 提供的 `--patch` 参数挂载本地编译好的 `cordis.yml` 配置文件：
```bash
pnpm dsh web --patch E:/PinMe/cordis.yml
```
随后打开 `http://127.0.0.1:3080` 即可体验！

---

## 📁 项目工程结构

```
PinMe/
├── package.json               # 声明 dsh.client 指向 lib/client/index.js
├── tsconfig.json              # TypeScript 编译配置
├── cordis.yml                 # 本地调试覆盖层配置
├── src/
│   ├── index.ts               # Host 进程（Cordis 模块声明）
│   └── client/
│       ├── index.ts           # Client 入口：注入 conversation.input.model 插槽
│       ├── PinMeSelect.tsx    # 增强版模型选择器（整合心形收藏与快捷药丸）
│       ├── FavoriteTags.tsx   # 快捷标签栏组件
│       ├── HeartButton.tsx    # 心形收藏交互按钮
│       ├── storage.ts         # LocalStorage 读写与响应式监听
│       ├── types.ts           # 数据契约定义
│       └── styles.module.css  # 胶囊标签与心形微交互样式
└── README.md
```

---

## 📄 许可证

[MIT License](LICENSE)
