import { describe, it, expect, beforeEach } from 'vitest'
import { clearRegistry, listByGroup, getMeta } from '@/core'
import { registerFormFields } from '../materials'

describe('form field materials', () => {
  beforeEach(() => clearRegistry())
  it('注册后表单字段分组有 14 个', () => {
    registerFormFields()
    expect(listByGroup('表单字段')).toHaveLength(14)
  })
  it('Password/Cascader/Slider 已注册', () => {
    registerFormFields()
    expect(getMeta('Password')).toBeDefined()
    expect(getMeta('Cascader')).toBeDefined()
    expect(getMeta('Slider')).toBeDefined()
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
  it('Select propsSchema 含 clearable 与 filterable', () => {
    registerFormFields()
    const names = getMeta('Select')!.propsSchema.map((p) => p.name)
    expect(names).toContain('clearable')
    expect(names).toContain('filterable')
  })
})
