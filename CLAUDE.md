# 项目概览

**项目名称**: TokenRate（Token 计费计算器）
**package.json name**: `tokenrate`（npm 规范要求全小写）
**类型**: uTools 插件
**核心功能**: 根据大模型 API 的单价（输入 / 输出 / 缓存读 / 缓存写）、分组倍率、汇率与充值面额，实时计算 USD、CNY、积分 三种口径的单价与总成本，并给出缓存节省比例。

## 技术栈

- **框架**: [Vue 3.5](https://vuejs.org/)（Composition API + `<script setup>`）
- **构建工具**: [Vite 7.2](https://vitejs.dev/)（开发端口 **3001**，见 `vite.config.js`）
- **语言**: TypeScript 5.9 / JavaScript 混用
- **样式**: [Tailwind CSS v3](https://tailwindcss.com/) + `tailwindcss-animate`；图标 `lucide-vue-next` / `@iconify/vue`
- **UI 组件**: [shadcn-vue](https://www.shadcn-vue.com/)（基于 `reka-ui`）
- **路由**: [Vue Router 4.6](https://router.vuejs.org/) + [`vite-plugin-pages`](https://github.com/hannoeru/vite-plugin-pages)（`src/views` 文件路由，排除 `**/components/**`）
- **模块自动注册**: `vite-plugin-use-modules`（自动加载 `src/modules/*`，例如 `router.js`）
- **自动导入**: `unplugin-auto-import`（vue / vue-router） + `unplugin-vue-components`
- **工具库**: `@vueuse/core`、`axios`、`dayjs`、`class-variance-authority`、`clsx`、`tailwind-merge`、`vue-sonner`、`eruda`
- **uTools 集成**: `utools-api-types` v7.2，配置见 `plugin.json`
- **目标环境内核**: `uTools/7.2.1 Chrome/108 Electron/22.3.27`

## UI 原型

- 原型目录：**`desing/`**（注意是 `desing`，保留原拼写）
- 首页原型：`desing/main.html`（Apple 风格 Model Billing Calculator，含亮/暗双主题 CSS 变量）

## 项目结构

```
src/
├── App.vue                 # 根组件：直接渲染 DefaultLayout
├── main.js                 # 入口
├── layouts/
│   └── default.vue         # 默认布局
├── views/                  # 文件路由（vite-plugin-pages）
│   ├── index.vue           # 计算器主页（route meta.layout = 'default'）
│   └── components/         # 页面级组件（被 pages 排除，不参与路由）
│       ├── CalculatorLeftPanel.vue
│       ├── CalculatorRightPanel.vue
│       ├── calculator-page.css
│       └── calculator.types.ts   # CalculatorForm / Category / RateCard / CostRow / Totals / Savings 等
├── components/             # 全局组件（shadcn-vue 产物 + 自定义）
├── modules/
│   └── router.js           # 由 vite-plugin-use-modules 自动注册
├── store/
│   └── index.ts            # 全局状态
├── shared/
│   └── base.js
├── types/                  # auto-imports.d.ts / components.d.ts 输出目录
├── api/ · composables/ · config/ · utils/ · lib/ · assets/   # 预留/按需
```

- 根目录：`plugin.json`、`preload.js`、`logo.png`、`index.html`、`tailwind.config.js`、`components.json`
- `script/build-end.js`：`vite build` 之后的收尾脚本（拷贝 `plugin.json` / `preload.js` / `logo.png` 到 `dist/`）
- `dist-snapshot.md`、`PRELOAD_DEPENDENCIES.md`、`docs/`：文档与快照

## 核心数据模型（`src/views/components/calculator.types.ts`）

`index.vue` 的状态组织如下，修改计算逻辑时必须保持类型一致：

- `CalculatorForm`：`pIn/pOut/pCR/pCC`（USD/1M 单价）、`exRate`（汇率）、`groupRate`、`grIn/grOut/grCR/grCC`（细分倍率）、`rechargeAmount/rechargePoints`、`tokIn/tokOut/tokCR/tokCC`（token 用量）
- `Category`：四类 `in | out | cr | cc`（输入 / 输出 / 缓存读 / 缓存写），每类绑定 `priceKey/groupKey/tokenKey`
- 派生：`usdPrices → cnyPrices → rateCards → costRows → totals → savings`
- 两种模式：统一倍率（`groupRate`）vs 详细倍率（`grIn/grOut/grCR/grCC`）——由 `detailMode` 切换
- 充值口径：`rechargeCurrency: 'CNY' | 'USD'` 决定 `pointsPerUsd / pointsPerCny` 计算

## plugin.json

```jsonc
{
  "main": "index.html",              // 生产
  "logo": "logo.png",
  "preload": "preload.js",
  "development": { "main": "http://localhost:3001" },  // 开发直连 Vite
  "features": [{
    "code": "basic",
    "explain": "Token 计费计算器：输入/输出/缓存倍率与美元、人民币、积分换算",
    "cmds": ["token", "积分"],
    "icon": "logo.png"
  }]
}
```

- 关键字：`token`、`积分`
- 开发环境 `main` 指向 `http://localhost:3001`，**必须与 `vite.config.js` 的 `server.port` 保持一致**

## 开发流程

1. 安装依赖：`npm install`（或 `pnpm install`，仓库同时存在 `pnpm-lock.yaml` 与 `package-lock.json`）
2. 启动开发：`npm run dev` → http://localhost:3001
3. 构建：`npm run build`（执行 `vite build` 后运行 `script/build-end.js` 将 `plugin.json`、`preload.js`、`logo.png` 复制进 `dist/`）
4. uTools 调试：安装「uTools 开发者工具」→ 加载本仓库 `plugin.json`

## 开发规范

- 一律使用 **Composition API + `<script setup lang="ts">`**
- 样式优先 Tailwind；复杂局部样式允许同目录 `.css`（见 `calculator-page.css`）
- 新增全局组件放 `src/components/`；页面私有组件放 `src/views/<page>/components/` 并确保命中 `vite-plugin-pages` 的 `**/components/**` 排除规则
- 新增路由：在 `src/views/` 下建 `.vue` 并用 `<route>` 块声明 `meta.layout`
- 计算器相关类型集中在 `calculator.types.ts`，派生计算集中在 `index.vue` 的 `computed` 里；修改公式请同步 `rateCards / costRows / totals / savings` 链路
- uTools API 调用优先利用 `utools-api-types` 的类型提示
- `preload.js` 承担 Node.js 集成；依赖清单见 `PRELOAD_DEPENDENCIES.md`
