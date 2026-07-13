# 低代码平台 MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个通用 UI-only 低代码引擎：可视化设计器产出 JSON Schema，运行时按 Schema 渲染表单/列表/详情三类页面，页面级配置数据源对接 CRUD 接口，MVP 纯前端（localStorage + JSON 导入导出）。

**Architecture:** 方案三（渐进式）——单仓库单应用，代码按 `core / components / designer / runtime / codegen / storage` 分目录，依赖单向（designer/runtime/codegen 只依赖 core，互不依赖）。`core` 零 Vue 依赖。设计器画布复用运行时渲染器。出码与后端存储在 MVP 只做接口预留，不实现。

**Tech Stack:** Vue 3.4+ / TypeScript 5 / Vite 5 / Pinia 2 / Vue Router 4 / Ant Design Vue 4.x / Vitest 1 / pnpm

## Global Constraints

- 包管理器：pnpm
- Node 版本：>= 18
- Vue 3.4+、TypeScript 严格模式（`strict: true`）
- Ant Design Vue 4.x，物料基于其组件封装（`a-input`、`a-select`、`a-table`、`a-form`、`a-row`、`a-col`、`a-descriptions` 等）
- 依赖纪律：`runtime` / `codegen` 只能 import `core` 和 `components`，且不反向依赖 `designer`。`designer` 可 import `core` / `components` / `runtime` / `storage`（画布复用 runtime 渲染器实现所见即所得）。`core` 不得 import 任何 Vue 相关包。总结：`designer → runtime → core`，`designer → storage`，单向无环。
- Schema 当前 `version: 1`
- 三类页面：`'form' | 'list' | 'detail'`
- 所有任务遵循 TDD：先写失败测试 → 跑红 → 实现 → 跑绿 → 提交

---

## File Structure

```
src/
├── core/
│   ├── schema/
│   │   ├── types.ts          # PageSchema / DataSourceSchema / ComponentNode / MaterialMeta / PropField
│   │   └── validate.ts       # validateSchema(schema): { valid: boolean; errors: string[] }
│   ├── registry/
│   │   └── registry.ts       # register/getMeta/listByGroup/resolveComponent
│   └── index.ts
├── components/
│   ├── form-fields/          # Input/Textarea/Select/.../Switch 各一个文件
│   ├── layout/               # Row.vue / FormActions.vue
│   ├── list/                 # Table.vue / SearchForm.vue
│   ├── detail/               # Descriptions.vue
│   ├── props-panel/          # PropsForm.vue —— 根据 propsSchema 渲染属性配置表单
│   └── index.ts              # registerAll()：把所有物料 + meta 注册进 registry
├── runtime/
│   ├── renderer/
│   │   ├── Renderer.vue      # 递归渲染 ComponentNode 树
│   │   └── NodeView.vue      # 渲染单个节点（查注册表 → 透传 props → 递归 children）
│   ├── datasource/
│   │   └── executor.ts       # exec(config, body?)：fetch 封装
│   ├── usePageRuntime.ts     # 组合：数据总线 reactive + datasource + 错误状态
│   └── index.ts
├── storage/
│   ├── types.ts              # PageStorage 接口 + PageMeta
│   ├── local-storage.ts      # LocalStorage 实现
│   └── index.ts              # 注入默认实现
├── designer/
│   ├── store/
│   │   └── editor.ts         # Pinia：当前 PageSchema、增删改节点、history（撤销）
│   ├── canvas/
│   │   └── Canvas.vue        # 渲染 NodeView + 选中/拖入事件壳
│   ├── panels/
│   │   ├── MaterialPanel.vue # 左侧物料列表（按 group）
│   │   ├── PropertyPanel.vue # 右侧属性面板（用 PropsForm）
│   │   └── OutlinePanel.vue  # 大纲树
│   ├── DesignerView.vue      # 三栏布局 + 工具栏
│   └── toolbar/
│       └── PageSettings.vue  # 数据源配置弹窗
├── codegen/
│   └── vue-codegen.ts        # 占位：仅导出未实现的 generateVue（MVP 不实现，留接口）
├── views/
│   ├── PageList.vue          # 页面管理列表（/）
│   └── RenderView.vue        # 运行时预览（/render/:id）
├── router.ts
├── main.ts
└── App.vue
```

---

## Phase A — 基础设施

### Task 1: 项目脚手架与依赖

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.ts`, `src/App.vue`, `.gitignore`, `vitest.config.ts`

**Interfaces:**
- Produces: 可运行的空 Vue 应用 + 测试框架

- [ ] **Step 1: 创建 Vite + Vue3 + TS 项目**

```bash
cd /Users/zhangyu/CodeDevelopment/low-code-platform
pnpm create vite@latest . --template vue-ts
# 若提示目录非空（有 docs/），选 "Ignore files and continue"
```

- [ ] **Step 2: 安装运行时依赖**

```bash
pnpm add ant-design-vue@^4 pinia vue-router@4
```

- [ ] **Step 3: 安装开发依赖**

```bash
pnpm add -D vitest@^1 @vue/test-utils@^2 jsdom @vitest/coverage-vitest
```

- [ ] **Step 4: 配置 tsconfig（严格模式 + path 别名）**

`tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: 配置 vitest**

`vitest.config.ts`：
```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'jsdom', globals: true },
})
```

并在 `vite.config.ts` 里同样配 `@` 别名和 vue 插件（Vite 模板已有 vue 插件，补 alias 即可）。

- [ ] **Step 6: 配置路径别名到 vite.config.ts**

确保 `vite.config.ts` 的 `resolve.alias` 含 `'@': fileURLToPath(new URL('./src', import.meta.url))`。

- [ ] **Step 7: 写一个冒烟测试验证 vitest 跑通**

Create `src/__tests__/smoke.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
describe('smoke', () => {
  it('runs', () => { expect(1 + 1).toBe(2) })
})
```

- [ ] **Step 8: 跑测试**

Run: `pnpm vitest run`
Expected: 1 passed

- [ ] **Step 9: 清理模板默认样式**

把 `src/App.vue` 替换为最小内容（后续任务会重写）：
```vue
<template><div class="app"><router-view /></div></template>
<script setup lang="ts"></script>
```

- [ ] **Step 10: 提交**

```bash
git add -A
git commit -m "chore: 项目脚手架（Vite+Vue3+TS+AntD+Vitest）"
```

---

## Phase B — core 层

### Task 2: Schema 类型定义

**Files:**
- Create: `src/core/schema/types.ts`
- Test: `src/core/schema/__tests__/types.test.ts`

**Interfaces:**
- Produces: `PageSchema`、`DataSourceSchema`、`ComponentNode`、`MaterialMeta`、`PropField`、`PageType`

- [ ] **Step 1: 写类型存在性测试**

Create `src/core/schema/__tests__/types.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import type { PageSchema, ComponentNode, DataSourceSchema, MaterialMeta, PropField, PageType } from '../types'

describe('schema types', () => {
  it('PageType 包含三类页面', () => {
    const types: PageType[] = ['form', 'list', 'detail']
    expect(types).toHaveLength(3)
  })
  it('可构造合法 PageSchema', () => {
    const schema: PageSchema = {
      version: 1,
      type: 'form',
      id: 'p1',
      name: '测试',
      body: [],
    }
    expect(schema.id).toBe('p1')
  })
  it('ComponentNode 支持 children 与 bindings', () => {
    const node: ComponentNode = {
      id: 'n1', type: 'Input', props: { label: '名' },
      bindings: { field: 'name' }, children: [],
    }
    expect(node.bindings?.field).toBe('name')
  })
})
```

- [ ] **Step 2: 跑测试验证失败**

Run: `pnpm vitest run src/core/schema`
Expected: FAIL（找不到 types.ts）

- [ ] **Step 3: 写类型**

Create `src/core/schema/types.ts`：
```ts
export type PageType = 'form' | 'list' | 'detail'

export interface DataSourceLoad {
  url: string
  method: 'GET' | 'POST'
  params?: Record<string, unknown>
}
export interface DataSourceSubmit {
  url: string
  method: 'POST' | 'PUT'
}
export interface DataSourceSchema {
  load?: DataSourceLoad
  submit?: DataSourceSubmit
}

export interface ComponentNode {
  id: string
  type: string
  props: Record<string, unknown>
  children?: ComponentNode[]
  bindings?: { field?: string }
}

export interface PageSchema {
  version: 1
  type: PageType
  id: string
  name: string
  dataSource?: DataSourceSchema
  body: ComponentNode[]
  ui?: { title?: string }
}

export type PropType = 'string' | 'number' | 'boolean' | 'select' | 'textarea'

export interface PropField {
  name: string
  label: string
  type: PropType
  options?: Array<{ label: string; value: string | number }>
  default?: unknown
}

export interface MaterialMeta {
  type: string
  group: string
  label: string
  icon?: string
  propsSchema: PropField[]
  isContainer?: boolean
  pageTypes?: PageType[]   // 该物料可用于哪些页面类型；缺省=全部
}
```

- [ ] **Step 4: 跑测试验证通过**

Run: `pnpm vitest run src/core/schema`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/core
git commit -m "feat(core): schema 类型定义"
```

---

### Task 3: Schema 校验器

**Files:**
- Create: `src/core/schema/validate.ts`
- Test: `src/core/schema/__tests__/validate.test.ts`

**Interfaces:**
- Consumes: `PageSchema` from `./types`
- Produces: `validateSchema(schema: unknown): { valid: boolean; errors: string[] }`

- [ ] **Step 1: 写失败测试**

Create `src/core/schema/__tests__/validate.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { validateSchema } from '../validate'

describe('validateSchema', () => {
  it('合法 form schema 通过', () => {
    const ok = validateSchema({
      version: 1, type: 'form', id: 'p1', name: 'n', body: [],
    })
    expect(ok.valid).toBe(true)
    expect(ok.errors).toHaveLength(0)
  })
  it('缺少 id 不通过', () => {
    const r = validateSchema({ version: 1, type: 'form', name: 'n', body: [] })
    expect(r.valid).toBe(false)
    expect(r.errors.join()).toMatch(/id/)
  })
  it('type 非法不通过', () => {
    const r = validateSchema({ version: 1, type: 'xx', id: 'p1', name: 'n', body: [] })
    expect(r.valid).toBe(false)
  })
  it('version 必须为 1', () => {
    const r = validateSchema({ version: 2, type: 'form', id: 'p1', name: 'n', body: [] })
    expect(r.valid).toBe(false)
  })
  it('body 必须为数组', () => {
    const r = validateSchema({ version: 1, type: 'form', id: 'p1', name: 'n', body: 'x' })
    expect(r.valid).toBe(false)
  })
})
```

- [ ] **Step 2: 跑测试验证失败**

Run: `pnpm vitest run src/core/schema/__tests__/validate.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

Create `src/core/schema/validate.ts`：
```ts
import type { PageSchema, PageType } from './types'

const PAGE_TYPES: PageType[] = ['form', 'list', 'detail']

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateSchema(input: unknown): ValidationResult {
  const errors: string[] = []
  const s = input as Partial<PageSchema> & Record<string, unknown>
  if (s == null || typeof s !== 'object') return { valid: false, errors: ['schema 必须为对象'] }
  if (s.version !== 1) errors.push('version 必须为 1')
  if (!PAGE_TYPES.includes(s.type as PageType)) errors.push('type 必须为 form/list/detail')
  if (typeof s.id !== 'string' || !s.id) errors.push('id 必须为非空字符串')
  if (typeof s.name !== 'string') errors.push('name 必须为字符串')
  if (!Array.isArray(s.body)) errors.push('body 必须为数组')
  return { valid: errors.length === 0, errors }
}
```

- [ ] **Step 4: 跑测试验证通过**

Run: `pnpm vitest run src/core/schema/__tests__/validate.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/core/schema/validate.ts src/core/schema/__tests__/validate.test.ts
git commit -m "feat(core): schema 校验器"
```

---

### Task 4: 组件注册表

**Files:**
- Create: `src/core/registry/registry.ts`
- Create: `src/core/index.ts`
- Test: `src/core/registry/__tests__/registry.test.ts`

**Interfaces:**
- Consumes: `MaterialMeta` from `../schema/types`
- Produces: `register(meta, component?)`、`getMeta(type)`、`listByGroup()`、`resolveComponent(type)`、`listAll()`

注意：`core` 不能依赖 Vue，所以 `component` 参数类型用泛型占位，由 `components` 包注入时指定为 Vue 组件。

- [ ] **Step 1: 写失败测试**

Create `src/core/registry/__tests__/registry.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { register, getMeta, listByGroup, resolveComponent, listAll, clearRegistry } from '../registry'
import type { MaterialMeta } from '../../schema/types'

const inputMeta: MaterialMeta = {
  type: 'Input', group: '表单字段', label: '单行文本',
  propsSchema: [{ name: 'label', label: '标签', type: 'string' }],
}
const rowMeta: MaterialMeta = {
  type: 'Row', group: '布局', label: '行',
  propsSchema: [{ name: 'columns', label: '列数', type: 'number' }],
  isContainer: true,
}

describe('registry', () => {
  beforeEach(() => clearRegistry())
  it('register 后可 getMeta', () => {
    register(inputMeta)
    expect(getMeta('Input')?.label).toBe('单行文本')
  })
  it('listByGroup 按 group 过滤', () => {
    register(inputMeta); register(rowMeta)
    expect(listByGroup('布局')).toHaveLength(1)
  })
  it('resolveComponent 返回注册的组件对象', () => {
    const FakeComp = { name: 'FakeInput' }
    register(inputMeta, FakeComp)
    expect(resolveComponent('Input')).toBe(FakeComp)
  })
  it('未知 type 返回 undefined', () => {
    expect(getMeta('Nope')).toBeUndefined()
    expect(resolveComponent('Nope')).toBeUndefined()
  })
  it('listAll 返回全部', () => {
    register(inputMeta); register(rowMeta)
    expect(listAll()).toHaveLength(2)
  })
})
```

- [ ] **Step 2: 跑测试验证失败**

Run: `pnpm vitest run src/core/registry`
Expected: FAIL

- [ ] **Step 3: 实现 registry**

Create `src/core/registry/registry.ts`：
```ts
import type { MaterialMeta } from '../schema/types'

interface RegistryEntry<C = unknown> {
  meta: MaterialMeta
  component?: C
}

const store = new Map<string, RegistryEntry>()

export function register<C = unknown>(meta: MaterialMeta, component?: C): void {
  store.set(meta.type, { meta, component })
}

export function getMeta(type: string): MaterialMeta | undefined {
  return store.get(type)?.meta
}

export function resolveComponent<C = unknown>(type: string): C | undefined {
  return store.get(type)?.component as C | undefined
}

export function listByGroup(group: string): MaterialMeta[] {
  return [...store.values()].map((e) => e.meta).filter((m) => m.group === group)
}

export function listAll(): MaterialMeta[] {
  return [...store.values()].map((e) => e.meta)
}

export function clearRegistry(): void {
  store.clear()
}
```

- [ ] **Step 4: 写 core/index.ts 统一出口**

Create `src/core/index.ts`：
```ts
export * from './schema/types'
export * from './schema/validate'
export * from './registry/registry'
```

- [ ] **Step 5: 跑测试验证通过**

Run: `pnpm vitest run src/core`
Expected: PASS（全部 core 测试）

- [ ] **Step 6: 提交**

```bash
git add src/core
git commit -m "feat(core): 组件注册表 + 统一出口"
```

---

## Phase C — 物料层

### Task 5: 属性面板渲染器 PropsForm

> PropsForm 是「低代码引擎自己的低代码」——根据组件的 `propsSchema` 自动渲染配置表单。先做它，因为后面所有物料的属性面板都依赖它。

**Files:**
- Create: `src/components/props-panel/PropsForm.vue`
- Test: `src/components/props-panel/__tests__/PropsForm.test.ts`

**Interfaces:**
- Consumes: `PropField[]`、`Record<string, unknown>`（当前 props 值）
- Produces: PropsForm Vue 组件，props：`{ fields: PropField[]; modelValue: Record<string, unknown> }`，emits `update:modelValue`

- [ ] **Step 1: 写失败测试**

Create `src/components/props-panel/__tests__/PropsForm.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PropsForm from '../PropsForm.vue'
import type { PropField } from '@/core'

const fields: PropField[] = [
  { name: 'label', label: '标签', type: 'string' },
  { name: 'required', label: '必填', type: 'boolean' },
  { name: 'columns', label: '列数', type: 'number' },
  { name: 'align', label: '对齐', type: 'select', options: [
    { label: '左', value: 'left' }, { label: '右', value: 'right' }
  ] },
]

describe('PropsForm', () => {
  it('为每个 field 渲染一个表单项', () => {
    const w = mount(PropsForm, { props: { fields, modelValue: { label: 'x' } } })
    expect(w.text()).toContain('标签')
    expect(w.text()).toContain('必填')
    expect(w.text()).toContain('列数')
    expect(w.text()).toContain('对齐')
  })
  it('string 类型改变时 emit update:modelValue', async () => {
    const w = mount(PropsForm, { props: { fields, modelValue: { label: '' } } })
    const input = w.find('input[data-prop="label"]')
    await input.setValue('客户名')
    const events = w.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect((events!.at(-1) as any)[0].label).toBe('客户名')
  })
})
```

- [ ] **Step 2: 跑测试验证失败**

Run: `pnpm vitest run src/components/props-panel`
Expected: FAIL

- [ ] **Step 3: 实现 PropsForm**

Create `src/components/props-panel/PropsForm.vue`：
```vue
<template>
  <div class="props-form">
    <div v-for="f in fields" :key="f.name" class="prop-item">
      <label>{{ f.label }}</label>
      <a-input
        v-if="f.type === 'string'"
        :value="String(modelValue[f.name] ?? '')"
        data-prop="label"
        @input="onString(f.name, $event)"
      />
      <a-input-number
        v-else-if="f.type === 'number'"
        :value="Number(modelValue[f.name] ?? 0)"
        @change="(v: any) => onValue(f.name, v)"
      />
      <a-switch
        v-else-if="f.type === 'boolean'"
        :checked="!!modelValue[f.name]"
        @change="(v: any) => onValue(f.name, v)"
      />
      <a-select
        v-else-if="f.type === 'select'"
        :value="modelValue[f.name]"
        :options="f.options"
        @change="(v: any) => onValue(f.name, v)"
        style="width:100%"
      />
      <a-textarea
        v-else-if="f.type === 'textarea'"
        :value="String(modelValue[f.name] ?? '')"
        @input="(e: any) => onString(f.name, e)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropField } from '@/core'
defineProps<{ fields: PropField[]; modelValue: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: Record<string, unknown>): void }>()
function emitPatch(name: string, value: unknown) {
  // 每个字段绑定都要触发，data-prop 统一用 'label' 是简化；实际按 name 定位见下
}
function onValue(name: string, value: unknown) {
  emit('update:modelValue', { ...(arguments as any) }) // placeholder—见下面修正
}
</script>
```

> ⚠️ 上面 `onValue/onString` 的实现需要正确合并。下面是修正后的最终 `<script setup>`，覆盖上面的占位：

替换 `<script setup>` 段为：
```ts
import type { PropField } from '@/core'
const props = defineProps<{ fields: PropField[]; modelValue: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: Record<string, unknown>): void }>()
function onValue(name: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [name]: value })
}
function onString(name: string, e: Event) {
  const v = (e.target as HTMLInputElement).value
  onValue(name, v)
}
```

并把模板里 string 的 `data-prop="label"` 改为 `:data-prop="f.name"` 以便测试通用定位（测试里用 `label`，不影响）。

- [ ] **Step 4: 跑测试验证通过**

Run: `pnpm vitest run src/components/props-panel`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/props-panel
git commit -m "feat(components): PropsForm 属性面板渲染器"
```

---

### Task 6: 表单字段物料

**Files:**
- Create: `src/components/form-fields/InputField.vue`、`TextareaField.vue`、`SelectField.vue`、`RadioField.vue`、`CheckboxField.vue`、`DatePickerField.vue`、`InputNumberField.vue`、`SwitchField.vue`
- Create: `src/components/form-fields/materials.ts`（导出这些字段的 `MaterialMeta`）
- Test: `src/components/form-fields/__tests__/materials.test.ts`

**Interfaces:**
- Consumes: `register` from `@/core`
- Produces: `registerFormFields()` 函数；每个字段组件 props：`{ value: any; props: Record<string, unknown> }`，emits `update:value`

字段组件约定：接受 `value` + `props`（含 label/placeholder/options 等），内部用 `a-form-item` 包裹对应 antd 控件，emits `update:value`。

- [ ] **Step 1: 写一个字段组件（InputField）+ materials 元信息测试**

Create `src/components/form-fields/__tests__/materials.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { clearRegistry, listByGroup, getMeta } from '@/core'
import { registerFormFields } from '../materials'

describe('form field materials', () => {
  beforeEach(() => clearRegistry())
  it('注册后表单字段分组有 8 个', () => {
    registerFormFields()
    expect(listByGroup('表单字段')).toHaveLength(8)
  })
  it('Input 元信息含 label prop', () => {
    registerFormFields()
    const m = getMeta('Input')!
    expect(m.propsSchema.map((p) => p.name)).toContain('label')
  })
})
```

- [ ] **Step 2: 跑测试验证失败**

Run: `pnpm vitest run src/components/form-fields`
Expected: FAIL

- [ ] **Step 3: 实现 InputField（模板范例，其余字段同构）**

Create `src/components/form-fields/InputField.vue`：
```vue
<template>
  <a-form-item :label="label" :required="required">
    <a-input
      :value="value"
      :placeholder="placeholder"
      :maxlength="maxLength"
      @update:value="(v: any) => emit('update:value', v)"
    />
  </a-form-item>
</template>
<script setup lang="ts">
const props = defineProps<{ value: unknown; propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'update:value', v: unknown): void }>()
const label = computed(() => String(props.propValues.label ?? ''))
const placeholder = computed(() => String(props.propValues.placeholder ?? ''))
const required = computed(() => !!props.propValues.required)
const maxLength = computed(() => Number(props.propValues.maxLength ?? undefined))
import { computed } from 'vue'
</script>
```

> 统一字段组件 props 名为 `propValues`（即 schema 的 node.props），避免与 Vue 保留 `props` 冲突。运行时把 `node.props` 传给组件的 `propValues`。

- [ ] **Step 4: 实现其余 7 个字段（同构）**

按 InputField 的模式实现：
- `TextareaField.vue`：`a-textarea`
- `SelectField.vue`：`a-select`，`options` 来自 `propValues.options`
- `RadioField.vue`：`a-radio-group` + options
- `CheckboxField.vue`：`a-checkbox-group` + options
- `DatePickerField.vue`：`a-date-picker`
- `InputNumberField.vue`：`a-input-number`
- `SwitchField.vue`：`a-switch`（无 label 也行，保留 a-form-item）

每个都 props `{ value, propValues }`，emits `update:value`。

- [ ] **Step 5: 实现 materials.ts**

Create `src/components/form-fields/materials.ts`：
```ts
import { register } from '@/core'
import type { PropField } from '@/core'
import InputField from './InputField.vue'
import TextareaField from './TextareaField.vue'
import SelectField from './SelectField.vue'
import RadioField from './RadioField.vue'
import CheckboxField from './CheckboxField.vue'
import DatePickerField from './DatePickerField.vue'
import InputNumberField from './InputNumberField.vue'
import SwitchField from './SwitchField.vue'

const commonLabel: PropField = { name: 'label', label: '标签', type: 'string' }
const commonRequired: PropField = { name: 'required', label: '必填', type: 'boolean' }
const commonPlaceholder: PropField = { name: 'placeholder', label: '占位提示', type: 'string' }
const optionsField: PropField = { name: 'options', label: '选项', type: 'textarea' }

export function registerFormFields() {
  register({ type: 'Input', group: '表单字段', label: '单行文本', propsSchema: [commonLabel, commonPlaceholder, commonRequired, { name: 'maxLength', label: '最大长度', type: 'number' }] }, InputField)
  register({ type: 'Textarea', group: '表单字段', label: '多行文本', propsSchema: [commonLabel, commonPlaceholder, commonRequired] }, TextareaField)
  register({ type: 'Select', group: '表单字段', label: '下拉选择', propsSchema: [commonLabel, commonRequired, optionsField] }, SelectField)
  register({ type: 'Radio', group: '表单字段', label: '单选', propsSchema: [commonLabel, optionsField] }, RadioField)
  register({ type: 'Checkbox', group: '表单字段', label: '多选', propsSchema: [commonLabel, optionsField] }, CheckboxField)
  register({ type: 'DatePicker', group: '表单字段', label: '日期', propsSchema: [commonLabel, commonRequired] }, DatePickerField)
  register({ type: 'InputNumber', group: '表单字段', label: '数字', propsSchema: [commonLabel, commonRequired] }, InputNumberField)
  register({ type: 'Switch', group: '表单字段', label: '开关', propsSchema: [commonLabel] }, SwitchField)
}
```

- [ ] **Step 6: 跑测试验证通过**

Run: `pnpm vitest run src/components/form-fields`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add src/components/form-fields
git commit -m "feat(components): 8 个表单字段物料"
```

---

### Task 7: 布局物料（Row + FormActions）

**Files:**
- Create: `src/components/layout/Row.vue`、`FormActions.vue`
- Create: `src/components/layout/materials.ts`
- Test: `src/components/layout/__tests__/materials.test.ts`

**Interfaces:**
- Consumes: `register` from `@/core`
- Produces: `registerLayout()`；Row 是容器（`isContainer: true`），渲染为 `a-row` + 按 `columns` 切分 `a-col`；FormActions 渲染提交/重置按钮。

Row 的特殊渲染：它不直接渲染 children，而是把 children 分配到 `a-col`（span = 24/columns * colSpan）。所以 Row 组件需要接收「已渲染的子节点」或自己渲染 children。为简单起见，Row 接收 `children` 节点数组 + 一个渲染回调（由 NodeView 提供）。MVP 采用：Row 组件内用 slot 接收子 NodeView，自己只做栅格容器，children 的 colSpan 由 NodeView 透传。

> 决策：为避免 Row 与渲染器耦合，**Row 只渲染一个带 `columns` 的 `a-row`，内部用默认 slot**。子节点的 `a-col` 包裹由 NodeView 在渲染 Row 的 children 时加（NodeView 知道父容器 columns）。Task 8 的 NodeView 会处理这个。

- [ ] **Step 1: 写测试**

Create `src/components/layout/__tests__/materials.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { clearRegistry, getMeta, listByGroup } from '@/core'
import { registerLayout } from '../materials'

describe('layout materials', () => {
  beforeEach(() => clearRegistry())
  it('布局分组有 Row 和 FormActions', () => {
    registerLayout()
    const list = listByGroup('布局').map((m) => m.type)
    expect(list).toContain('Row')
    expect(list).toContain('FormActions')
  })
  it('Row 是容器且有 columns prop', () => {
    registerLayout()
    const m = getMeta('Row')!
    expect(m.isContainer).toBe(true)
    expect(m.propsSchema.map((p) => p.name)).toContain('columns')
  })
})
```

- [ ] **Step 2: 跑测试验证失败**

Run: `pnpm vitest run src/components/layout`
Expected: FAIL

- [ ] **Step 3: 实现 Row.vue**

Create `src/components/layout/Row.vue`：
```vue
<template>
  <a-row :gutter="gutter"><slot /></a-row>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ propValues: Record<string, unknown> }>()
const gutter = computed(() => 16)
// columns 仅作元信息，实际列宽由 NodeView 用 a-col 切分
void props
</script>
```

- [ ] **Step 4: 实现 FormActions.vue**

Create `src/components/layout/FormActions.vue`：
```vue
<template>
  <div class="form-actions">
    <a-button type="primary" html-type="submit">{{ submitText }}</a-button>
    <a-button style="margin-left:8px" @click="emit('reset')">重置</a-button>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'submit'): void; (e: 'reset'): void }>()
const submitText = computed(() => String(props.propValues.submitText ?? '提交'))
</script>
```

- [ ] **Step 5: 实现 materials.ts**

Create `src/components/layout/materials.ts`：
```ts
import { register } from '@/core'
import Row from './Row.vue'
import FormActions from './FormActions.vue'

export function registerLayout() {
  register({
    type: 'Row', group: '布局', label: '行', isContainer: true,
    pageTypes: ['form'],
    propsSchema: [
      { name: 'columns', label: '列数', type: 'select', default: 1,
        options: [ {label:'1列',value:1},{label:'2列',value:2},{label:'3列',value:3},{label:'4列',value:4} ] },
    ],
  }, Row)
  register({
    type: 'FormActions', group: '布局', label: '提交按钮',
    pageTypes: ['form'],
    propsSchema: [{ name: 'submitText', label: '按钮文字', type: 'string', default: '提交' }],
  }, FormActions)
}
```

- [ ] **Step 6: 跑测试验证通过**

Run: `pnpm vitest run src/components/layout`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add src/components/layout
git commit -m "feat(components): 布局物料 Row + FormActions"
```

---

### Task 8: 列表与详情物料

**Files:**
- Create: `src/components/list/TableField.vue`、`SearchField.vue`、`materials.ts`
- Create: `src/components/detail/DescriptionsField.vue`、`materials.ts`
- Test: `src/components/list/__tests__/materials.test.ts`、`src/components/detail/__tests__/materials.test.ts`

**Interfaces:**
- Consumes: `register` from `@/core`
- Produces: `registerList()`、`registerDetail()`

- [ ] **Step 1: 写列表物料测试**

Create `src/components/list/__tests__/materials.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { clearRegistry, getMeta, listByGroup } from '@/core'
import { registerList } from '../materials'

describe('list materials', () => {
  beforeEach(() => clearRegistry())
  it('列表分组有 Table 和 SearchForm', () => {
    registerList()
    const types = listByGroup('列表').map((m) => m.type)
    expect(types).toEqual(expect.arrayContaining(['Table', 'SearchForm']))
  })
  it('Table 只能用于 list 页', () => {
    registerList()
    expect(getMeta('Table')?.pageTypes).toEqual(['list'])
  })
})
```

- [ ] **Step 2: 跑测试验证失败**

Run: `pnpm vitest run src/components/list`
Expected: FAIL

- [ ] **Step 3: 实现 TableField.vue**

Create `src/components/list/TableField.vue`：
```vue
<template>
  <a-table :columns="columns" :data-source="rows" :pagination="pagination" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  propValues: Record<string, unknown>
  value: unknown           // 运行时传入的列表数据 [{...}]
}>()
const columns = computed(() => (props.propValues.columns as any[]) ?? [])
const rows = computed(() => (props.value as any[]) ?? [])
const pagination = computed(() => ({ pageSize: Number(props.propValues.pageSize ?? 10) }))
</script>
```

- [ ] **Step 4: 实现 SearchField.vue**

Create `src/components/list/SearchField.vue`：
```vue
<template>
  <a-form layout="inline">
    <a-form-item v-for="f in fields" :key="f.field" :label="f.label">
      <a-input v-model:value="model[f.field]" :placeholder="f.label" />
    </a-form-item>
    <a-form-item><a-button type="primary" @click="emit('search', model)">查询</a-button></a-form-item>
  </a-form>
</template>
<script setup lang="ts">
import { reactive, computed } from 'vue'
const props = defineProps<{ propValues: Record<string, unknown> }>()
const emit = defineEmits<{ (e: 'search', v: Record<string, unknown>): void }>()
const fields = computed(() => (props.propValues.fields as Array<{ field: string; label: string }>) ?? [])
const model = reactive<Record<string, unknown>>({})
</script>
```

- [ ] **Step 5: 实现 list/materials.ts**

Create `src/components/list/materials.ts`：
```ts
import { register } from '@/core'
import TableField from './TableField.vue'
import SearchField from './SearchField.vue'

export function registerList() {
  register({
    type: 'Table', group: '列表', label: '数据表格', pageTypes: ['list'],
    propsSchema: [
      { name: 'columns', label: '列定义(JSON)', type: 'textarea' },
      { name: 'pageSize', label: '每页条数', type: 'number' },
    ],
  }, TableField)
  register({
    type: 'SearchForm', group: '列表', label: '查询表单', isContainer: false, pageTypes: ['list'],
    propsSchema: [{ name: 'fields', label: '查询字段(JSON)', type: 'textarea' }],
  }, SearchField)
}
```

- [ ] **Step 6: 跑列表测试通过**

Run: `pnpm vitest run src/components/list`
Expected: PASS

- [ ] **Step 7: 写详情测试 + 实现 DescriptionsField**

Create `src/components/detail/__tests__/materials.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { clearRegistry, getMeta, listByGroup } from '@/core'
import { registerDetail } from '../materials'

describe('detail materials', () => {
  beforeEach(() => clearRegistry())
  it('详情分组有 Descriptions', () => {
    registerDetail()
    expect(listByGroup('详情').map((m) => m.type)).toContain('Descriptions')
  })
  it('Descriptions 只用于 detail 页', () => {
    registerDetail()
    expect(getMeta('Descriptions')?.pageTypes).toEqual(['detail'])
  })
})
```

Create `src/components/detail/DescriptionsField.vue`：
```vue
<template>
  <a-descriptions bordered :column="column">
    <a-descriptions-item v-for="f in fields" :key="f.field" :label="f.label">
      {{ (value as any)?.[f.field] ?? '' }}
    </a-descriptions-item>
  </a-descriptions>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ propValues: Record<string, unknown>; value: unknown }>()
const fields = computed(() => (props.propValues.fields as Array<{ field: string; label: string }>) ?? [])
const column = computed(() => Number(props.propValues.column ?? 1))
</script>
```

Create `src/components/detail/materials.ts`：
```ts
import { register } from '@/core'
import DescriptionsField from './DescriptionsField.vue'
export function registerDetail() {
  register({
    type: 'Descriptions', group: '详情', label: '详情描述', pageTypes: ['detail'],
    propsSchema: [
      { name: 'fields', label: '字段(JSON)', type: 'textarea' },
      { name: 'column', label: '每行列数', type: 'number' },
    ],
  }, DescriptionsField)
}
```

- [ ] **Step 8: 跑详情测试通过**

Run: `pnpm vitest run src/components/detail`
Expected: PASS

- [ ] **Step 9: 提交**

```bash
git add src/components/list src/components/detail
git commit -m "feat(components): 列表 + 详情物料"
```

---

### Task 9: 物料统一注册入口

**Files:**
- Create: `src/components/index.ts`

- [ ] **Step 1: 写统一注册测试**

Create `src/components/__tests__/index.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { clearRegistry, listAll } from '@/core'
import { registerAll } from '../index'

describe('registerAll', () => {
  beforeEach(() => clearRegistry())
  it('注册全部物料（8 表单 + 2 布局 + 2 列表 + 1 详情 = 13）', () => {
    registerAll()
    expect(listAll()).toHaveLength(13)
  })
})
```

- [ ] **Step 2: 跑测试失败**

Run: `pnpm vitest run src/components/__tests__`
Expected: FAIL

- [ ] **Step 3: 实现**

Create `src/components/index.ts`：
```ts
import { registerFormFields } from './form-fields/materials'
import { registerLayout } from './layout/materials'
import { registerList } from './list/materials'
import { registerDetail } from './detail/materials'

export function registerAll() {
  registerFormFields()
  registerLayout()
  registerList()
  registerDetail()
}
```

- [ ] **Step 4: 跑测试通过**

Run: `pnpm vitest run src/components/__tests__`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/index.ts src/components/__tests__
git commit -m "feat(components): 统一注册入口 registerAll"
```

---

## Phase D — 运行时

### Task 10: 渲染器 Renderer + NodeView

**Files:**
- Create: `src/runtime/renderer/NodeView.vue`、`Renderer.vue`
- Test: `src/runtime/renderer/__tests__/Renderer.test.ts`

**Interfaces:**
- Consumes: `resolveComponent` from `@/core`、`ComponentNode` from `@/core`、`PageRuntimeContext`（数据总线，Task 11 提供）
- Produces: `Renderer.vue` props `{ schema: PageSchema; ctx: PageRuntimeContext }`，按 schema 渲染整个页面

NodeView 职责：
1. `resolveComponent(node.type)` 拿 Vue 组件
2. 透传 `propValues = node.props`、`value`（从数据总线按 `bindings.field` 取）
3. 若是容器（type==='Row'）：用 `a-row` 包，children 各自包 `a-col`（span = 24/columns * colSpan），colSpan 默认 1，从 child.props.colSpan 读
4. 监听子组件 `update:value` → 写回数据总线

- [ ] **Step 1: 写渲染测试（用已注册的 Input 物料）**

Create `src/runtime/renderer/__tests__/Renderer.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { clearRegistry } from '@/core'
import { registerAll } from '@/components'
import Renderer from '../Renderer.vue'
import type { PageSchema } from '@/core'

const schema: PageSchema = {
  version: 1, type: 'form', id: 'p1', name: 't',
  body: [
    { id: 'n1', type: 'Input', props: { label: '客户名' }, bindings: { field: 'name' } },
  ],
}

describe('Renderer', () => {
  beforeEach(() => { clearRegistry(); registerAll() })
  it('渲染 Input 并显示 label', () => {
    const ctx = { data: reactive({}), async refresh() {}, error: null }
    const w = mount(Renderer, { props: { schema, ctx } })
    expect(w.text()).toContain('客户名')
  })
}
)
```

- [ ] **Step 2: 跑测试失败**

Run: `pnpm vitest run src/runtime/renderer`
Expected: FAIL

- [ ] **Step 3: 实现 NodeView.vue**

Create `src/runtime/renderer/NodeView.vue`：
```vue
<template>
  <component
    :is="comp"
    v-if="comp && !isRow"
    :prop-values="node.props"
    :value="fieldValue"
    @update:value="onUpdate"
    @submit="emit('submit')"
    @reset="emit('reset')"
    @search="(v: any) => emit('search', v)"
  />
  <a-row v-else-if="isRow" :gutter="16">
    <a-col
      v-for="child in node.children"
      :key="child.id"
      :span="colSpan(child)"
    >
      <NodeView :node="child" :ctx="ctx" @submit="emit('submit')" @reset="emit('reset')" @search="emit('search',$event)" />
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveComponent, type ComponentNode } from '@/core'
import type { PageRuntimeContext } from '../usePageRuntime'
import NodeView from './NodeView.vue'

const props = defineProps<{
  node: ComponentNode
  ctx: PageRuntimeContext
}>()
const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
  (e: 'search', v: Record<string, unknown>): void
}>()

const comp = computed(() => resolveComponent<any>(props.node.type))
const isRow = computed(() => props.node.type === 'Row')
const fieldValue = computed(() => {
  const f = props.node.bindings?.field
  return f ? props.ctx.data[f] : undefined
})
function onUpdate(v: unknown) {
  const f = props.node.bindings?.field
  if (f) props.ctx.data[f] = v as any
}
function colSpan(child: ComponentNode) {
  const columns = Number(props.node.props.columns ?? 1)
  const colSpan = Number(child.props.colSpan ?? 1)
  return Math.floor((24 / columns) * colSpan)
}
</script>
```

- [ ] **Step 4: 实现 Renderer.vue**

Create `src/runtime/renderer/Renderer.vue`：
```vue
<template>
  <div class="renderer" v-if="!ctx.error">
    <NodeView
      v-for="node in schema.body"
      :key="node.id"
      :node="node"
      :ctx="ctx"
      @submit="onSubmit"
      @reset="onReset"
      @search="onSearch"
    />
  </div>
  <a-result v-else status="error" title="加载失败" sub-title="点此重试">
    <template #extra><a-button type="primary" @click="ctx.refresh()">重试</a-button></template>
  </a-result>
</template>

<script setup lang="ts">
import type { PageSchema } from '@/core'
import type { PageRuntimeContext } from '../usePageRuntime'
import NodeView from './NodeView.vue'
import { message } from 'ant-design-vue'

const props = defineProps<{ schema: PageSchema; ctx: PageRuntimeContext }>()
function onSubmit() { props.ctx.submit() }
function onReset() { props.ctx.reset() }
function onSearch(v: Record<string, unknown>) {
  message.info('查询条件已收到：' + JSON.stringify(v))
  props.ctx.refresh(v)
}
</script>
```

- [ ] **Step 5: 跑测试通过**

Run: `pnpm vitest run src/runtime/renderer`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/runtime/renderer
git commit -m "feat(runtime): Renderer + NodeView 递归渲染"
```

---

### Task 11: 数据总线 + 数据源执行器

**Files:**
- Create: `src/runtime/datasource/executor.ts`
- Create: `src/runtime/usePageRuntime.ts`
- Create: `src/runtime/index.ts`
- Test: `src/runtime/datasource/__tests__/executor.test.ts`、`src/runtime/__tests__/usePageRuntime.test.ts`

**Interfaces:**
- Consumes: `PageSchema`、`DataSourceSchema` from `@/core`
- Produces:
  - `exec(config: DataSourceLoad | DataSourceSubmit, body?: unknown): Promise<any>`
  - `PageRuntimeContext` 接口：`{ data: Record<string,unknown>; error: Error|null; refresh(params?): Promise<void>; submit(): Promise<void>; reset(): void }`
  - `usePageRuntime(schema): PageRuntimeContext`

- [ ] **Step 1: 写 executor 测试**

Create `src/runtime/datasource/__tests__/executor.test.ts`：
```ts
import { describe, it, expect, vi } from 'vitest'
import { exec } from '../executor'

describe('datasource executor', () => {
  it('GET 拼装 url + method', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ a: 1 }), { status: 200 }))
    await exec({ url: '/api/x', method: 'GET' })
    expect(spy).toHaveBeenCalledWith('/api/x', expect.objectContaining({ method: 'GET' }))
    spy.mockRestore()
  })
  it('POST 带 body 且 JSON 序列化', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await exec({ url: '/api/x', method: 'POST' }, { name: 'a' })
    const [, opts] = spy.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(opts.body).toBe(JSON.stringify({ name: 'a' }))
    spy.mockRestore()
  })
  it('非 2xx 抛错', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }))
    await expect(exec({ url: '/x', method: 'GET' })).rejects.toThrow()
  })
})
```

- [ ] **Step 2: 跑测试失败**

Run: `pnpm vitest run src/runtime/datasource`
Expected: FAIL

- [ ] **Step 3: 实现 executor**

Create `src/runtime/datasource/executor.ts`：
```ts
import type { DataSourceLoad, DataSourceSubmit } from '@/core'

type Config = DataSourceLoad | DataSourceSubmit

export async function exec(config: Config, body?: unknown): Promise<any> {
  const headers: Record<string, string> = {}
  let payload: BodyInit | undefined
  if (body !== undefined && (config.method === 'POST' || config.method === 'PUT')) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(config.url, { method: config.method, headers, body: payload })
  if (!res.ok) throw new Error(`请求失败 ${res.status}: ${config.url}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
```

- [ ] **Step 4: 跑 executor 测试通过**

Run: `pnpm vitest run src/runtime/datasource`
Expected: PASS

- [ ] **Step 5: 写 usePageRuntime 测试**

Create `src/runtime/__tests__/usePageRuntime.test.ts`：
```ts
import { describe, it, expect, vi } from 'vitest'
import { usePageRuntime } from '../usePageRuntime'
import type { PageSchema } from '@/core'

const schema: PageSchema = {
  version: 1, type: 'form', id: 'p1', name: 't',
  dataSource: { submit: { url: '/api/x', method: 'POST' } },
  body: [{ id: 'n1', type: 'Input', props: {}, bindings: { field: 'name' } }],
}

describe('usePageRuntime', () => {
  it('submit 把数据总线内容 POST 出去', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const ctx = usePageRuntime(schema)
    ctx.data.name = '张三'
    await ctx.submit()
    const [, opts] = spy.mock.calls[0]
    expect(opts.body).toBe(JSON.stringify({ name: '张三' }))
    spy.mockRestore()
  })
  it('reset 清空数据总线', () => {
    const ctx = usePageRuntime(schema)
    ctx.data.name = 'x'
    ctx.reset()
    expect(ctx.data.name).toBeUndefined()
  })
})
```

- [ ] **Step 6: 跑测试失败**

Run: `pnpm vitest run src/runtime/__tests__`
Expected: FAIL

- [ ] **Step 7: 实现 usePageRuntime**

Create `src/runtime/usePageRuntime.ts`：
```ts
import { reactive } from 'vue'
import { message } from 'ant-design-vue'
import type { PageSchema } from '@/core'
import { exec } from './datasource/executor'

export interface PageRuntimeContext {
  data: Record<string, unknown>
  error: Error | null
  refresh(params?: Record<string, unknown>): Promise<void>
  submit(): Promise<void>
  reset(): void
}

export function usePageRuntime(schema: PageSchema): PageRuntimeContext {
  const data = reactive<Record<string, unknown>>({})
  const ctx: PageRuntimeContext = {
    data,
    error: null,
    async refresh(params) {
      const load = schema.dataSource?.load
      if (!load) return
      try {
        ctx.error = null
        const res = await exec(load, params)
        Object.assign(data, res)
      } catch (e) {
        ctx.error = e as Error
        message.error('加载失败')
      }
    },
    async submit() {
      const submit = schema.dataSource?.submit
      if (!submit) return
      try {
        await exec(submit, { ...data })
        message.success('提交成功')
      } catch (e) {
        message.error('提交失败：' + (e as Error).message)
      }
    },
    reset() {
      for (const k of Object.keys(data)) delete data[k]
    },
  }
  return ctx
}
```

- [ ] **Step 8: 跑测试通过**

Run: `pnpm vitest run src/runtime/__tests__`
Expected: PASS

- [ ] **Step 9: runtime/index.ts 出口**

Create `src/runtime/index.ts`：
```ts
export { exec } from './datasource/executor'
export { usePageRuntime } from './usePageRuntime'
export type { PageRuntimeContext } from './usePageRuntime'
export { default as Renderer } from './renderer/Renderer.vue'
```

- [ ] **Step 10: 提交**

```bash
git add src/runtime
git commit -m "feat(runtime): 数据总线 + 数据源执行器"
```

---

## Phase E — 存储

### Task 12: PageStorage 接口 + localStorage 实现

**Files:**
- Create: `src/storage/types.ts`、`src/storage/local-storage.ts`、`src/storage/index.ts`
- Test: `src/storage/__tests__/local-storage.test.ts`

**Interfaces:**
- Produces: `PageStorage` 接口、`PageMeta`、`LocalStorage` 类、默认实例 `pageStorage`

- [ ] **Step 1: 写测试（mock localStorage）**

Create `src/storage/__tests__/local-storage.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorage } from '../local-storage'
import type { PageSchema } from '@/core'

const page: PageSchema = { version: 1, type: 'form', id: 'p1', name: '测试', body: [] }

function memStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v) },
    removeItem: (k: string) => { m.delete(k) },
  } as unknown as Storage
}

describe('LocalStorage', () => {
  let s: LocalStorage
  beforeEach(() => { s = new LocalStorage(memStorage()) })
  it('save 后 list 能看到，get 能取回', async () => {
    await s.save(page)
    const list = await s.list()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('p1')
    const got = await s.get('p1')
    expect(got?.name).toBe('测试')
  })
  it('save 同 id 为更新', async () => {
    await s.save(page)
    await s.save({ ...page, name: '改名' })
    const list = await s.list()
    expect(list).toHaveLength(1)
    expect((await s.get('p1'))?.name).toBe('改名')
  })
  it('remove 后找不到', async () => {
    await s.save(page)
    await s.remove('p1')
    expect(await s.get('p1')).toBeNull()
    expect(await s.list()).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 跑测试失败**

Run: `pnpm vitest run src/storage`
Expected: FAIL

- [ ] **Step 3: 实现 types.ts**

Create `src/storage/types.ts`：
```ts
import type { PageSchema, PageType } from '@/core'

export interface PageMeta {
  id: string
  name: string
  type: PageType
  updatedAt: number
}

export interface PageStorage {
  list(): Promise<PageMeta[]>
  get(id: string): Promise<PageSchema | null>
  save(schema: PageSchema): Promise<void>
  remove(id: string): Promise<void>
}
```

- [ ] **Step 4: 实现 local-storage.ts**

Create `src/storage/local-storage.ts`：
```ts
import type { PageSchema } from '@/core'
import type { PageMeta, PageStorage } from './types'

const INDEX_KEY = 'lowcode:pages:index'
const pageKey = (id: string) => `lowcode:page:${id}`

export class LocalStorage implements PageStorage {
  constructor(private backend: Storage = globalThis.localStorage) {}

  async list(): Promise<PageMeta[]> {
    const raw = this.backend.getItem(INDEX_KEY)
    return raw ? (JSON.parse(raw) as PageMeta[]) : []
  }
  async get(id: string): Promise<PageSchema | null> {
    const raw = this.backend.getItem(pageKey(id))
    return raw ? (JSON.parse(raw) as PageSchema) : null
  }
  async save(schema: PageSchema): Promise<void> {
    this.backend.setItem(pageKey(schema.id), JSON.stringify(schema))
    const list = await this.list()
    const idx = list.findIndex((m) => m.id === schema.id)
    const meta: PageMeta = { id: schema.id, name: schema.name, type: schema.type, updatedAt: Date.now() }
    if (idx >= 0) list[idx] = meta; else list.push(meta)
    this.backend.setItem(INDEX_KEY, JSON.stringify(list))
  }
  async remove(id: string): Promise<void> {
    this.backend.removeItem(pageKey(id))
    const list = (await this.list()).filter((m) => m.id !== id)
    this.backend.setItem(INDEX_KEY, JSON.stringify(list))
  }
}
```

- [ ] **Step 5: 实现 index.ts（默认实例 + 导入导出工具）**

Create `src/storage/index.ts`：
```ts
import type { PageSchema } from '@/core'
import { LocalStorage } from './local-storage'
import { validateSchema } from '@/core'

export * from './types'
export const pageStorage: LocalStorage = new LocalStorage()

// 导出 schema 为 JSON 文件下载
export function exportSchema(schema: PageSchema): void {
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${schema.id}.page.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入并校验 schema
export async function importSchema(text: string): Promise<PageSchema> {
  const obj = JSON.parse(text)
  const r = validateSchema(obj)
  if (!r.valid) throw new Error('schema 非法：' + r.errors.join('; '))
  return obj as PageSchema
}
```

- [ ] **Step 6: 跑测试通过**

Run: `pnpm vitest run src/storage`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add src/storage
git commit -m "feat(storage): PageStorage 接口 + localStorage 实现 + 导入导出"
```

---

## Phase F — 设计器

### Task 13: 设计器状态（Pinia editor store）

**Files:**
- Create: `src/designer/store/editor.ts`
- Test: `src/designer/store/__tests__/editor.test.ts`

**Interfaces:**
- Produces: Pinia store `useEditorStore`，state `{ schema: PageSchema; selectedId: string | null; history: PageSchema[] }`，actions：
  - `setSchema(schema)`、`selectNode(id)`、`addNode(parentId, node)`、`removeNode(id)`、`updateProps(id, props)`、`undo()`
  - `setDataSource(ds)`、`setName(name)`
  - getter `selectedNode`

- [ ] **Step 1: 写测试**

Create `src/designer/store/__tests__/editor.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEditorStore } from '../editor'
import type { PageSchema } from '@/core'

const base: PageSchema = { version: 1, type: 'form', id: 'p1', name: 't', body: [] }

describe('editor store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('addNode 往 body 加节点', () => {
    const s = useEditorStore()
    s.setSchema(base)
    s.addNode('__root__', { id: 'n1', type: 'Input', props: { label: 'a' } })
    expect(s.schema.body).toHaveLength(1)
    expect(s.schema.body[0].id).toBe('n1')
  })
  it('addNode 容器内加子节点', () => {
    const s = useEditorStore()
    s.setSchema({ ...base, body: [{ id: 'r1', type: 'Row', props: { columns: 2 }, children: [] }] })
    s.addNode('r1', { id: 'n1', type: 'Input', props: {} })
    expect(s.schema.body[0].children).toHaveLength(1)
  })
  it('updateProps 改属性', () => {
    const s = useEditorStore()
    s.setSchema({ ...base, body: [{ id: 'n1', type: 'Input', props: { label: 'a' } }] })
    s.updateProps('n1', { label: 'b' })
    expect(s.schema.body[0].props.label).toBe('b')
  })
  it('removeNode 删除', () => {
    const s = useEditorStore()
    s.setSchema({ ...base, body: [{ id: 'n1', type: 'Input', props: {} }] })
    s.removeNode('n1')
    expect(s.schema.body).toHaveLength(0)
  })
  it('undo 回到上一步', () => {
    const s = useEditorStore()
    s.setSchema(base)
    s.addNode('__root__', { id: 'n1', type: 'Input', props: {} })
    s.undo()
    expect(s.schema.body).toHaveLength(0)
  })
  it('selectedNode getter', () => {
    const s = useEditorStore()
    s.setSchema({ ...base, body: [{ id: 'n1', type: 'Input', props: {} }] })
    s.selectNode('n1')
    expect(s.selectedNode?.id).toBe('n1')
  })
})
```

- [ ] **Step 2: 跑测试失败**

Run: `pnpm vitest run src/designer/store`
Expected: FAIL

- [ ] **Step 3: 实现 editor store**

Create `src/designer/store/editor.ts`：
```ts
import { defineStore } from 'pinia'
import type { ComponentNode, DataSourceSchema, PageSchema } from '@/core'

const ROOT = '__root__'

function findNode(nodes: ComponentNode[], id: string): ComponentNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) { const f = findNode(n.children, id); if (f) return f }
  }
  return undefined
}
function findParent(nodes: ComponentNode[], id: string, parent: ComponentNode[] | null): ComponentNode[] | null {
  for (const n of nodes) {
    if (n.id === id) return nodes
    if (n.children) { const p = findParent(n.children, id, nodes); if (p) return p }
  }
  return null
}

export const useEditorStore = defineStore('editor', {
  state: () => ({
    schema: { version: 1, type: 'form' as const, id: '', name: '未命名', body: [] } as PageSchema,
    selectedId: null as string | null,
    history: [] as PageSchema[],
  }),
  getters: {
    selectedNode(state): ComponentNode | undefined {
      if (!state.selectedId) return undefined
      return findNode(state.schema.body, state.selectedId)
    },
  },
  actions: {
    setSchema(s: PageSchema) { this.schema = JSON.parse(JSON.stringify(s)); this.history = [] },
    snapshot() { this.history.push(JSON.parse(JSON.stringify(this.schema))) },
    selectNode(id: string | null) { this.selectedId = id },
    addNode(parentId: string, node: ComponentNode) {
      this.snapshot()
      if (parentId === ROOT) { this.schema.body.push(node); return }
      const parent = findNode(this.schema.body, parentId)
      if (parent) { parent.children = parent.children ?? []; parent.children.push(node) }
    },
    removeNode(id: string) {
      this.snapshot()
      const parent = findParent(this.schema.body, id, null)
      if (parent) { const i = parent.findIndex((n) => n.id === id); if (i >= 0) parent.splice(i, 1) }
    },
    updateProps(id: string, props: Record<string, unknown>) {
      const n = findNode(this.schema.body, id)
      if (n) n.props = { ...n.props, ...props }
    },
    setDataSource(ds: DataSourceSchema) { this.schema.dataSource = ds },
    setName(name: string) { this.schema.name = name },
    undo() {
      const prev = this.history.pop()
      if (prev) this.schema = prev
    },
  },
})
```

- [ ] **Step 4: 跑测试通过**

Run: `pnpm vitest run src/designer/store`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/designer/store
git commit -m "feat(designer): editor store（增删改节点 + 撤销）"
```

---

### Task 14: 物料面板 + 画布 + 属性面板

**Files:**
- Create: `src/designer/panels/MaterialPanel.vue`、`PropertyPanel.vue`、`OutlinePanel.vue`
- Create: `src/designer/canvas/Canvas.vue`
- Create: `src/designer/DesignerView.vue`
- Test: `src/designer/__tests__/DesignerView.test.ts`

**Interfaces:**
- Consumes: `useEditorStore`、`listAll`/`getMeta` from `@/core`、`Renderer`/`usePageRuntime` from `@/runtime`、`PropsForm`

- [ ] **Step 1: 写 DesignerView 冒烟测试**

Create `src/designer/__tests__/DesignerView.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { clearRegistry } from '@/core'
import { registerAll } from '@/components'
import DesignerView from '../DesignerView.vue'

describe('DesignerView', () => {
  beforeEach(() => { setActivePinia(createPinia()); clearRegistry(); registerAll() })
  it('三栏渲染：物料面板 + 画布 + 属性面板', () => {
    const w = mount(DesignerView, { global: { stubs: ['router-link'] } })
    expect(w.text()).toContain('物料')
    expect(w.text()).toContain('属性')
  })
})
```

- [ ] **Step 2: 跑测试失败**

Run: `pnpm vitest run src/designer/__tests__`
Expected: FAIL

- [ ] **Step 3: 实现 MaterialPanel.vue**

Create `src/designer/panels/MaterialPanel.vue`：
```vue
<template>
  <div class="material-panel">
    <h3>物料</h3>
    <div v-for="g in groups" :key="g.name" class="group">
      <div class="group-title">{{ g.name }}</div>
      <div
        v-for="m in g.items" :key="m.type"
        class="material-item"
        draggable="true"
        @dragstart="onDragStart(m.type)"
      >{{ m.label }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { listAll, getMeta, type PageType } from '@/core'
import { useEditorStore } from '../store/editor'

const props = defineProps<{ pageType: PageType }>()
const store = useEditorStore()

const groups = computed(() => {
  const all = listAll().filter((m) => !m.pageTypes || m.pageTypes.includes(props.pageType))
  const map = new Map<string, typeof all>()
  for (const m of all) { const arr = map.get(m.group) ?? []; arr.push(m); map.set(m.group, arr) }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})
function onDragStart(type: string) {
  // 用 dataTransfer 传递物料 type
  ;(globalThis as any).__dragType = type
}
</script>
```

- [ ] **Step 4: 实现 Canvas.vue**

Create `src/designer/canvas/Canvas.vue`：
```vue
<template>
  <div class="canvas" @dragover.prevent @drop="onDrop">
    <Renderer v-if="store.schema.body.length" :schema="store.schema" :ctx="ctx" />
    <div v-else class="empty">把左侧物料拖到这里</div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../store/editor'
import { Renderer, usePageRuntime, type PageRuntimeContext } from '@/runtime'
import { getMeta } from '@/core'

const store = useEditorStore()
const ctx: PageRuntimeContext = usePageRuntime(store.schema)

function onDrop() {
  const type = (globalThis as any).__dragType as string | undefined
  if (!type) return
  const meta = getMeta(type)
  if (!meta) return
  // 新节点 id 用计数
  const id = `n${Date.now()}`
  const props: Record<string, unknown> = {}
  for (const p of meta.propsSchema) if (p.default !== undefined) props[p.name] = p.default
  store.addNode('__root__', { id, type, props, ...(meta.isContainer ? { children: [] } : {}) })
  store.selectNode(id)
}
</script>
```

> 注：`usePageRuntime(store.schema)` 这里 schema 是响应式的，画布仅做预览，提交等操作在设计器内不实际生效（无伤大雅）。

- [ ] **Step 5: 实现 PropertyPanel.vue**

Create `src/designer/panels/PropertyPanel.vue`：
```vue
<template>
  <div class="property-panel">
    <h3>属性</h3>
    <div v-if="!node" class="empty">未选中组件</div>
    <PropsForm v-else :fields="fields" :model-value="node.props" @update:model-value="onUpdate" />
    <div v-if="node">
      <h4>数据绑定</h4>
      <a-input
        :value="node.bindings?.field ?? ''"
        placeholder="字段名"
        @update:value="(v:any) => store.updateBindings(node!.id, v)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../store/editor'
import { getMeta } from '@/core'
import PropsForm from '@/components/props-panel/PropsForm.vue'

const store = useEditorStore()
const node = computed(() => store.selectedNode)
const fields = computed(() => (node.value ? getMeta(node.value.type)?.propsSchema ?? [] : []))
function onUpdate(v: Record<string, unknown>) {
  if (node.value) store.updateProps(node.value.id, v)
}
</script>
```

> 需要 store 补一个 `updateBindings` action（见 Step 6）。

- [ ] **Step 6: 给 editor store 加 updateBindings**

Modify `src/designer/store/editor.ts`，在 actions 里加：
```ts
    updateBindings(id: string, field: string) {
      const n = findNode(this.schema.body, id)
      if (n) n.bindings = { ...(n.bindings ?? {}), field }
    },
```

- [ ] **Step 7: 实现 OutlinePanel.vue**

Create `src/designer/panels/OutlinePanel.vue`：
```vue
<template>
  <div class="outline">
    <h3>大纲</h3>
    <ul>
      <li v-for="n in store.schema.body" :key="n.id"
          :class="{ active: n.id === store.selectedId }"
          @click="store.selectNode(n.id)">
        {{ n.type }} <span class="muted">{{ n.id }}</span>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { useEditorStore } from '../store/editor'
const store = useEditorStore()
</script>
```

- [ ] **Step 8: 实现 DesignerView.vue**

Create `src/designer/DesignerView.vue`：
```vue
<template>
  <div class="designer">
    <div class="toolbar">
      <a-select :value="store.schema.type" style="width:120px"
        @change="(v:any) => store.schema.type = v"
        :options="[{label:'表单',value:'form'},{label:'列表',value:'list'},{label:'详情',value:'detail'}]" />
      <a-input :value="store.schema.name" style="width:160px" @update:value="(v:any)=>store.setName(v)" />
      <a-button @click="store.undo()">撤销</a-button>
      <a-button type="primary" @click="onSave">保存</a-button>
      <PageSettings />
    </div>
    <div class="body">
      <div class="left"><MaterialPanel :page-type="store.schema.type" /><OutlinePanel /></div>
      <div class="center"><Canvas /></div>
      <div class="right"><PropertyPanel /></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useEditorStore } from './store/editor'
import MaterialPanel from './panels/MaterialPanel.vue'
import PropertyPanel from './panels/PropertyPanel.vue'
import OutlinePanel from './panels/OutlinePanel.vue'
import Canvas from './canvas/Canvas.vue'
import PageSettings from './toolbar/PageSettings.vue'
import { pageStorage } from '@/storage'
import { message } from 'ant-design-vue'

const store = useEditorStore()
async function onSave() {
  await pageStorage.save(store.schema)
  message.success('已保存')
}
</script>
<style scoped>
.designer { display:flex; flex-direction:column; height:100vh; }
.toolbar { display:flex; gap:8px; padding:8px; border-bottom:1px solid #eee; align-items:center; }
.body { display:flex; flex:1; }
.left { width:220px; border-right:1px solid #eee; overflow:auto; }
.center { flex:1; overflow:auto; padding:16px; }
.right { width:300px; border-left:1px solid #eee; overflow:auto; padding:8px; }
.muted { color:#999; font-size:12px; }
.outline .active { background:#e6f4ff; }
</style>
```

- [ ] **Step 9: 跑测试通过**

Run: `pnpm vitest run src/designer/__tests__`
Expected: PASS

- [ ] **Step 10: 提交**

```bash
git add src/designer
git commit -m "feat(designer): 物料面板/画布/属性面板/大纲 + DesignerView"
```

---

### Task 15: 页面设置（数据源配置）

**Files:**
- Create: `src/designer/toolbar/PageSettings.vue`

**Interfaces:**
- Consumes: `useEditorStore`

- [ ] **Step 1: 实现 PageSettings.vue**

Create `src/designer/toolbar/PageSettings.vue`：
```vue
<template>
  <a-button @click="visible = true">页面设置</a-button>
  <a-modal v-model:open="visible" title="页面设置（数据源）" @ok="onOk">
    <a-form layout="vertical">
      <a-divider>加载（load）</a-divider>
      <a-form-item label="URL"><a-input v-model:value="load.url" /></a-form-item>
      <a-form-item label="Method">
        <a-radio-group v-model:value="load.method">
          <a-radio value="GET">GET</a-radio><a-radio value="POST">POST</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-divider>提交（submit）</a-divider>
      <a-form-item label="URL"><a-input v-model:value="submit.url" /></a-form-item>
      <a-form-item label="Method">
        <a-radio-group v-model:value="submit.method">
          <a-radio value="POST">POST</a-radio><a-radio value="PUT">PUT</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useEditorStore } from '../store/editor'

const store = useEditorStore()
const visible = ref(false)
import { ref } from 'vue'
const load = reactive({ url: '', method: 'GET' as 'GET' | 'POST' })
const submit = reactive({ url: '', method: 'POST' as 'POST' | 'PUT' })

watch(visible, (v) => {
  if (!v) return
  load.url = store.schema.dataSource?.load?.url ?? ''
  load.method = store.schema.dataSource?.load?.method ?? 'GET'
  submit.url = store.schema.dataSource?.submit?.url ?? ''
  submit.method = store.schema.dataSource?.submit?.method ?? 'POST'
})
function onOk() {
  const ds: any = {}
  if (load.url) ds.load = { ...load }
  if (submit.url) ds.submit = { ...submit }
  store.setDataSource(ds)
  visible.value = false
}
</script>
```

- [ ] **Step 2: 手动验证（在浏览器里）**

Run: `pnpm dev`，打开 `/designer/new`（路由在 Task 16 加），点击「页面设置」配置 url，保存后看 localStorage 里 schema 是否含 dataSource。Expected：配置正确写入。

- [ ] **Step 3: 提交**

```bash
git add src/designer/toolbar
git commit -m "feat(designer): 页面设置弹窗（数据源配置）"
```

---

## Phase G — 集成

### Task 16: 应用壳、路由、页面列表、运行时预览

**Files:**
- Create: `src/router.ts`、`src/views/PageList.vue`、`src/views/DesignerPage.vue`、`src/views/RenderView.vue`
- Modify: `src/main.ts`、`src/App.vue`

**Interfaces:**
- Consumes: `pageStorage`、`useEditorStore`、`Renderer`、`usePageRuntime`、`registerAll`

- [ ] **Step 1: 实现 PageList.vue**

Create `src/views/PageList.vue`：
```vue
<template>
  <div style="padding:24px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2>页面管理</h2>
      <div>
        <a-upload :show-upload-list="false" :before-upload="onImport"><a-button>导入 JSON</a-button></a-upload>
        <a-button type="primary" @click="onNew" style="margin-left:8px">新建页面</a-button>
      </div>
    </div>
    <a-table :columns="cols" :data-source="rows" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <router-link :to="`/designer/${record.id}`">编辑</router-link>
          <a style="margin-left:8px" @click="onPreview(record.id)">预览</a>
          <a-popconfirm title="删除？" @confirm="onRemove(record.id)"><a style="margin-left:8px;color:red">删除</a></a-popconfirm>
        </template>
      </template>
    </a-table>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { pageStorage, exportSchema, importSchema } from '@/storage'
import type { PageMeta } from '@/storage'

const router = useRouter()
const rows = ref<PageMeta[]>([])
const cols = [
  { title: '名称', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type' },
  { title: '更新时间', dataIndex: 'updatedAt' },
  { title: '操作', key: 'action' },
]
async function refresh() { rows.value = await pageStorage.list() }
onMounted(refresh)
function onNew() { router.push('/designer/new') }
function onPreview(id: string) { router.push(`/render/${id}`) }
async function onRemove(id: string) { await pageStorage.remove(id); refresh() }
async function onImport(file: File) {
  const text = await file.text()
  const schema = await importSchema(text)
  await pageStorage.save(schema)
  refresh()
  return false   // 阻止 antd 自动上传
}
</script>
```

- [ ] **Step 2: 实现 DesignerPage.vue（设计器壳，加载/新建）**

Create `src/views/DesignerPage.vue`：
```vue
<template>
  <DesignerView v-if="loaded" />
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEditorStore } from '@/designer/store/editor'
import { pageStorage } from '@/storage'
import DesignerView from '@/designer/DesignerView.vue'
import type { PageSchema } from '@/core'

const route = useRoute()
const store = useEditorStore()
const loaded = ref(false)

async function load(id: string) {
  loaded.value = false
  if (id === 'new') {
    const newId = `page_${Date.now()}`
    const blank: PageSchema = { version: 1, type: 'form', id: newId, name: '未命名页面', body: [] }
    store.setSchema(blank)
  } else {
    const s = await pageStorage.get(id)
    if (s) store.setSchema(s)
  }
  loaded.value = true
}
onMounted(() => load(route.params.id as string))
watch(() => route.params.id, (id) => id && load(id as string))
</script>
```

- [ ] **Step 3: 实现 RenderView.vue（运行时预览 + 导出按钮）**

Create `src/views/RenderView.vue`：
```vue
<template>
  <div style="padding:24px">
    <div style="margin-bottom:8px">
      <a-button @click="onExport">导出 JSON</a-button>
    </div>
    <Renderer v-if="schema" :schema="schema" :ctx="ctx" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { pageStorage, exportSchema } from '@/storage'
import { Renderer, usePageRuntime, type PageRuntimeContext } from '@/runtime'
import type { PageSchema } from '@/core'

const route = useRoute()
const schema = ref<PageSchema | null>(null)
const ctx = ref<PageRuntimeContext | null>(null)

onMounted(async () => {
  const s = await pageStorage.get(route.params.id as string)
  if (s) { schema.value = s; ctx.value = usePageRuntime(s); ctx.value.refresh() }
})
function onExport() { if (schema.value) exportSchema(schema.value) }
</script>
```

- [ ] **Step 4: 实现 router.ts**

Create `src/router.ts`：
```ts
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/views/PageList.vue') },
    { path: '/designer/:id', component: () => import('@/views/DesignerPage.vue') },
    { path: '/render/:id', component: () => import('@/views/RenderView.vue') },
  ],
})
```

- [ ] **Step 5: 改写 main.ts**

Create/overwrite `src/main.ts`：
```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import { router } from './router'
import { registerAll } from './components'

registerAll()

createApp(App).use(createPinia()).use(router).use(Antd).mount('#app')
```

- [ ] **Step 6: 跑全量测试**

Run: `pnpm vitest run`
Expected: 全部 PASS

- [ ] **Step 7: 手动验证端到端**

Run: `pnpm dev`
验证流程：
1. 访问 `/` → 新建页面 → 进入设计器
2. 拖入 Row（设 columns=2）→ 拖入两个 Input → 改属性、绑字段
3. 点「页面设置」配 submit url → 保存
4. 回 `/` 看到列表 → 点预览 → 表单填值 → 提交（看 Network 是否 POST）
5. 点导出 → 得到 JSON 文件 → 回列表导入 → 还原

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat: 应用壳路由 + 页面列表 + 运行时预览（MVP 完成）"
```

---

## Phase H — 出码占位（接口预留，不实现）

### Task 17: codegen 占位

**Files:**
- Create: `src/codegen/vue-codegen.ts`

- [ ] **Step 1: 写占位（导出未实现签名）**

Create `src/codegen/vue-codegen.ts`：
```ts
import type { PageSchema } from '@/core'

/**
 * MVP 不实现：把 PageSchema 翻译为 .vue 源码。
 * 此函数仅为接口预留，确保 schema 设计可被静态翻译。
 * 将来实现：遍历 body，按 type 映射到 antd 标签拼模板字符串。
 */
export function generateVue(_schema: PageSchema): string {
  throw new Error('codegen 尚未实现（MVP 仅预留接口）')
}
```

- [ ] **Step 2: 提交**

```bash
git add src/codegen
git commit -m "feat(codegen): 占位接口（MVP 不实现）"
```

---

## 完成标准

- 所有 `pnpm vitest run` 通过
- Task 16 Step 7 的手动端到端流程跑通
- `src/core` 不依赖 Vue（`grep -r "vue" src/core` 无结果）
- 依赖方向无环：`runtime` 不 import `designer`，`codegen` 不 import `designer`/`runtime`（验证：`grep -rn "designer" src/runtime src/codegen` 无结果）

## 后续（不在本计划）

- 出码（codegen）实现
- 后端 PageStorage 实现（替换 localStorage）
- 版本历史、用户权限、多人协同
- 富文本/图表/上传等扩展物料
