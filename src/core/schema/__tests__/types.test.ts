import { describe, it, expect } from 'vitest'
import type { PageSchema, ComponentNode, DataSourceSchema, MaterialMeta, PropField, PageType, VisibleOp, VisibleCondition } from '../types'

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
  it('可构造 DataSourceSchema', () => {
    const ds: DataSourceSchema = {
      load: { url: '/api/x', method: 'GET' },
      submit: { url: '/api/x', method: 'POST' },
    }
    expect(ds.load?.url).toBe('/api/x')
  })
  it('可构造 MaterialMeta + PropField', () => {
    const meta: MaterialMeta = {
      type: 'Input', group: '表单字段', label: '单行文本',
      propsSchema: [{ name: 'label', label: '标签', type: 'string' } satisfies PropField],
    }
    expect(meta.type).toBe('Input')
  })
})

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
