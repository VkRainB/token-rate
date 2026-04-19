# uTools Preload.js 使用第三方依赖规范文档

## 概述

本文档详细说明了在 uTools 插件中如何在 `preload.js` 中使用第三方 npm 依赖包，以及如何正确配置打包流程。

## 为什么需要特殊处理

uTools 的 `preload.js` 运行在 **Node.js 环境**中，而不是浏览器环境。它需要：

1. **独立的 `package.json`**：必须设置 `type: "commonjs"`
2. **`node_modules` 目录**：包含所需的第三方依赖
3. **CommonJS 模块系统**：使用 `require()` 而不是 `import`

## 完整配置步骤

### 1. 项目结构

```
tokenrate/
├── src/                    # Vue 应用源码
├── dist/                   # 打包输出目录
│   ├── index.html
│   ├── assets/
│   ├── preload.js         # ✓ 必需
│   ├── plugin.json        # ✓ 必需
│   ├── package.json       # ✓ 必需（preload 专用）
│   └── node_modules/      # ✓ 必需（包含第三方依赖）
│       └── csv-parse/
├── preload.js             # 源文件
├── plugin.json
├── package.json           # 项目主 package.json
└── script/
    └── build-end.js       # 构建后处理脚本
```

### 2. 在 preload.js 中使用第三方依赖

#### 2.1 安装依赖

在项目根目录执行：

```bash
npm install csv-parse
```

#### 2.2 在 preload.js 中引入

**注意：必须使用 CommonJS 语法（`require`），不能使用 ES6 模块（`import`）**

```javascript
// ✓ 正确：使用 require
const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');

// ✗ 错误：不要使用 import
// import { parse } from 'csv-parse';  // 这会导致错误！
```

#### 2.3 暴露 API 给渲染进程

使用 `window.exports` 或 `window.api` 暴露 API：

```javascript
const api = {
  // 你的 API 方法
  initDatabase: async () => {
    // 实现代码
  },

  matchWord: (word) => {
    // 实现代码
  }
};

// uTools 推荐使用 window.exports
window.exports = api;

// 也可以同时设置 window.api 作为备用
window.api = api;
```

### 3. 配置打包流程

#### 3.1 创建构建后处理脚本

创建 `script/build-end.js`：

```javascript
const { copyFile, cp, writeFile } = require('fs/promises');
const { resolve } = require('path');

// 复制必要的文件
copyPluginFile('preload.js');
copyPluginFile('plugin.json');
copyPluginFile('logo.png');
// 复制其他资源文件...

// 为 preload.js 创建专用的 package.json
createPreloadPackageJson();

// 复制 node_modules
copyNodeModules();

function copyPluginFile(fileName) {
  const rootDir = resolve(__dirname, '..');
  const outDir = resolve(rootDir, 'dist');
  copyFile(resolve(rootDir, fileName), resolve(outDir, fileName));
}

// 创建 preload 专用的 package.json
async function createPreloadPackageJson() {
  const rootDir = resolve(__dirname, '..');
  const outDir = resolve(rootDir, 'dist');

  const packageJson = {
    type: "commonjs",  // ✓ 必须设置为 commonjs
    dependencies: {
      // 列出 preload.js 需要的所有依赖
      "csv-parse": "^5.5.6"
    }
  };

  await writeFile(
    resolve(outDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  console.log('✓ 已创建 dist/package.json');
}

// 复制 node_modules
async function copyNodeModules() {
  const rootDir = resolve(__dirname, '..');
  const outDir = resolve(rootDir, 'dist');

  try {
    // 复制所需的依赖包
    await cp(
      resolve(rootDir, 'node_modules/csv-parse'),
      resolve(outDir, 'node_modules/csv-parse'),
      { recursive: true }
    );
    console.log('✓ 已复制 node_modules/csv-parse');
  } catch (error) {
    console.error('✗ 复制 node_modules 失败:', error.message);
  }
}
```

#### 3.2 修改 package.json 的构建脚本

```json
{
  "scripts": {
    "build": "vite build && node ./script/build-end.js"
  }
}
```

### 4. 常见问题与解决方案

#### 问题 1：window.api 或 window.exports 不存在

**症状：**
```
[Main] window.api 存在: false
[Main] window.exports 存在: false
```

**原因：**
- `dist/` 目录缺少 `package.json`
- `dist/` 目录缺少 `node_modules`
- `preload.js` 没有被 uTools 执行

**解决方案：**
1. 确保 `dist/package.json` 存在且 `type: "commonjs"`
2. 确保 `dist/node_modules/` 包含所需依赖
3. 检查 `plugin.json` 中 `preload` 字段配置正确

#### 问题 2：require is not defined

**症状：**
```
ReferenceError: require is not defined
```

**原因：**
- 在 `preload.js` 中使用了 ES6 模块语法（`import`）
- `package.json` 中 `type` 设置为 `"module"`

**解决方案：**
1. 将所有 `import` 改为 `require`
2. 确保 `dist/package.json` 中 `type: "commonjs"`

#### 问题 3：Cannot find module 'xxx'

**症状：**
```
Error: Cannot find module 'csv-parse'
```

**原因：**
- `dist/node_modules/` 中缺少该依赖包

**解决方案：**
1. 在 `build-end.js` 中添加复制该依赖的代码
2. 重新执行 `npm run build`

### 5. 调试技巧

#### 5.1 使用 eruda 调试工具

在 `src/main.js` 中集成 eruda：

```javascript
import eruda from 'eruda';

// 初始化 eruda（生产环境也启用）
eruda.init();
console.log('[Eruda] 调试工具已启动');
```

#### 5.2 添加详细日志

在 `preload.js` 中添加日志：

```javascript
console.log('[Preload] preload.js 开始执行');
console.log('[Preload] __dirname:', __dirname);
console.log('[Preload] process.cwd():', process.cwd());

// 在关键位置添加日志
const api = {
  initDatabase: async () => {
    console.log('[Preload] initDatabase 被调用');
    // ...
  }
};

console.log('[Preload] 设置 window.exports...');
window.exports = api;
console.log('[Preload] preload.js 执行完毕');
```

在 `src/main.js` 中检查 API：

```javascript
console.log('[Main] window.api 存在:', !!window.api);
console.log('[Main] window.exports 存在:', !!window.exports);
console.log('[Main] window.utools 存在:', !!window.utools);
```

### 6. 最佳实践

#### 6.1 只复制必要的依赖

不要复制整个 `node_modules`，只复制 `preload.js` 实际使用的包：

```javascript
// ✓ 推荐：只复制需要的包
await cp(
  resolve(rootDir, 'node_modules/csv-parse'),
  resolve(outDir, 'node_modules/csv-parse'),
  { recursive: true }
);

// ✗ 不推荐：复制整个 node_modules（体积太大）
await cp(
  resolve(rootDir, 'node_modules'),
  resolve(outDir, 'node_modules'),
  { recursive: true }
);
```

#### 6.2 处理依赖的依赖

如果你的依赖包还依赖其他包，也需要一并复制。可以使用工具自动分析：

```javascript
// 使用 npm list 查看依赖树
// npm list csv-parse --depth=1

// 或者使用 npm pack 打包依赖
```

#### 6.3 版本锁定

在 `dist/package.json` 中使用精确版本号：

```json
{
  "dependencies": {
    "csv-parse": "5.5.6"  // ✓ 精确版本
    // "csv-parse": "^5.5.6"  // ✗ 可能导致版本不一致
  }
}
```

### 7. 完整示例

#### preload.js

```javascript
const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');

console.log('[Preload] preload.js 开始执行');

// 加载数据库
function loadDatabase(csvPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvPath)) {
      reject(new Error(`文件未找到: ${csvPath}`));
      return;
    }

    const results = [];
    fs.createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', row => results.push(row))
      .on('end', () => resolve(results))
      .on('error', err => reject(err));
  });
}

let globalData = null;

const api = {
  initDatabase: async () => {
    console.log('[Preload] initDatabase 被调用');
    if (globalData) return;

    const csvPath = path.join(__dirname, 'data.csv');
    globalData = await loadDatabase(csvPath);
    console.log(`[Preload] ✓ 已加载 ${globalData.length} 条数据`);
  },

  query: (keyword) => {
    if (!globalData) throw new Error('数据库未加载');
    return globalData.filter(item => item.name.includes(keyword));
  }
};

window.exports = api;
window.api = api;
console.log('[Preload] preload.js 执行完毕');
```

#### src/main.js

```javascript
import { createApp } from 'vue';
import App from './App.vue';

async function initApp() {
  const app = createApp(App);

  // 获取 preload 暴露的 API
  const api = window.api || window.exports;

  if (api && api.initDatabase) {
    try {
      await api.initDatabase();
      console.log('✓ 数据库初始化完成');
    } catch (error) {
      console.error('✗ 数据库初始化失败:', error);
    }
  }

  app.mount('#app');
}

initApp();
```

### 8. 参考资源

- [uTools 官方文档 - preload](https://www.u-tools.cn/docs/developer/information/preload.html)
- [Node.js CommonJS 模块](https://nodejs.org/api/modules.html)
- [Electron 预加载脚本](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload)

## 总结

在 uTools 插件中使用第三方依赖的关键点：

1. ✅ `preload.js` 使用 CommonJS 语法（`require`）
2. ✅ `dist/package.json` 必须设置 `type: "commonjs"`
3. ✅ `dist/node_modules/` 必须包含所需依赖
4. ✅ 使用 `window.exports` 暴露 API
5. ✅ 在构建脚本中自动复制依赖
6. ✅ 使用 eruda 进行调试

遵循这些规范，可以确保你的 uTools 插件在打包后能正常使用第三方依赖。
