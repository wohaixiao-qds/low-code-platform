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
  it('布局分组含 Divider 和 Alert', () => {
    registerLayout()
    const list = listByGroup('布局').map((m) => m.type)
    expect(list).toContain('Divider')
    expect(list).toContain('Alert')
  })
})
