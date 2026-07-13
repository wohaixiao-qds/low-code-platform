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
