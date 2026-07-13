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
  it('Input 元信息含 colSpan prop', () => {
    registerFormFields()
    const m = getMeta('Input')!
    expect(m.propsSchema.map((p) => p.name)).toContain('colSpan')
  })
})
