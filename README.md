# TokenRate

uTools 插件 —— **大模型 API Token 计费计算器**。输入单价、倍率、汇率与充值面额，实时算出输入 / 输出 / 缓存读 / 缓存写四类 token 的 **USD / CNY / 积分** 单价与总成本，并给出缓存节省比例。

![TokenRate 计算器界面](img/1776597447786.png)

## 功能

- 四类计费项：输入、输出、缓存读（Cache Read）、缓存写（Cache Write）
- 两种倍率模式：统一分组倍率 / 独立倍率
- 三口径换算：USD · CNY · 积分（可在 CNY / USD 两种充值面额间切换）
- 缓存节省（Context Caching）实时比例

## 技术栈

Vue 3.5 · Vite 7.2 · TypeScript · Tailwind CSS v3 · shadcn-vue · `utools-api-types`

## 开发

```bash
npm install
npm run dev        # http://localhost:3001
npm run build      # 产物输出到 dist/
```

在 uTools 中安装「uTools 开发者工具」，加载本仓库的 `plugin.json` 进行调试。

## 关键字

uTools 输入框触发：`token`、`积分`

## 目录

- `src/views/index.vue` — 计算器主页
- `src/views/components/` — `CalculatorLeftPanel` / `CalculatorRightPanel` / `calculator.types.ts`
- `desing/main.html` — Apple 风格 UI 原型
- `preload.js` — uTools Node 预加载（当前为空骨架）
- `script/build-end.js` — 构建后处理（复制 `plugin.json` / `preload.js` / `logo.png` 到 `dist/`）
