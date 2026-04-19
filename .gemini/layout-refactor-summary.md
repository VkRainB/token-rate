# 布局系统重构完成

## 📁 新的目录结构

```
src/
├── layouts/
│   └── default.vue          # 默认布局(包含 Sidebar)
├── views/
│   ├── index.vue            # 拆词页面
│   ├── history.vue          # 历史页面
│   ├── wordbook.vue         # 生词本页面
│   └── components/          # 页面级组件
├── components/
│   ├── AppSidebar.vue       # 侧边栏组件
│   ├── ModeToggle.vue       # 主题切换
│   └── ui/                  # shadcn-vue 组件
├── App.vue                  # 根组件(动态布局系统)
└── main.js
```

## 📝 页面路由元信息示例

```vue
<route>
{
  name: 'page-name',
  meta: {
    layout: 'default'  // 或 'admin', 'auth' 等
  }
}
</route>
```
