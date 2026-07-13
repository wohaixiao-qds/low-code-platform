import { describe, it, expect, beforeEach } from 'vitest'
import { register, getMeta, listByGroup, resolveComponent, listAll, clearRegistry } from '../registry'
import type { MaterialMeta } from '../../schema/types'

const inputMeta: MaterialMeta = {
  type: 'Input', group: '表单字段', label: '单行文本',
  propsSchema: [{ name: 'label', label: '标签', type: 'string' }],
}
const rowMeta: MaterialMeta = {
  type: 'Row', group: '布局', label: '行',
  propsSchema: [{ name: 'columns', label: '列数', type: 'number' }],
  isContainer: true,
}

describe('registry', () => {
  beforeEach(() => clearRegistry())
  it('register 后可 getMeta', () => {
    register(inputMeta)
    expect(getMeta('Input')?.label).toBe('单行文本')
  })
  it('listByGroup 按 group 过滤', () => {
    register(inputMeta); register(rowMeta)
    expect(listByGroup('布局')).toHaveLength(1)
  })
  it('resolveComponent 返回注册的组件对象', () => {
    const FakeComp = { name: 'FakeInput' }
    register(inputMeta, FakeComp)
    expect(resolveComponent('Input')).toBe(FakeComp)
  })
  it('未知 type 返回 undefined', () => {
    expect(getMeta('Nope')).toBeUndefined()
    expect(resolveComponent('Nope')).toBeUndefined()
  })
  it('listAll 返回全部', () => {
    register(inputMeta); register(rowMeta)
    expect(listAll()).toHaveLength(2)
  })
})
