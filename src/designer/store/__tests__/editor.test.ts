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
