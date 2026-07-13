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
