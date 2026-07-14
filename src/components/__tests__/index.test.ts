import { describe, it, expect, beforeEach } from 'vitest'
import { clearRegistry, listAll } from '@/core'
import { registerAll } from '../index'

describe('registerAll', () => {
  beforeEach(() => clearRegistry())
  it('注册全部物料（14 表单 + 4 布局 + 2 列表 + 1 详情 = 21）', () => {
    registerAll()
    expect(listAll()).toHaveLength(21)
  })
})
