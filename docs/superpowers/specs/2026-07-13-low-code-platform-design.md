# 低代码平台（通用 UI-only 引擎）设计文档

- **日期**：2026-07-13
- **状态**：已确认，待编写实施计划
- **仓库**：`/Users/zhangyu/CodeDevelopment/low-code-platform`

---

## 1. 目标与范围

构建一个**通用 UI-only 低代码引擎**：通过可视化设计器产出 JSON Schema，运行时按 Schema 渲染「表单 / 列表 / 详情」三类页面；页面级配置数据源对接用户自己的 CRUD 接口。

### 核心定位（澄清结论）

| 维度 | 决定 |
|------|------|
| 引擎类型 | 通用引擎，不限定具体业务（D） |
| 运行方式 | 混合：开发态 schema 驱动实时预览，发布时支持出码导出（C） |
| Schema 管理范围 | UI-only：只描述视图与字段绑定，不含数据模型/业务逻辑（A） |
| 技术栈 | Vue 3 + TypeScript + Vite（A） |
| 数据对接 | 页面级数据源（GET 取数 / POST 提交）（A） |
| 存储 | MVP 纯前端（localStorage + JSON 导入导出），存储层抽象预留后端（C） |

### 架构方案：方案三（渐进式）

单仓库单应用起步，但代码严格按 `core / components / designer / runtime / codegen / storage` 分目录，依赖单向。等 MVP 跑通、确需独立发包时再无痛升级为 pnpm monorepo。

---

## 2. 模块边界与目录结构

**依赖纪律：单向。** `designer`、`runtime`、`codegen` 都只能依赖 `core`（和 `components`），彼此互不依赖。

```
low-code-platform/
├── packages/                      # 预留：未来升 monorepo 的位置（现在空着）
├── src/
│   ├── core/                      # 纯 TS，零 Vue 依赖（可被任何环境引用，含 Node）
│   │   ├── schema/                #   Schema 类型定义 + 校验
│   │   │   ├── types.ts           #   PageSchema / FieldSchema / DataSourceSchema / ComponentNode
│   │   │   ├── validate.ts        #   schema 校验器
│   │   │   └── migrate.ts         #   版本迁移（schema 有 version 字段）
│   │   ├── registry/              #   组件注册表
│   │   │   └── registry.ts        #   register/get/list，存组件元信息
│   │   └── index.ts
│   ├── components/                # 内置物料（Vue 组件 + 物料元信息）
│   │   ├── form-fields/           #   Input/Select/DatePicker/...
│   │   ├── layout/                #   Row/FormActions
│   │   ├── list/                  #   Table/SearchForm
│   │   ├── detail/                #   Descriptions
│   │   └── index.ts               #   组件 + 物料描述统一注册
│   ├── designer/                  # 设计器（依赖 core + components）
│   │   ├── canvas/                #   画布：拖拽、选中、实时预览
│   │   ├── panels/                #   左侧物料面板 / 右侧属性面板 / 大纲树
│   │   └── store/                 #   designer 状态（Pinia）
│   ├── runtime/                   # 运行时渲染器（依赖 core + components）
│   │   ├── renderer/              #   读 schema → 渲染对应组件
│   │   └── datasource/            #   数据源执行器（fetch 取数/提交）
│   ├── codegen/                   # 出码（依赖 core，未来再做）
│   │   └── vue-codegen.ts         #   schema → .vue 源码
│   ├── storage/                   # 存储抽象层
│   │   ├── types.ts               #   PageStorage 接口
│   │   ├── local-storage.ts       #   MVP 实现：localStorage
│   │   └── index.ts
│   └── main.ts / App.vue / router.ts   # 应用壳：/ 、/designer/:id、/render/:id
```

关键点：
- `core` 零 Vue 依赖——纯类型与逻辑，方便出码模块在 Node 环境运行。
- `components` 是「物料」，每个组件自带**渲染实现 + 物料元信息**。
- `storage` 是抽象接口，MVP 给 localStorage 实现，后端实现以后加一个文件即可。
- `packages/` 现在留空，是给将来升 monorepo 的锚点，不影响现在。

---

## 3. Schema 规范

整个引擎围绕一份 JSON 转：设计器产出、运行时消费、出码翻译、存储保存。Schema 是最关键的契约。

### 顶层结构

```ts
// core/schema/types.ts

interface PageSchema {
  version: 1                              // schema 版本号，为将来升级留迁移入口
  type: 'form' | 'list' | 'detail'        // 三类页面
  id: string                              // 页面唯一 id
  name: string                            // 页面名（"客户列表"）
  dataSource?: DataSourceSchema           // 页面级数据源
  body: ComponentNode[]                   // 组件树
  ui?: { title?: string }                 // 杂项 UI 配置
}

interface DataSourceSchema {
  load?:   { url: string; method: 'GET' | 'POST'; params?: Record<string, any> }
  submit?: { url: string; method: 'POST' | 'PUT' }
  // 列表页分页/查询参数先留扩展位
}

interface ComponentNode {
  id: string                              // 节点 id（设计器拖拽用）
  type: string                            // 组件类型，如 'Input' / 'Select' / 'Row'
  props: Record<string, any>              // 组件属性（label、placeholder、options、columns、colSpan...）
  children?: ComponentNode[]              // 容器类组件才有子节点
  bindings?: { field?: string }           // 字段绑定：组件值 ↔ 数据源字段
}
```

### 示例：客户新增表单

```json
{
  "version": 1,
  "type": "form",
  "id": "page_customer_add",
  "name": "客户新增",
  "dataSource": { "submit": { "url": "/api/customer", "method": "POST" } },
  "body": [
    {
      "id": "r1", "type": "Row", "props": { "columns": 2 },
      "children": [
        { "id": "n1", "type": "Input",  "props": { "label": "客户名称" }, "bindings": { "field": "name" } },
        { "id": "n2", "type": "Select", "props": { "label": "行业", "options": [] }, "bindings": { "field": "industry" } }
      ]
    },
    {
      "id": "r2", "type": "Row", "props": { "columns": 1 },
      "children": [
        { "id": "n3", "type": "Textarea", "props": { "label": "备注" }, "bindings": { "field": "remark" } }
      ]
    }
  ]
}
```

### 设计取舍

- `type` 用字符串而非枚举——第三方能注册自定义组件。
- `bindings` 独立于 `props`——分离「组件外观」与「字段绑定」，属性面板更清爽，出码更易。
- `version` 字段一开始就有——为 schema 演进迁移留入口。
- schema 只描述 UI 与绑定，不含业务逻辑——守住 UI-only 边界。

---

## 4. 组件注册表与内置物料

### 注册表机制（core/registry）

注册表存的是**物料描述**（组件叫什么、归哪组、可配属性），同时指向 Vue 渲染实现。`core` 只存 `MaterialMeta`（纯数据，零 Vue 依赖），Vue 组件由 `components` 包注册时挂上。

```ts
interface MaterialMeta {
  type: string                  // 唯一标识，对应 ComponentNode.type
  group: string                 // 分组：'表单字段' / '布局' / '列表' / '详情'
  label: string                 // 物料面板显示名
  icon?: string
  propsSchema: PropField[]      // 属性面板配置（这组件能配哪些属性）
  isContainer?: boolean         // 是否容器（能拖子组件进去）
}

register(meta, component)
getMeta(type) / listByGroup()   // 设计器用
resolveComponent(type)          // 运行时用：取 Vue 组件渲染
```

### 属性面板自动生成

属性面板根据组件的 `propsSchema` 自动生成配置表单——低代码引擎自己也是低代码的。

```ts
// Input 组件 propsSchema 节选
{
  type: 'Input',
  propsSchema: [
    { name: 'label',       label: '标签',    type: 'string' },
    { name: 'placeholder', label: '占位提示', type: 'string' },
    { name: 'required',    label: '是否必填', type: 'boolean' },
    { name: 'maxLength',   label: '最大长度', type: 'number' },
  ]
}
```

### MVP 内置物料清单

基于 **Ant Design Vue** 封装。

| 分组 | 组件 | 说明 |
|------|------|------|
| **表单字段** | Input、Textarea、Select、Radio、Checkbox、DatePicker、InputNumber、Switch | 覆盖表单页绝大多数场景 |
| **布局** | **Row**（`columns` 控制一行几列，`isContainer`）、**FormActions**（提交/重置按钮） | 表单页骨架 |
| **列表** | Table（分页、操作列）、SearchForm（查询条件） | 列表页核心 |
| **详情** | Descriptions（键值对展示） | 详情页展示 |

容器类（Row）标 `isContainer: true`，能往里拖子节点。

### 栅格布局（Row + colSpan）

- **Row**：`columns` 属性决定一行几列（1/2/3/4）。
- **子组件 colSpan**（进 MVP）：默认占 1 列，可设为占多列。运行时换算 `a-col` 的 span：`span = 24 / columns * colSpan`。
- 例：2 列布局下某个备注框 `colSpan=2` → 占满整行。

---

## 5. 可视化设计器

### 布局

```
┌─────────────────────────────────────────────────────────┐
│ 顶部工具栏：页面切换(form/list/detail) · 页面设置 · 保存 · 预览 · 导出 │
├──────────┬──────────────────────────┬───────────────────┤
│ 物料面板  │       画布 Canvas         │   属性面板        │
│          │                          │                   │
│ 表单字段  │   ┌──────────────────┐   │  ▸ 基本属性       │
│  Input   │   │ 客户名称: [____]  │   │  ▸ 校验           │
│  Select  │   │ 行业:    [▼]     │   │  ▸ 数据绑定       │
│ 布局      │   │ [提交] [重置]    │   │                   │
│ ...      │   └──────────────────┘   │ (选中节点才有)    │
│ (大纲树)  │                          │                   │
└──────────┴──────────────────────────┴───────────────────┘
```

### 三个核心交互

1. **拖入**：从物料面板拖组件到画布，生成 `ComponentNode`（带唯一 id）插入 schema 树。容器组件高亮「可放置」。
2. **选中**：点击组件选中，右侧属性面板按其 `propsSchema` 自动生成配置表单。改属性 → 实时写回 `ComponentNode.props`。
3. **大纲**：左侧下方一棵 schema 树，可看嵌套、拖动排序、删除。

### 实现要点

- **画布复用运行时渲染器**：设计器复用 runtime 渲染能力，给每个节点包一层「可选中/可拖拽」事件壳。所见即所得。
- **状态管理用 Pinia**：designer store 持当前编辑的 `PageSchema`，所有操作走 action，便于撤销（history 栈，MVP 至少做撤销）。
- **页面类型切换**：顶部切换 form/list/detail 时，物料面板过滤可用组件。

### 数据源配置入口

顶部工具栏「页面设置」入口配置 `dataSource`（load/submit 的 url、method），页面级，不与组件混。

### 取舍

- MVP 撤销/重做先做简单 history（至少撤销）。
- 不做多人协同编辑。
- 不做自由画布（绝对定位）——用 Row 栅格 + colSpan 控制布局。

---

## 6. 运行时渲染器

### 渲染流程

```
PageSchema
   │
   ▼
Renderer 遍历 body（ComponentNode 树）
   │  对每个节点：resolveComponent(node.type) → Vue 组件
   │  透传 node.props
   ▼
递归渲染 children（容器类继续递归）
   │
   ▼
挂接数据源
```

- 渲染器**组件无关**——只认注册表，不写死具体组件。加物料不动渲染器。
- 设计器画布 = 渲染器 + 选中/拖拽事件壳，共用渲染逻辑。

### 数据源执行器（runtime/datasource）

| 页面类型 | 加载（load） | 提交（submit） |
|---------|------------|--------------|
| **list**   | 进入 → GET 列表 → 喂给 Table | 通常无 |
| **form**   | 可选（编辑：GET 回填） | 提交 → 按 bindings 收集 → POST/PUT |
| **detail** | GET → 喂给 Descriptions | 无 |

```ts
// list 加载
const data = await datasource.exec(schema.dataSource.load, { page: 1, size: 10 })

// form 提交：直接把数据总线对象交给数据源（见下节）
await datasource.exec(schema.dataSource.submit, formData)
```

- `datasource.exec`：内部 fetch（method + url + body），返回 Promise。MVP 直连。
- 表单值的收集**不需要遍历组件树**——靠下面的数据总线直接拿到。

### 页面级数据总线

渲染器维护一个**页面级响应式数据对象**（`reactive({})`），所有带 `bindings.field` 的组件双向绑定到它。提交时直接交给数据源，无需逐组件读取。

```ts
const formData = reactive({})
// 渲染 Input：v-model="formData[node.bindings.field]"
// 提交：datasource.exec(submit, formData)
```

### 错误处理

- **取数失败**：catch → 画布显示「加载失败，点此重试」占位，控制台打详细错误。
- **校验失败**：表单提交前跑 Ant Design 表单校验，不过则不提交、标红。
- **接口报错**：透传 HTTP 错误码 + 后端 message，`message.error` 弹出。

---

## 7. 存储与导入导出

### 抽象接口

```ts
interface PageStorage {
  list():              Promise<PageMeta[]>
  get(id):             Promise<PageSchema | null>
  save(schema):        Promise<void>      // 按 id upsert
  remove(id):          Promise<void>
}

interface PageMeta { id: string; name: string; type: 'form'|'list'|'detail'; updatedAt: number }
```

上层只依赖 `PageStorage` 接口。切后端时新增 `server-storage.ts` 实现同一接口，注入替换，业务零改动。

### MVP 实现：localStorage

```ts
// 索引 + 详情分两个 key：
//   lowcode:pages:index     → PageMeta[]
//   lowcode:page:<id>       → 完整 PageSchema
```

- 分 key 避免单 key 过大、改一个重写全部。
- 加内存缓存（读过的页面缓存到 Map），减少重复反序列化。

### 导入 / 导出

- **导出**：当前 `PageSchema` 序列化为 JSON 文件下载（`xxx.page.json`）。
- **导入**：选 JSON → `core/validate` 校验 → 通过则 upsert。

### 应用壳路由

```
/                 → 页面管理列表 + 新建
/designer/:id     → 设计器（加载已有）
/designer/new     → 设计器（空白）
/render/:id       → 运行时预览
```

### 取舍

- MVP 不做版本历史，只存最新版。schema 自带 `version` 是格式版本（迁移用），与业务版本历史不同。
- 不做用户/权限。
- localStorage 约 5MB，schema 很小，几百页面没问题。

---

## 8. 出码（Codegen）· 架构预留

MVP 不实现，但确保 schema 经得起静态翻译。

### 三点约束（已在设计中满足）

- schema 自描述、无隐式状态——出码即「运行时执行」换成「编译期生成」。
- `core` 零 Vue 依赖——出码模块在 Node 可直接 import core。
- 组件有稳定 `type`——出码按 type 映射到 Ant Design 标签。

### 将来形态

```
schema.json ──▶ codegen ──▶ pages/CustomerAdd.vue
```

生成示意（非 MVP 产物）：

```vue
<template>
  <a-form :model="formData" @submit="onSubmit">
    <a-row :gutter="16">
      <a-col :span="12"><a-form-item label="客户名称"><a-input v-model:value="formData.name" /></a-form-item></a-col>
      <a-col :span="12"><a-form-item label="行业"><a-select v-model:value="formData.industry" /></a-form-item></a-col>
    </a-row>
    <a-button type="primary" html-type="submit">提交</a-button>
  </a-form>
</template>
<script setup lang="ts">
const formData = reactive({})
async function onSubmit() { await fetch('/api/customer', { method:'POST', body: JSON.stringify(formData) }) }
</script>
```

### 实现路径（将来）

- `codegen/vue-codegen.ts`：纯函数 `generateVue(schema): string`，遍历组件树按 type 拼模板字符串。
- 复用 `core` 的 schema 类型与遍历工具。
- 两种入口：设计器「导出源码」下载 / CLI `lowcode codegen schema.json -o ./pages`。

### 约束

- MVP 只承诺「不堵路」，不写实现。
- 出码粒度按页面，一个 schema 生成一个 `.vue`。
- 运行时（解释器）与出码（编译器）互不依赖，只共享 `core`。

---

## 9. 测试策略

| 层 | 范围 | 优先级 |
|----|------|--------|
| **core** | schema 校验、注册表、版本迁移 | 必测（纯逻辑最好测） |
| **runtime** | 渲染快照、数据源执行器（mock fetch）、数据总线双向绑定 | 必测 |
| **storage** | LocalStorage 实现 CRUD（mock）、接口契约 | 必测 |
| **designer** | 拖入生成节点、改属性写回、删除更新树 | 尽量补 |
| **UI 视觉** | 拖拽/布局效果 | 手动验 |

- 工具：**Vitest** + Vue Test Utils。
- MVP 门槛：core、`collectByBindings`、存储层必须有测试；不追求覆盖率数字，追求核心路径有保护。

---

## 10. MVP 范围总结

**做**：
- core（schema 类型 + 校验 + 注册表）
- 内置物料（表单字段 + Row/FormActions + Table/SearchForm + Descriptions，基于 Ant Design Vue，含 Row 栅格 + colSpan）
- 设计器（物料/画布/属性/大纲、拖拽选中、页面类型切换、页面设置配数据源、撤销）
- 运行时（组件无关渲染器、页面级数据总线、数据源执行器、错误处理）
- 存储（PageStorage 接口 + localStorage 实现 + JSON 导入导出）
- 测试（core / 数据总线 + 渲染 / 存储层）

**不做（预留）**：
- 出码（codegen）实现——只保证 schema 可翻译
- 后端存储实现——只保证接口可替换
- 版本历史、用户权限、多人协同、自由画布、富文本/图表/上传物料

---
