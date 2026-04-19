---
trigger: always_on
---

## 💻 代码规范

### 组件开发

- **命名**：使用 `驼峰命名`（如：`templateBase.vue`）
- **组织**：功能相似的组件放在同一目录下
- **语法**：必须使用 `<script setup>`
- **Props**：必须指定类型和默认值，**禁止直接修改 props**（使用 emit 通知父组件）
- **双向绑定**：使用 `defineModel()` 宏进行双向绑定

### 样式编写

- **Tailwind CSS**：**优先使用** Tailwind CSS 原子类进行样式编写，减少手写 CSS
- **命名**：自定义 CSS 类使用 `kebab-case`（如：`todo-list`）
- **BEM 规范**：自定义样式必须遵循 BEM（块 `block`，元素 `block__element`，修饰符 `block--modifier`）
- **作用域**：组件样式必须使用 `scoped`
- **禁止**：使用行内样式

### 状态管理 (Pinia)

- 全局状态必须使用 Pinia store
- 使用 `computed` 获取派生状态
- Action 必须使用 `async/await` 处理异步
- 组件内优先使用 props/emit，避免滥用全局状态

### TypeScript

- 必须显式声明类型，**禁止使用 any**
- 接口和类型定义使用 `PascalCase`
- 优先使用 `interface` 而非 `type`

### 异步与异常

- **异步**：必须使用 `async/await` 进行异步编程
- **异常**：**不建议**使用 `try/catch`，仅在**调试**或**代码兜底**时使用

## 🚫 禁止事项

2. 禁止在模板中使用复杂表达式
3. 禁止直接修改 props 中的对象属性
4. 禁止在组件中使用全局变量
5. 禁止使用特定框架的类名作为选择器
