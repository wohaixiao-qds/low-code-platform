import { describe, it, expect, beforeEach } from 'vitest'
import { clearRegistry, getMeta, listByGroup } from '@/core'
import { registerList } from '../materials'

describe('list materials', () => {
  beforeEach(() => clearRegistry())
  it('列表分组有 Table 和 SearchForm', () => {
    registerList()
    const types = listByGroup('列表').map((m) => m.type)
    expect(types).toEqual(expect.arrayContaining(['Table', 'SearchForm']))
  })
  it('Table 只能用于 list 页', () => {
    registerList()
    expect(getMeta('Table')?.pageTypes).toEqual(['list'])
  })
})
