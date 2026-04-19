---
trigger: always_on
---

# 项目概览

**项目名称**: TokenRate
**类型**: uTools 插件
**核心功能**: 翻译和拆分词语记忆。

## 技术栈

- **框架**: [Vue 3.5](https://vuejs.org/) (Composition API, `<script setup>`)
- **构建工具**: [Vite 7.2](https://vitejs.dev/)
- **语言**: [TypeScript 5.9](https://www.typescriptlang.org/) / JavaScript
- **样式**: [Tailwind CSS v3](https://tailwindcss.com/) `tailwindcss-animate`, `lucide-vue-next` (图标)
- **UI 组件**: [shadcn-vue](https://www.shadcn-vue.com/) (基于 Radix UI)
- **路由**: [Vue Router 4.6](https://router.vuejs.org/)，配合 `vite-plugin-pages` 实现文件路由。
- **状态管理 / 工具**: [Day.js 1.11](https://day.js.org/) 用于日期处理，自定义 store (查看 `src/store`)。
- **uTools 集成**: `utools-api-types` (v7.2), `plugin.json` 配置，参考 [uTools 开发者文档](https://u.tools/docs/developer/welcome.html)。
- **开发环境内核**:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) uTools/7.2.1 Chrome/108.0.5359.215 Electron/22.3.27 Safari/537.36'

## ui原型

- 在\deaignWorker目录下面是原型图
- index.html是首页原型图

## 项目结构

- **`plugin.json`**: 核心 uTools 插件配置。定义了命令（"翻译官拆词", "拆词" 等）、功能特性和入口点。
  src/
  ├── layouts/
  │ └── default.vue # 默认布局(包含 Sidebar)
  ├── views/
  │ ├── index.vue # 拆词页面
  │ ├── history.vue # 历史页面
  │ ├── wordbook.vue # 生词本页面
  │ └── components/ # 页面级组件
  ├── components/
  │ ├── AppSidebar.vue # 侧边栏组件
  │ ├── ModeToggle.vue # 主题切换
  │ └── ui/ # shadcn-vue 组件
  ├── App.vue # 根组件(动态布局系统)
  └── main.js
- **`public/`**: 静态资源。
- **`script/`**: 构建脚本（例如 `build-end.js`）。

## 开发流程

1.  **安装依赖**: `npm install`。
2.  **启动开发服务器**: `npm run dev` (运行 Vite 服务器，通常在 `http://localhost:5173` 或类似端口)。
    - 若要在 uTools 中测试，请将 `plugin.json` -> `development` -> `main` 入口指向此本地 URL。
3.  **构建**: `npm run build`。
    - 生成 `dist/` 文件夹。
    - 将 `plugin.json`、`preload.js` 和 `logo.png` 复制到 `dist/`。
4.  **uTools 调试**:
    - 在 uTools 中安装 "uTools 开发者工具" 插件。
    - 打开本项目中的 `plugin.json` 文件以加载插件。

## 关键配置

- **uTools (`plugin.json`)**:
  - `code`: "basic"
  - `cmds`: ["翻译官拆词", "拆词", "翻译", "记忆", "单词"]
  - `main`: "index.html" (生产环境), "http://localhost:3000" (开发环境目标，注意：用户需检查实际的 Vite 端口)。

- **Vite (`vite.config.js`)**:
  - 配置了 `vite-plugin-vue`。
  - `AutoImport` 和 `Components` 插件用于自动导入 Vue API 和组件。

## 开发规范

- 使用 **Vue Composition API** 和 `<script setup>`。
- 使用 **Tailwind CSS** 进行样式设计。
- 尽可能使用 `utools-api-types` 确保 uTools API 调用的类型安全。
- `preload.js` 处理 Node.js 集成（如果需要，目前看起来功能精简）。
