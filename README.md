# 低代码平台（Low-Code Platform）

一个**通用 UI-only 低代码引擎**：可视化设计器产出 JSON Schema，运行时按 Schema 渲染「表单 / 列表 / 详情」三类页面，页面级配置数据源对接你自己的 CRUD 接口。

> 设计器产出 Schema → 运行时消费 Schema → 页面级数据源对接接口 → 一键预览 / 导出 JSON

## ✨ 特性

- **可视化设计器**：三栏布局（物料 / 画布 / 属性），拖拽搭建，所见即所得
  - 21 个内置物料（表单字段 / 布局 / 列表 / 详情），antd 图标，分组 + 搜索
  - 画布：节点选中态、悬浮工具条、圆形复制/删除、行容器手柄、点阵网格
  - **行（Row）栅格布局**：自动按子节点数分列、字段跨列、节点跨行拖动移动
  - 属性面板按 **基本 / 校验 / 布局 / 数据绑定** 折叠分组（属性配置对齐 JNPF 习惯）
- **运行时渲染器**：组件无关，只认注册表，按 Schema 递归渲染
- **页面级数据总线**：字段绑定 → 自动收集/回填，提交即 POST，加载即回显
- **数据源执行器**：GET（带查询参数）/ POST / PUT，错误重试占位
- **存储层**：默认 **IndexedDB**，抽象 `PageStorage` 接口，可平滑替换为后端
- **导入/导出**：页面 Schema 一键导出 JSON、导入还原
- **出码预留**：`codegen` 接口已留（运行时解释器与出码编译器共享 core）

## 🧱 技术栈

| | |
|---|---|
| 框架 | Vue 3 + TypeScript（strict） |
| 构建 | Vite |
| UI | Ant Design Vue 4 + @ant-design/icons-vue |
| 状态 | Pinia |
| 路由 | Vue Router 4 |
| 测试 | Vitest + @vue/test-utils + fake-indexeddb |
| 存储 | IndexedDB（默认）/ localStorage（可选） |

## 🚀 快速开始

```bash
pnpm install
pnpm dev        # 启动开发服务器 http://localhost:5173
pnpm build      # 类型检查 + 生产构建
pnpm test       # 运行单元测试
```

Node ≥ 18，包管理器用 pnpm。

## 📁 项目结构

```
src/
├── core/            # 纯 TS，零 Vue 依赖：Schema 类型 / 校验 / 组件注册表
│   └── schema/types.ts
├── components/      # 内置物料（Vue 组件 + 物料元信息）
│   ├── form-fields/   # 14 个表单字段
│   ├── layout/        # 行 / 提交按钮 / 分割线 / 提示
│   ├── list/          # 表格 / 查询表单
│   ├── detail/        # 详情描述
│   └── props-panel/   # 属性面板渲染器 + 字段列表编辑器
├── runtime/         # 运行时：渲染器 + 数据总线 + 数据源执行器
├── designer/        # 设计器：画布 / 物料面板 / 属性面板 / 大纲 / store
├── storage/         # PageStorage 接口 + IndexedDB/localStorage 实现
├── codegen/         # 出码占位（schema → .vue，MVP 仅预留接口）
└── views/           # 应用壳：页面列表 / 设计器页 / 运行时预览
```

**依赖方向（单向无环）：** `designer → runtime → core`，`designer → storage`，`core` 零 Vue 依赖。

## 🔌 工作原理

整个引擎围绕一份 **PageSchema JSON** 转：设计器产出、运行时消费、存储保存、出码翻译。

```jsonc
{
  "version": 1,
  "type": "form",            // form | list | detail
  "id": "page_customer_add",
  "name": "客户新增",
  "dataSource": {
    "submit": { "url": "/api/customer", "method": "POST" }
  },
  "body": [
    { "id": "r1", "type": "Row", "props": { "columns": 2 }, "children": [
      { "id": "n1", "type": "Input", "props": { "label": "客户名称" }, "bindings": { "field": "name" } },
      { "id": "n2", "type": "Select", "props": { "label": "行业" }, "bindings": { "field": "industry" } }
    ]}
  ]
}
```

- **字段绑定**：组件的 `bindings.field` 双向绑定到页面级数据总线，提交时自动收集成对象 POST 出去
- **列表/详情数据约定**：加载接口需返回**对象**，Table/Descriptions 通过 `bindings.field` 取到数组/记录。例如列表 `{ rows: [...] }`，Table 绑定 `field: 'rows'`
- **表格列转义**：每列可配「原值 → 显示名」映射（如 `0→禁用`），渲染时自动查表替换

## 📦 内置物料

| 分组 | 物料 |
|------|------|
| 表单字段 | 单行文本、多行文本、下拉选择、单选、多选、日期、数字、开关、密码、级联选择、时间、滑块、评分、树选择 |
| 布局 | 行（栅格）、提交按钮、分割线、提示 |
| 列表 | 数据表格（支持列转义）、查询表单 |
| 详情 | 详情描述 |

每个字段的可配属性参考 JNPF 习惯：标签、占位提示、可清除、只读、禁用、字数统计、最大长度、必填、可搜索、多选、格式、min/max/step 等。

## 🚧 现状与边界

**MVP 已完成**：表单/列表/详情三页搭建 + 预览 + 导入导出 + IndexedDB 存储，57 单测通过。

**暂未实现（按需扩展）：**
- 出码（codegen）——接口已预留
- 后端存储——`PageStorage` 接口可替换，加一个 `server-storage.ts` 即可
- 复杂业务物料：上传、富文本、组织/用户/角色选择、关联表单等（需对应子系统）
- 多人协同、用户权限、版本历史

## 📄 文档

设计与实施文档位于 `docs/superpowers/`：
- `specs/2026-07-13-low-code-platform-design.md` — 设计文档
- `plans/2026-07-13-low-code-platform-mvp.md` — 实施计划

## License

MIT
