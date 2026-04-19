# 模型价格获取流程总结

面向 TokenRate 插件中"选择模型并自动回写单价"的功能，本文档记录数据来源、数据流、关键文件与实现细节，便于后续维护与扩展。

## 一、功能定位

插件原本需要用户手动填写 4 个 USD 单价字段（输入 / 输出 / 缓存读 / 缓存写）。每次换模型都要查官网文档再手填，效率低。

引入 [models.dev](https://models.dev/api.json) 的统一模型目录（114 providers / 4216 models）后，用户在"单价配置"面板点击"选择模型"按钮，即可弹出目录选择器，选中后把 `cost` 字段自动写入主表单，仅覆盖 API 返回的字段，缺失字段保留当前值。

## 二、数据来源

- 入口：`https://models.dev/api.json`
- 体积：约 1.7 MB（JSON）
- CORS：服务端已返回 `Access-Control-Allow-Origin: *`，渲染进程可直接 `fetch`
- 结构（节选）：

```jsonc
{
  "<providerId>": {
    "id": "anthropic",
    "name": "Anthropic",
    "models": {
      "<modelId>": {
        "id": "claude-3-sonnet-20240229",
        "name": "Claude Sonnet 3",
        "family": "claude-sonnet",
        "reasoning": false,
        "cost": {
          "input": 3,           // USD / 1M tokens
          "output": 15,
          "cache_read": 0.3,
          "cache_write": 0.3
        },
        "limit": { "context": 200000, "output": 4096 }
      }
    }
  }
}
```

目前 4216 条模型中 1372 条含 `cache_read`、490 条含 `cache_write`，绝大多数仅有 `input`/`output`。

## 三、整体数据流

```
            ┌─ 用户点击"选择模型" 按钮
            ▼
ModelPickerDialog (reka-ui Dialog)
   │ 打开时 watch → useModelCatalog.load()
   │ emit('select', model)
   ▼
CalculatorLeftPanel
   │ emit('apply-model', model.cost)
   ▼
index.vue applyModelCost(cost)
   │ 条件赋值 form.pIn / pOut / pCR / pCC
   ▼
主表单 reactive CalculatorForm → 触发原有 computed 链路


useModelCatalog (单例 composable)
   │ load()
   │   ├── 读 utools.db.promises.get('model-catalog:v1')
   │   │     └─ 命中且未过期 (< 1h) → normalize → 填充状态
   │   └─ 否则 fetch → normalize → put 写回缓存
   │ refresh()
   │   └── 强制 fetch，覆盖缓存 (_rev 处理)
   └── 开发环境 (window.utools 不存在) → 跳过持久化，仅内存缓存
```

## 四、关键文件

| 文件 | 作用 |
|---|---|
| `src/composables/useModelCatalog.ts` | 数据层：fetch、normalize、utools.db 持久化、TTL 判断 |
| `src/views/components/ModelPickerDialog.vue` | 弹层 UI：搜索、筛选、分组列表、预览、应用 |
| `src/views/components/CalculatorLeftPanel.vue` | 触发按钮 + 挂载 Dialog + `apply-model` emit 冒泡 |
| `src/views/index.vue` | `applyModelCost(cost)` 条件回写表单字段 |

未修改：`preload.js`、`script/build-end.js`、`plugin.json`、`package.json`（无新增依赖）。

## 五、数据层细节：`useModelCatalog.ts`

### 对外 API

```ts
const {
  models,         // Ref<CatalogModel[]>  扁平、已排序、已预计算 searchKey
  loading,        // Ref<boolean>
  error,          // Ref<Error | null>
  lastFetchedAt,  // Ref<number | null>
  load,           // () => Promise<void>  优先命中缓存
  refresh         // () => Promise<void>  强制刷新
} = useModelCatalog();
```

模块级单例：`models` / `loading` 等状态在模块作用域声明，多处调用共享同一份状态，避免重复请求。并发保护：`inflight` 变量去重并发调用。

### 存储协议

- 载体：`utools.db.promises`（与项目现有 `src/store/index.ts` 保持一致）
- `_id`: `'model-catalog:v1'`
- 文档结构：

```ts
interface CatalogDoc {
  _id: 'model-catalog:v1';
  _rev?: string;          // 写回时必须带上才能覆盖
  fetchedAt: number;      // Date.now()
  providers: RawCatalog;  // models.dev 返回的原始嵌套结构（不是扁平化后的）
}
```

缓存的是"原始数据"而非"扁平结果"，目的：
1. 扁平化逻辑可以迭代升级，老缓存仍可用
2. `normalize()` 在内存中跑，不占 db 空间

### TTL 判断

```ts
const CACHE_TTL_MS = 60 * 60 * 1000;
if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
  // 命中
}
```

### 开发环境 Fallback

```ts
function getStorage() {
  return (globalThis as any)?.window?.utools?.db?.promises ?? null;
}
```

`storage === null` 时跳过读写缓存，依靠模块级内存变量，页面刷新即丢失，不影响使用。

### 扁平化 normalize

原始嵌套结构 → `CatalogModel[]`，同时：
- 丢弃 `cost` 完全为空的条目
- 转键：`cache_read` → `cacheRead`、`cache_write` → `cacheWrite`
- 预计算 `searchKey = \`${providerName} ${providerId} ${modelName} ${modelId}\`.toLowerCase()`
- 排序：providerName → modelName

### 类型

```ts
export interface CatalogModelCost {
  input?: number; output?: number;
  cacheRead?: number; cacheWrite?: number;
}
export interface CatalogModel {
  providerId: string; providerName: string;
  modelId: string; modelName: string;
  family?: string; reasoning?: boolean;
  context?: number; outputLimit?: number;
  cost: CatalogModelCost;
  searchKey: string;
}
```

## 六、UI 层细节：`ModelPickerDialog.vue`

### 依赖

- `reka-ui` Dialog 原语（`DialogRoot`/`Portal`/`Overlay`/`Content`/`Title`/`Description`/`Close`）
- `@vueuse/core` 的 `refDebounced`（搜索 250ms 去抖）
- `lucide-vue-next`：`Search`、`RefreshCw`、`X`
- `dayjs` + `relativeTime` + `zh-cn` locale（显示"已更新 X 前"）

### Props / Emits

```ts
defineProps<{ open: boolean }>();
defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'select', model: CatalogModel): void;
}>();
```

外部用 `v-model:open` 控制显示，`select` 事件携带选中的 `CatalogModel`。

### 渲染结构

```
┌───────────────────────────────────────────────┐
│ 选择模型   已更新 3 分钟前   [刷新目录] [X]    │
├───────────────────────────────────────────────┤
│ [搜索框] [全部厂商 ▼]                         │
├───────────────────────────────────────────────┤
│ Anthropic (sticky)                            │
│   Claude Sonnet 3      IN $3    OUT $15 [CR]  │
│   Claude Opus ...                             │
│ OpenAI (sticky)                               │
│   GPT-5 ...                                   │
│   ...                                         │
│ (仅显示前 200 条提示)                          │
├───────────────────────────────────────────────┤
│ 已选: Claude Sonnet 3 · Anthropic             │
│ 输入 $3  输出 $15  缓存读 $0.3  缓存写 $0.3   │
│                            [取消] [应用]      │
└───────────────────────────────────────────────┘
```

### 性能策略

4216 条数据不做虚拟列表，而是：
- 默认/搜索都只渲染前 200 条
- 搜索走预计算 `searchKey.includes(keyword)`
- 总数超过 200 时底部提示引导用户输入关键字

若未来性能不够，可接入 `@vueuse/core` 的 `useVirtualList`，改造范围限于本组件。

### 样式约束

Dialog 经 Portal 渲染到 `body`，脱离了主页 `.calculator-page` 的 apple 变量作用域。**必须使用 shadcn 的全局 HSL 变量**（`bg-background` / `text-foreground` / `border-border` / `bg-muted` / `bg-primary` 等），这些变量定义在 `src/assets/index.css`，同时覆盖亮/暗两种模式。`<html class="dark">` 由 `@vueuse/core` 的 `useColorMode` 统一管理，可正常穿透到 Portal 节点。

### 交互细节

- 打开时：`watch props.open → load()`，首次触发拉取
- 关闭时：重置 `search` / `providerFilter` / `selectedId`
- 单击行：高亮选中，同步底部预览
- 双击行：选中并立即"应用"
- 刷新中：按钮禁用 + `RefreshCw` 图标旋转

## 七、回写策略

只覆盖 API 返回的字段。`index.vue` 的 `applyModelCost`：

```ts
function applyModelCost(cost: CatalogModelCost) {
  if (cost.input != null) form.pIn = cost.input;
  if (cost.output != null) form.pOut = cost.output;
  if (cost.cacheRead != null) form.pCR = cost.cacheRead;
  if (cost.cacheWrite != null) form.pCC = cost.cacheWrite;
}
```

场景：
- 选中 `claude-3-sonnet-20240229`（四个字段齐全）→ 四格全部覆盖
- 选中 `qwen3-235b-a22b`（仅 input/output）→ 只更新 pIn/pOut，pCR/pCC 保留用户当前值

弹层底部预览同步显示"(保留当前值)"提示，用户选中前即可预判效果。

## 八、风险与应对

| 风险 | 应对 |
|---|---|
| 1.7 MB JSON parse 阻塞主线程 | 实测一次性 parse 约 100-300 ms，可接受；如需进一步优化可在 composable 内用 `queueMicrotask` 延迟 normalize |
| `utools.db` 单文档容量 | PouchDB 后端，1.7 MB 在容量范围内；若写入失败可改 `postAttachment` 或降级为 localStorage |
| Portal 后样式脱离主页主题 | 使用 shadcn 全局 HSL 变量，与 `<html class="dark">` 联动自动切换 |
| 开发环境无 `window.utools` | `getStorage()` 返回 null 时跳过持久化，内存缓存兜底 |
| models.dev 宕机 / 网络失败 | `error` 状态展示提示 + "重试"按钮，不阻塞界面其他功能 |
| 并发调用 `load()` | 模块级 `inflight` 锁去重 |

## 九、使用方式

### 主页入口

1. 进入计算器主页
2. 左侧"单价配置 (USD)"面板右上角点击"选择模型"
3. 等待首次加载（后续 1 小时内秒开）
4. 搜索 / 筛选厂商 / 点选模型
5. 点击"应用"→ 单价字段自动填入

### 手动刷新

弹层头部点击"刷新目录"可强制拉取最新数据并覆盖缓存。

### 缓存查询（DevTools）

```js
await utools.db.promises.get('model-catalog:v1');
// => { _id, _rev, fetchedAt, providers: {...} }
```

## 十、可扩展方向

- 接入虚拟列表（`@vueuse/core` 的 `useVirtualList`）
- 弹层中按模型能力（`reasoning` / `modalities`）二次筛选
- 在页面上显示当前单价对应的"来源模型"（需把选中信息持久化到 form）
- 支持"保存我的模型"自定义条目（user 手工录入 + 本地 db 分开存储）
- 汇率自动拉取并与单价目录联动

## 十一、参考

- [models.dev](https://models.dev/)：统一模型目录 API
- [octopus 项目](https://github.com/bestruirui/octopus)：LLMPrice 模块的 auto-fetch / 手动兜底思路参考
- [reka-ui Dialog](https://reka-ui.com/docs/components/dialog)：Dialog 原语使用
