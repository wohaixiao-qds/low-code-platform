import { describe, it, expect, beforeEach } from 'vitest'
import { clearRegistry, getMeta, listByGroup } from '@/core'
import { registerDetail } from '../materials'

describe('detail materials', () => {
  beforeEach(() => clearRegistry())
  it('详情分组有 Descriptions', () => {
    registerDetail()
    expect(listByGroup('详情').map((m) => m.type)).toContain('Descriptions')
  })
  it('Descriptions 只用于 detail 页', () => {
    registerDetail()
    expect(getMeta('Descriptions')?.pageTypes).toEqual(['detail'])
  })
})
