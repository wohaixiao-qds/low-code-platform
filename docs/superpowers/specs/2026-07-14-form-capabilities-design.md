# 二期 · 表单能力（校验 / 默认值 / 联动）设计文档

- **日期**：2026-07-14
- **状态**：已确认，待编写实施计划
- **范围**：纯前端，不上后端
- **仓库**：`/Users/zhangyu/CodeDevelopment/low-code-platform`

---

## 1. 目标与范围

给一期已搭好的表单页补齐三项能力，让表单从「能搭」到「能用」：

| 能力 | 现状 | 二期目标 |
|------|------|---------|
| 校验 | `required` 等只存了，提交直接 POST，不拦 | 接 antd 表单校验，不过则不提交、红字提示、滚动定位 |
| 默认值 | 无 | 字段可配默认值，打开页面种入数据总线 |
| 字段联动 | 无 | 字段配条件显示（visible-if），值变即重判显隐 |

**不在本期内**：OR 条件组合、跨表单联动、远程/自定义校验函数、计算字段、默认值重置后重种、后端。

## 2. 架构方案（一期已定：方案一）

visible-if 求值与 rules 构造放 **core 纯函数**（可单测、零 Vue 依赖、将来出码可复用）；渲染层只做「包 a-form + 不满足条件不渲染 + 绑 rules + 种默认值 + 提交前 validate」。改动集中、概念少。

依赖方向不变：`designer → runtime → core`，core 零 Vue。

## 3. Schema 数据模型扩展

只给 `ComponentNode` 加两个**可选**字段，校验复用 propsSchema 不新增 schema 字段。

### 3.1 条件显示 visibleIf（节点级，AND 组合）

```ts
// core/schema/types.ts
export type VisibleOp = '==' | '!=' | 'contains' | 'empty' | 'notEmpty'

export interface VisibleCondition {
  field: string              // 依赖的数据总线字段名
  op: VisibleOp
  value?: string             // empty/notEmpty 不需要；其余必填
}

export interface ComponentNode {
  // ...现有字段
  visibleIf?: VisibleCondition[]   // 全部满足才显示；缺省 = 始终显示
}
```

例：身份证号字段配 `visibleIf: [{ field: 'type', op: '==', value: '个人' }]`。

### 3.2 默认值 defaultValue（作为普通属性，存在 node.props）

不单独设节点级字段，作为一个名为 `defaultValue` 的 PropField 加进各字段的 propsSchema（基本组），值落在 `node.props.defaultValue`。只有带 `bindings.field` 的字段有效。

### 3.3 校验（复用 propsSchema，不新增 schema 字段）

- `required`（boolean，已有）、`maxlength`（number，已有）
- 新增 `pattern`（string，正则，校验组）
- 数值范围：复用 InputNumber 现有 `min`/`max`（antd 本身限输入，不另设校验字段）
- 运行时 `buildRules(node)` 从 `node.props` 读这些生成 antd rules

### 3.4 完整示例

```jsonc
{
  "id": "n2", "type": "Input",
  "props": {
    "label": "身份证号", "required": true,
    "pattern": "^\\d{17}[\\dXx]$", "defaultValue": ""
  },
  "bindings": { "field": "idCard" },
  "visibleIf": [{ "field": "type", "op": "==", "value": "个人" }]
}
```

## 4. core 纯函数（新增，零 Vue 依赖）

### 4.1 `evaluateVisibleIf(conditions, data): boolean`

```ts
// core/schema/visible.ts
export function evaluateVisibleIf(
  conditions: VisibleCondition[] | undefined,
  data: Record<string, unknown>,
): boolean
```

- `conditions` 为空/缺省 → `true`（始终显示）
- 多条 AND：全满足才 `true`
- 操作符语义：
  - `==`：`String(data[field]) === value`
  - `!=`：`String(data[field]) !== value`
  - `contains`：数组→含 value；字符串→含子串；否则 false
  - `empty`：值 == null / 空字符串 / 空数组 → true
  - `notEmpty`：empty 的反
- 字段不存在按空处理

### 4.2 `buildRules(node): Rule[]`

```ts
// core/schema/rules.ts —— 生成 antd-vue form rules
export interface ValidationRule {
  required?: boolean
  message: string
  pattern?: string            // 正则源串
  max?: number                // 文本最大长度（maxlength → 字符串长度校验）
}
export function buildRules(node: ComponentNode): ValidationRule[]
```

从 `node.props` 读 `required` / `pattern` / `maxlength`（按字段类型适用）→ 生成 antd rules 数组（required、pattern、字符串长度 max）。数值 min/max 由 InputNumber 自身限制输入，不走校验规则。字段无校验配置 → 空数组。

## 5. 运行时机制（runtime）

### 5.1 默认值种入（usePageRuntime）
- 初始化（create 模式 / 无 load）时，遍历 `schema.body`，对每个带 `bindings.field` 且 `props.defaultValue !== undefined` 的节点，写入 `ctx.data[field] = defaultValue`。
- 若配了 load 接口（编辑回填），load 结果**覆盖**默认值（load 在默认值之后执行，replace 语义）。

### 5.2 条件显示（NodeView）
- NodeView 渲染前计算 `visible = evaluateVisibleIf(node.visibleIf, ctx.data)`；为 `false` 则不渲染该节点（及子树）。
- 因 `ctx.data` 是响应式，包成 computed，值变自动重算、显隐切换。

### 5.3 校验（Renderer + NodeView）
- Renderer：form 类型页把 body 包进 `<a-form :model="ctx.data">`，持有 `formRef`；非 form 页保持现状。
- NodeView：每个带 `bindings.field` 的叶子，给 `a-form-item` 绑 `:name="field"` + `:rules="buildRules(node)"`。
- 提交流程：`usePageRuntime.submit()` 调用前，Renderer 先 `await formRef.validate()`；
  - 全过 → 执行原 submit（POST 数据总线）
  - 有失败 → 不提交，antd 自动在字段下显示错误信息并滚动到首个错误
- 仅 form 页校验；list/detail 不校验。

## 6. 设计器属性面板

| 分组 | 字段 | 说明 |
|------|------|------|
| 基本 | + **默认值** | 新增 PropField（`defaultValue`），按字段类型 string/number |
| 校验 | 必填、最大长度（已有）+ **正则** | 新增 `pattern` PropField |
| **条件显示**（新分组，类似「数据绑定」） | 条件列表 | ConditionsEditor：每行 字段名/比较符/值 + 删除 + 添加 |

### ConditionsEditor
- 每行：字段名（输入）+ 比较符（下拉：等于/不等于/包含/为空/不为空）+ 值（输入，选「为空/不为空」时隐藏）+ ✕
- 复用 FieldListEditor 的交互模式（增删行）。
- PropertyPanel 新增「条件显示」折叠分组，渲染 ConditionsEditor，读写 `node.visibleIf`。

## 7. 边界与取舍

- visible-if / 默认值 / 校验**只对表单页**生效；list/detail 忽略（不包 a-form、不校验、不种默认值）。
- 默认值初始化时**无条件种入**（不管字段当前显隐）。
- 条件引用的字段不存在 → 按空处理。
- 「重置」清空数据总线后**不重种默认值**（保持现有行为）。
- 只支持 AND；条件引用本表单内字段。
- 校验消息用中文默认（必填："${label}必填"；正则不通过："${label}格式不正确"）。

## 8. 测试

| 层 | 范围 |
|----|------|
| core | `evaluateVisibleIf`：5 种操作符 + AND + 空 conditions；`buildRules`：required/pattern/maxlength 组合 |
| runtime | `usePageRuntime` 初始化种默认值（含 load 覆盖）；校验失败时不 submit（mock formRef.validate 返回失败） |
| 现有 | 全量回归不破（57 测试继续通过） |

## 9. 不在本期（后续可扩）

OR 条件组合、跨表单/跨数据源联动、远程与自定义校验、计算字段（金额=单价×数量）、默认值重置后重种、字段级数据源（下拉接字典接口，属「数据层」方向）。
