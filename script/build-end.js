const { copyFile, cp, writeFile } = require('fs/promises');
const { resolve } = require('path');

// 复制必要的文件
copyPluginFile('preload.js');
copyPluginFile('plugin.json');
copyPluginFile('logo.png');
// copyPluginFile('root_affix_ database.csv');

// 为 preload.js 创建 package.json
createPreloadPackageJson();

// 复制 node_modules（只复制 csv-parse）
// copyNodeModules();

function copyPluginFile(fileName) {
  const rootDir = resolve(__dirname, '..');
  const outDir = resolve(rootDir, 'dist');

  copyFile(resolve(rootDir, fileName), resolve(outDir, fileName));
}

function copyPublicFile(fileName) {
  const rootDir = resolve(__dirname, '..');
  const publicDir = resolve(rootDir, 'public');
  const outDir = resolve(rootDir, 'dist');

  copyFile(resolve(publicDir, fileName), resolve(outDir, fileName));
}

// 创建 preload 专用的 package.json
async function createPreloadPackageJson() {
  const rootDir = resolve(__dirname, '..');
  const outDir = resolve(rootDir, 'dist');

  const packageJson = {
    type: "commonjs",
    // dependencies: {
    //   "csv-parse": "^5.5.6"
    // }
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
    // 复制整个 node_modules 目录（只复制 csv-parse 相关）
    // await cp(
    //   resolve(rootDir, 'node_modules/csv-parse'),
    //   resolve(outDir, 'node_modules/csv-parse'),
    //   { recursive: true }
    // );
    console.log('✓ 已复制 node_modules/csv-parse');
  } catch (error) {
    console.error('✗ 复制 node_modules 失败:', error.message);
  }
}
