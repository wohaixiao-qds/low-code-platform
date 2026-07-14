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
