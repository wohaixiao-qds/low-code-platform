# 二期表单能力（校验 / 默认值 / 联动）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) for tracking.

**Goal:** 给表单页补齐校验（required/正则/长度，提交前真校验）、字段默认值（种入数据总线）、字段联动（visible-if，AND，5 操作符）。

**Architecture:** 方案一——`evaluateVisibleIf` 与 `buildRules` 放 core 纯函数（零 Vue、可单测、出码可复用）；运行时做「包 a-form + 不满足条件不渲染 + 绑 rules + 种默认值 + 提交前 validate」。依赖方向不变（`designer → runtime → core`，core 零 Vue）。

**Tech Stack:** Vue 3 + TS strict + Ant Design Vue 4 + Pinia + Vitest + pnpm

**对应 spec：** `docs/superpowers/specs/2026-07-14-form-capabilities-design.md`

## Global Constraints

- TS strict、noUnusedLocals 开；所有 `<script setup>` import 置顶
- core 零 Vue 依赖（`src/core` 不得 import vue/ant-design-vue）
- 全程 TDD：先写失败测试 → 跑红 → 实现 → 跑绿 → 提交
- 不破坏现有 57 个测试
- 包管理器 pnpm；Node ≥ 18

## File Structure（新增 / 改动）

```
src/core/schema/
  types.ts                 # 改：加 VisibleOp/VisibleCondition；ComponentNode.visibleIf
  visible.ts               # 新：evaluateVisibleIf
  rules.ts                 # 新：buildRules + ValidationRule
src/core/index.ts          # 改：导出 visible/rules
src/runtime/
  usePageRuntime.ts        # 改：初始化种默认值；submit（Renderer 侧改 validate）
  renderer/NodeView.vue    # 改：visibleIf 显隐；透传 name/rules
  renderer/Renderer.vue    # 改：form 页包 a-form + formRef + 提交前 validate
src/components/
  form-fields/*.vue        # 改：a-form-item 绑 :name/:rules（F7）；propsSchema 加 defaultValue/pattern（F6）
  form-fields/materials.ts # 改：加 commonDefaultValue/commonPattern 常量
  props-panel/ConditionsEditor.vue  # 新：条件显示编辑器
src/designer/panels/PropertyPanel.vue # 改：加「条件显示」分组
```

---

## Task 1: core 类型扩展

**Files:** Modify `src/core/schema/types.ts`
**Test:** `src/core/schema/__tests__/types.test.ts`（已有，加用例）

**Interfaces:**
- Produces: `VisibleOp`、`VisibleCondition`；`ComponentNode.visibleIf`

- [ ] **Step 1: 写失败测试**（追加到 types.test.ts）
```ts
import type { ComponentNode, VisibleCondition, VisibleOp } from '../types'
describe('visibleIf 类型', () => {
  it('可构造 visibleIf 条件', () => {
    const op: VisibleOp[] = ['==', '!=', 'contains', 'empty', 'notEmpty']
    expect(op).toHaveLength(5)
    const c: VisibleCondition = { field: 'type', op: '==', value: '个人' }
    expect(c.op).toBe('==')
  })
  it('ComponentNode 支持 visibleIf', () => {
    const n: ComponentNode = { id: 'n1', type: 'Input', props: {}, visibleIf: [{ field: 'x', op: 'empty' }] }
    expect(n.visibleIf?.[0].op).toBe('empty')
  })
})
```

- [ ] **Step 2: 跑红** — `pnpm vitest run src/core/schema/__tests__/types.test.ts`，Expected FAIL（无 VisibleOp/visibleIf）

- [ ] **Step 3: 实现** — 在 `src/core/schema/types.ts` 追加：
```ts
export type VisibleOp = '==' | '!=' | 'contains' | 'empty' | 'notEmpty'
export interface VisibleCondition {
  field: string
  op: VisibleOp
  value?: string // empty/notEmpty 不需要
}
```
在 `ComponentNode` 接口加字段：
```ts
export interface ComponentNode {
  // ...现有
  visibleIf?: VisibleCondition[] // 全满足才显示；缺省 = 始终显示
}
```

- [ ] **Step 4: 跑绿** — Expected PASS

- [ ] **Step 5: 提交** — `git add src/core && git commit -m "feat(core): visibleIf 条件显示类型"`

---

## Task 2: evaluateVisibleIf 纯函数

**Files:** Create `src/core/schema/visible.ts`；Modify `src/core/index.ts`
**Test:** `src/core/schema/__tests__/visible.test.ts`

**Interfaces:**
- Consumes: `VisibleCondition` from `./types`
- Produces: `evaluateVisibleIf(conditions, data): boolean`

- [ ] **Step 1: 写失败测试**
```ts
import { describe, it, expect } from 'vitest'
import { evaluateVisibleIf } from '../visible'
import type { VisibleCondition } from '../types'

describe('evaluateVisibleIf', () => {
  const empty = undefined
  it('无条件 = 始终显示', () => {
    expect(evaluateVisibleIf(empty, {})).toBe(true)
    expect(evaluateVisibleIf([], {})).toBe(true)
  })
  it('== / !=', () => {
    const c: VisibleCondition = { field: 'type', op: '==', value: '个人' }
    expect(evaluateVisibleIf([c], { type: '个人' })).toBe(true)
    expect(evaluateVisibleIf([c], { type: '企业' })).toBe(false)
    expect(evaluateVisibleIf([c], {})).toBe(false) // 字段不存在按空
    const ne: VisibleCondition = { field: 'type', op: '!=', value: '个人' }
    expect(evaluateVisibleIf([ne], { type: '企业' })).toBe(true)
    expect(evaluateVisibleIf([ne], {})).toBe(true)
  })
  it('contains（数组/字符串）', () => {
    const c: VisibleCondition = { field: 'tags', op: 'contains', value: 'A' }
    expect(evaluateVisibleIf([c], { tags: ['A', 'B'] })).toBe(true)
    expect(evaluateVisibleIf([c], { tags: ['B'] })).toBe(false)
    expect(evaluateVisibleIf([c], { tags: 'xApple' })).toBe(true)
  })
  it('empty / notEmpty', () => {
    const e: VisibleCondition = { field: 'remark', op: 'empty' }
    expect(evaluateVisibleIf([e], { remark: '' })).toBe(true)
    expect(evaluateVisibleIf([e], {})).toBe(true)
    expect(evaluateVisibleIf([e], { remark: 'x' })).toBe(false)
    const ne: VisibleCondition = { field: 'remark', op: 'notEmpty' }
    expect(evaluateVisibleIf([ne], { remark: 'x' })).toBe(true)
    expect(evaluateVisibleIf([ne], {})).toBe(false)
  })
  it('多条件 AND', () => {
    const cs: VisibleCondition[] = [
      { field: 'type', op: '==', value: '个人' },
      { field: 'age', op: 'notEmpty' },
    ]
    expect(evaluateVisibleIf(cs, { type: '个人', age: '20' })).toBe(true)
    expect(evaluateVisibleIf(cs, { type: '个人' })).toBe(false)
    expect(evaluateVisibleIf(cs, { type: '企业', age: '20' })).toBe(false)
  })
})
```

- [ ] **Step 2: 跑红**

- [ ] **Step 3: 实现** `src/core/schema/visible.ts`：
```ts
import type { VisibleCondition } from './types'

function isEmpty(v: unknown): boolean {
  if (v == null) return true
  if (v === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  return false
}

function match(c: VisibleCondition, data: Record<string, unknown>): boolean {
  const v = data?.[c.field]
  switch (c.op) {
    case '==':
      return v != null && String(v) === String(c.value ?? '')
    case '!=':
      return v == null || String(v) !== String(c.value ?? '')
    case 'contains': {
      const want = String(c.value ?? '')
      if (Array.isArray(v)) return v.some((x) => String(x) === want)
      if (typeof v === 'string') return v.includes(want)
      return false
    }
    case 'empty':
      return isEmpty(v)
    case 'notEmpty':
      return !isEmpty(v)
    default:
      return true
  }
}

export function evaluateVisibleIf(
  conditions: VisibleCondition[] | undefined,
  data: Record<string, unknown>,
): boolean {
  if (!conditions || conditions.length === 0) return true
  return conditions.every((c) => match(c, data))
}
```

- [ ] **Step 4: core/index.ts 导出** — 加 `export * from './schema/visible'`

- [ ] **Step 5: 跑绿** — Expected PASS

- [ ] **Step 6: 提交** — `git commit -m "feat(core): evaluateVisibleIf 条件求值纯函数"`

---

## Task 3: buildRules 纯函数

**Files:** Create `src/core/schema/rules.ts`；Modify `src/core/index.ts`
**Test:** `src/core/schema/__tests__/rules.test.ts`

**Interfaces:**
- Consumes: `ComponentNode` from `./types`
- Produces: `ValidationRule`、`buildRules(node): ValidationRule[]`

- [ ] **Step 1: 写失败测试**
```ts
import { describe, it, expect } from 'vitest'
import { buildRules } from '../rules'
import type { ComponentNode } from '../types'

const node = (props: Record<string, unknown>): ComponentNode => ({ id: 'n', type: 'Input', props })

describe('buildRules', () => {
  it('无校验配置 = 空数组', () => {
    expect(buildRules(node({ label: '名' }))).toEqual([])
  })
  it('required 生成必填规则', () => {
    const r = buildRules(node({ label: '姓名', required: true }))
    expect(r).toHaveLength(1)
    expect(r[0].required).toBe(true)
    expect(r[0].message).toContain('姓名')
  })
  it('pattern 生成正则规则', () => {
    const r = buildRules(node({ label: '身份证', pattern: '^\\d{17}' }))
    expect(r.find((x) => x.pattern)).toBeTruthy()
  })
  it('maxlength 生成长度规则', () => {
    const r = buildRules(node({ label: '备注', maxlength: 50 }))
    expect(r.find((x) => x.max === 50)).toBeTruthy()
  })
  it('组合', () => {
    const r = buildRules(node({ label: 'x', required: true, pattern: '^a', maxlength: 10 }))
    expect(r).toHaveLength(3)
  })
})
```

- [ ] **Step 2: 跑红**

- [ ] **Step 3: 实现** `src/core/schema/rules.ts`：
```ts
import type { ComponentNode } from './types'

export interface ValidationRule {
  required?: boolean
  message: string
  pattern?: string // 正则源串
  max?: number // 文本最大长度
}

export function buildRules(node: ComponentNode): ValidationRule[] {
  const p = node.props ?? {}
  const label = String(p.label ?? node.type)
  const rules: ValidationRule[] = []
  if (p.required) rules.push({ required: true, message: `${label}必填` })
  if (typeof p.pattern === 'string' && p.pattern) rules.push({ pattern: p.pattern, message: `${label}格式不正确` })
  const ml = Number(p.maxlength)
  if (p.maxlength != null && p.maxlength !== '' && !Number.isNaN(ml)) {
    rules.push({ max: ml, message: `${label}不超过 ${ml} 个字符` })
  }
  return rules
}
```

- [ ] **Step 4: core/index.ts 导出** — `export * from './schema/rules'`

- [ ] **Step 5: 跑绿**

- [ ] **Step 6: 提交** — `git commit -m "feat(core): buildRules 校验规则构造纯函数"`

---

## Task 4: usePageRuntime 默认值种入

**Files:** Modify `src/runtime/usePageRuntime.ts`
**Test:** `src/runtime/__tests__/usePageRuntime.test.ts`（已有，加用例）

**Interfaces:**
- Consumes: `PageSchema`、`ComponentNode`
- Produces: ctx 初始化时把各节点 `props.defaultValue` 种进 `ctx.data`（递归 body；load 结果覆盖）

- [ ] **Step 1: 写失败测试**（追加到 usePageRuntime.test.ts）
```ts
import { describe, it, expect } from 'vitest'
import { usePageRuntime } from '../usePageRuntime'
import type { PageSchema } from '@/core'

describe('默认值种入', () => {
  it('初始化时把 defaultValue 种入数据总线', () => {
    const schema: PageSchema = {
      version: 1, type: 'form', id: 'p', name: 't',
      body: [
        { id: 'n1', type: 'Input', props: { defaultValue: '张三' }, bindings: { field: 'name' } },
        { id: 'r', type: 'Row', props: {}, children: [
          { id: 'n2', type: 'InputNumber', props: { defaultValue: 18 }, bindings: { field: 'age' } },
        ] },
      ],
    }
    const ctx = usePageRuntime(schema)
    expect(ctx.data.name).toBe('张三')
    expect(ctx.data.age).toBe(18)
  })
  it('无 defaultValue 的字段不种', () => {
    const schema: PageSchema = { version: 1, type: 'form', id: 'p', name: 't',
      body: [{ id: 'n1', type: 'Input', props: {}, bindings: { field: 'name' } }] }
    const ctx = usePageRuntime(schema)
    expect(ctx.data.name).toBeUndefined()
  })
})
```

- [ ] **Step 2: 跑红**

- [ ] **Step 3: 实现** — 在 usePageRuntime.ts 顶部加递归收集，在创建 ctx 前种入：
```ts
import { resolveComponent, getMeta, type ComponentNode, type PageSchema } from '@/core'
// ...
function collectDefaults(nodes: ComponentNode[], acc: Record<string, unknown>) {
  for (const n of nodes) {
    const f = n.bindings?.field
    if (f && n.props && n.props.defaultValue !== undefined) acc[f] = n.props.defaultValue
    if (n.children?.length) collectDefaults(n.children, acc)
  }
}
```
在 `usePageRuntime(schema)` 内、`const data = reactive<...>({})` 之后追加：
```ts
  collectDefaults(schema.body, data) // 种入默认值（load 时会覆盖）
```

- [ ] **Step 4: 跑绿** — Expected PASS（含原有 usePageRuntime 用例）

- [ ] **Step 5: 提交** — `git commit -m "feat(runtime): 表单初始化种入字段默认值"`

---

## Task 5: NodeView 条件显示

**Files:** Modify `src/runtime/renderer/NodeView.vue`
**Test:** `src/runtime/renderer/__tests__/Renderer.test.ts`（已有，加用例）

**关键点：** NodeView 渲染前 `visible = design ? true : evaluateVisibleIf(node.visibleIf, ctx.data)`；不满足则返回 null（不渲染该节点及子树）。**设计态（design 存在）跳过条件判断**，保证隐藏字段仍可在画布编辑。

- [ ] **Step 1: 写失败测试**（追加到 Renderer.test.ts）
```ts
import { reactive } from 'vue'
import { clearRegistry } from '@/core'
import { registerAll } from '@/components'
import Renderer from '../Renderer.vue'
import type { PageSchema } from '@/core'

describe('条件显示', () => {
  beforeEach(() => { clearRegistry(); registerAll() })
  it('运行态：visibleIf 不满足则不渲染', () => {
    const schema: PageSchema = {
      version: 1, type: 'form', id: 'p', name: 't',
      body: [
        { id: 'n1', type: 'Input', props: { label: '类型' }, bindings: { field: 'type' } },
        { id: 'n2', type: 'Input', props: { label: '身份证' }, visibleIf: [{ field: 'type', op: '==', value: '个人' }] },
      ],
    }
    const ctx = { data: reactive({ type: '企业' }), error: null, async refresh() {}, async submit() {}, reset() {} }
    const w = mount(Renderer, { props: { schema, ctx }, global: { plugins: [Antd] } })
    expect(w.text()).toContain('类型')
    expect(w.text()).not.toContain('身份证')
    // 切换值后出现
    ;(ctx.data as any).type = '个人'
    expect(w.text()).toContain('身份证')
  })
})
```

- [ ] **Step 2: 跑红**

- [ ] **Step 3: 实现** — NodeView.vue `<script setup>` 加：
```ts
import { evaluateVisibleIf } from '@/core'
// ...
const visible = computed(() => {
  if (props.design) return true // 设计态不隐藏，保证可编辑
  return evaluateVisibleIf(props.node.visibleIf, props.ctx.data)
})
```
模板最外层：两个根分支（design / 运行态）各自在最前面加 `v-if="visible"`（其余条件并到 v-if 链）。具体：把运行态 `<component v-else-if="comp && !isRow">` 改为 `<component v-else-if="visible && comp && !isRow">`、`<a-row v-else-if="...isRow">` 改为 `<a-row v-else-if="visible && isRow">`；design 分支的 `<div v-if="design">` 改为 `<div v-if="design && visible">`。

- [ ] **Step 4: 跑绿**（含原有 Renderer 测试不破）

- [ ] **Step 5: 提交** — `git commit -m "feat(runtime): NodeView 按 visibleIf 条件显示（设计态跳过）"`

---

## Task 6: 物料属性补充（defaultValue + pattern）

**Files:** Modify `src/components/form-fields/materials.ts`

**说明：** 加共享常量 `commonDefaultValue`（基本组，type 按字段类型）、`commonPattern`（校验组，string），按字段类型挂到各 propsSchema。defaultValue 对数字类字段用 number 类型。

- [ ] **Step 1: 加常量**（materials.ts 顶部共享区）
```ts
const commonDefaultValue: PropField = { name: 'defaultValue', label: '默认值', type: 'string', group: '基本' }
const commonDefaultValueNum: PropField = { name: 'defaultValue', label: '默认值', type: 'number', group: '基本' }
const commonPattern: PropField = { name: 'pattern', label: '正则校验', type: 'string', group: '校验' }
```

- [ ] **Step 2: 挂到各字段**（按下表，每个 register 的 propsSchema 数组追加）
| 字段 | 追加 |
|------|------|
| Input / Textarea / Password / DatePicker / TimePicker | commonDefaultValue, commonPattern |
| Select / Cascader / TreeSelect | commonDefaultValue |
| InputNumber | commonDefaultValueNum |
| Radio / Checkbox | （有 options，跳过 defaultValue，选项默认值复杂，暂不加）|
| Switch / Slider / Rate | （跳过，初值由 antd 默认）|

实际操作：在对应 `propsSchema: [...]` 数组末尾加常量。

- [ ] **Step 3: 跑测试** — `pnpm vitest run src/components` 全绿；`pnpm build` 绿。

- [ ] **Step 4: 提交** — `git commit -m "feat(materials): 表单字段加 默认值/正则校验 属性"`

---

## Task 7: 字段组件绑 name/rules

**Files:** Modify `src/components/form-fields/*.vue`（14 个）、`src/runtime/renderer/NodeView.vue`

**契约：** 每个字段组件 `defineProps` 增加可选 `name?: string` 和 `rules?: unknown[]`；在 `<a-form-item>` 上绑 `:name="name" :rules="rules"`。NodeView 把 `node.bindings?.field` 作为 name、`buildRules(node)` 作为 rules 透传给所有字段组件。

- [ ] **Step 1: 改一个范例（InputField.vue）**
```vue
<template>
  <a-form-item :label="label" :required="required" :name="name" :rules="rules">
    <a-input ... />
  </a-form-item>
</template>
<script setup lang="ts">
const props = defineProps<{ value: unknown; propValues: Record<string, unknown>; name?: string; rules?: unknown[] }>()
// ...
</script>
```

- [ ] **Step 2: 同步其余 13 个字段组件** —— 同样加 `name?/rules?` props 并绑到 `<a-form-item>`（Select/Radio/Checkbox/Cascader/TreeSelect/DatePicker/TimePicker/Rate/Slider/Password/Switch/InputNumber/Textarea）。Switch/Rate/Slider 没有 a-form-item 包裹的，给它包一层 `<a-form-item :name :rules :label>`（与 SwitchField 等已有 label 一致）。

- [ ] **Step 3: NodeView 透传** —— `<component :is="comp" :prop-values :value :name="node.bindings?.field" :rules="rules" ...>`，新增：
```ts
import { buildRules } from '@/core'
const rules = computed(() => buildRules(props.node))
```
在 design 分支和运行态分支的 `<component>` 上都加 `:name="props.node.bindings?.field"` `:rules="rules"`。

- [ ] **Step 4: 跑测试 + build** — `pnpm vitest run`、`pnpm build` 全绿。

- [ ] **Step 5: 提交** — `git commit -m "feat(runtime): 字段组件绑 a-form-item name/rules（接入 antd 校验）"`

---

## Task 8: Renderer 表单校验执行

**Files:** Modify `src/runtime/renderer/Renderer.vue`
**Test:** `src/runtime/renderer/__tests__/Renderer.test.ts`（加用例）

**行为：** form 类型页 body 包进 `<a-form ref="formRef" :model="ctx.data">`；点提交先 `await formRef.validate()`，失败（抛错）则不 submit，antd 自动显示字段错误。list/detail 不变（不包 a-form、不校验）。

- [ ] **Step 1: 写失败测试**（追加 Renderer.test.ts）
```ts
import { describe, it, expect, vi } from 'vitest'
describe('表单提交校验', () => {
  it('校验失败时不调用 submit', async () => {
    const schema = { version:1, type:'form', id:'p', name:'t',
      body: [{ id:'n1', type:'Input', props:{ label:'姓名', required:true }, bindings:{ field:'name' } }] } as any
    const submit = vi.fn()
    const ctx = { data: reactive({}), error:null, async refresh(){}, submit, reset(){} } as any
    const w = mount(Renderer, { props:{ schema, ctx }, global:{ plugins:[Antd] } })
    // FormActions 触发 submit 事件链 → Renderer.onSubmit
    w.findComponent({ name: 'FormActions' }).vm.$emit('submit')
    await new Promise(r=>setTimeout(r,0))
    // 姓名 required、data.name 为空 → 校验失败 → submit 不应被调用
    expect(submit).not.toHaveBeenCalled()
  })
})
```
> 注：FormActions 是 body 里没加，本用例可直接调 Renderer 的 onSubmit——若 FormActions 不在 schema，改为 `;(w.vm as any).onSubmit()` 触发。实现者据实调整测试触发方式。

- [ ] **Step 2: 跑红**

- [ ] **Step 3: 实现** Renderer.vue 模板改为：
```vue
<template>
  <a-form
    v-if="!ctx.error && isForm"
    ref="formRef"
    :model="ctx.data"
    layout="vertical"
    class="renderer"
    @submit.prevent
  >
    <NodeView v-for="node in schema.body" :key="node.id" :node="node" :ctx="ctx" :design="design"
      @submit="onSubmit" @reset="onReset" @search="onSearch" />
  </a-form>
  <div v-else-if="!ctx.error" class="renderer">
    <NodeView v-for="node in schema.body" :key="node.id" :node="node" :ctx="ctx" :design="design"
      @submit="onSubmit" @reset="onReset" @search="onSearch" />
  </div>
  <a-result v-else status="error" title="加载失败" sub-title="点此重试">
    <template #extra><a-button type="primary" @click="ctx.refresh()">重试</a-button></template>
  </a-result>
</template>
```
script：
```ts
import { ref, computed } from 'vue'
const formRef = ref<any>(null)
const isForm = computed(() => props.schema.type === 'form')
async function onSubmit() {
  if (isForm.value && formRef.value) {
    try { await formRef.value.validate() } catch { return } // 校验失败，antd 已显示错误
  }
  await props.ctx.submit()
}
```

- [ ] **Step 4: 跑绿** — 含原有 Renderer 测试不破（list/detail 不包 form，NodeView 仍渲染）。

- [ ] **Step 5: 提交** — `git commit -m "feat(runtime): form 页包 a-form，提交前 validate，失败不提交"`

---

## Task 9: 条件显示编辑器

**Files:** Create `src/components/props-panel/ConditionsEditor.vue`；Modify `src/designer/panels/PropertyPanel.vue`
**Test:** `src/components/props-panel/__tests__/ConditionsEditor.test.ts`

**契约：** ConditionsEditor props `{ modelValue: VisibleCondition[] }`，emit `update:modelValue`；每行 字段名/比较符/值（empty/notEmpty 隐藏值）+ 删除 + 添加。

- [ ] **Step 1: 写失败测试**
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConditionsEditor from '../ConditionsEditor.vue'
import type { VisibleCondition } from '@/core'

describe('ConditionsEditor', () => {
  it('渲染每条条件', () => {
    const list: VisibleCondition[] = [{ field: 'type', op: '==', value: '个人' }]
    const w = mount(ConditionsEditor, { props: { modelValue: list } })
    expect(w.text()).toContain('type')
  })
  it('比较符为 empty 时隐藏值输入', () => {
    const w = mount(ConditionsEditor, { props: { modelValue: [{ field: 'x', op: 'empty' }] } })
    // 每行 1 个字段名输入 + 1 个比较符下拉，empty 不含值输入
    const inputs = w.findAll('input[data-c="field"]')
    expect(inputs.length).toBe(1)
    expect(w.find('input[data-c="value"]').exists()).toBe(false)
  })
  it('+ 添加 追加空条件', async () => {
    const w = mount(ConditionsEditor, { props: { modelValue: [] } })
    await w.find('button[data-c="add"]').trigger('click')
    const ev = w.emitted('update:modelValue')
    expect(ev).toBeTruthy()
    expect((ev!.at(-1) as any)[0]).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 跑红**

- [ ] **Step 3: 实现 ConditionsEditor.vue**
```vue
<template>
  <div class="cond-editor">
    <div v-for="(c, i) in list" :key="i" class="ce-row">
      <a-input size="small" :value="c.field" data-c="field" placeholder="字段名" @input="(e:any)=>update(i,'field',onVal(e))" />
      <a-select size="small" :value="c.op" data-c="op" :options="opOptions" style="width:96px" @change="(v:any)=>update(i,'op',v)" />
      <a-input v-if="needValue(c.op)" size="small" :value="c.value ?? ''" data-c="value" placeholder="值" @input="(e:any)=>update(i,'value',onVal(e))" />
      <button class="ce-del" @click="remove(i)">✕</button>
    </div>
    <a-button size="small" type="dashed" block data-c="add" @click="add">+ 添加条件</a-button>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { VisibleCondition, VisibleOp } from '@/core'
const props = defineProps<{ modelValue: VisibleCondition[] }>()
const emit = defineEmits<{ (e:'update:modelValue', v: VisibleCondition[]): void }>()
const opOptions = [
  { label: '等于', value: '==' }, { label: '不等于', value: '!=' },
  { label: '包含', value: 'contains' }, { label: '为空', value: 'empty' }, { label: '不为空', value: 'notEmpty' },
]
const list = computed(() => Array.isArray(props.modelValue) ? props.modelValue : [])
const needValue = (op: VisibleOp) => op !== 'empty' && op !== 'notEmpty'
function emit_(n: VisibleCondition[]) { emit('update:modelValue', n) }
function onVal(e: Event) { return (e.target as HTMLInputElement).value }
function update(i: number, key: 'field'|'op'|'value', val: string) {
  const next = list.value.map(x => ({ ...x })); (next[i] as any)[key] = val; emit_(next)
}
function add() { emit_([...list.value, { field: '', op: '==' as VisibleOp, value: '' }]) }
function remove(i: number) { emit_(list.value.filter((_, idx) => idx !== i)) }
</script>
<style scoped>
.ce-row { display:flex; gap:4px; margin-bottom:4px; align-items:center; }
.ce-row :deep(.ant-input) { flex:1; }
.ce-del { width:22px;height:22px;border:1px solid #d9d9d9;background:#fff;color:#ff4d4f;border-radius:3px;cursor:pointer;font-size:11px; }
.ce-del:hover { background:#fff1f0; }
</style>
```

- [ ] **Step 4: PropertyPanel 加「条件显示」分组** —— 在 groups computed 的结果数组里，在「数据绑定」之后追加 `{ name: '条件显示', fields: [] }`；模板里类似「数据绑定」分组特殊处理：渲染 ConditionsEditor，读写 `node.visibleIf`：
```vue
<template v-else-if="g.name === '条件显示'">
  <ConditionsEditor :model-value="node.visibleIf ?? []" @update:model-value="(v)=>store.setVisibleIf(node!.id, v)" />
  <div class="binding-hint">所有条件同时满足时显示该字段。</div>
</template>
```

- [ ] **Step 5: store 加 setVisibleIf action** —— `src/designer/store/editor.ts`：
```ts
setVisibleIf(id: string, conditions: VisibleCondition[]) {
  const n = findNode(this.schema.body, id)
  if (n) n.visibleIf = conditions.length ? conditions : undefined
}
```
（顶部 import `type { VisibleCondition }` from '@/core'）

- [ ] **Step 6: 跑绿 + build**

- [ ] **Step 7: 提交** — `git commit -m "feat(designer): 条件显示编辑器 + 属性面板分组 + store.setVisibleIf"`

---

## Task 10: 全量回归与手动 e2e

- [ ] **Step 1: 全量测试** — `pnpm vitest run`，全部通过（原 57 + 本期新增）。
- [ ] **Step 2: build** — `pnpm build` exit 0。
- [ ] **Step 3: 依赖方向核验** — `grep -rni "vue" src/core` 无命中；`grep -rn "designer" src/runtime src/codegen` 无命中。
- [ ] **Step 4: 浏览器手动 e2e（dev server `pnpm dev`）**
  1. 新建表单 → 拖 Input「类型」(bind `type`) + Input「姓名」(required, bind `name`, 默认值「张三」) + Input「身份证」(正则 `^\d{17}[\dXx]$`, visibleIf `type==个人`, bind `idCard`)
  2. 预览：姓名默认显示「张三」；身份证不显示
  3. 类型填「个人」→ 身份证出现；填「企业」→ 消失
  4. 清空姓名点提交 → 校验失败、姓名标红、不提交
  5. 身份证填错格式点提交 → 正则校验红字
  6. 全填对 → POST 提交（network 查 body）
  7. 保存页面 → 刷新 → 默认值/校验/visibleIf 配置都在
- [ ] **Step 5: 最终提交（若有 e2e 修微调）** — `git commit -m "test: 二期表单能力回归通过"`

## 完成标准

- `pnpm vitest run` 全绿、`pnpm build` exit 0、core 零 Vue、依赖方向无环
- F10 Step 4 手动流程跑通
- 未破坏一期 57 测试

## 后续（不在本期）

OR 条件组合、远程/自定义校验、计算字段、默认值重置后重种、字段级数据源（下拉接字典接口，属「数据层」方向）。
