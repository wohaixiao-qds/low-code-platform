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
