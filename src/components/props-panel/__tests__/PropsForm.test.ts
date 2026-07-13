import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PropsForm from '../PropsForm.vue'
import type { PropField } from '@/core'

const fields: PropField[] = [
  { name: 'label', label: '标签', type: 'string' },
  { name: 'required', label: '必填', type: 'boolean' },
  { name: 'columns', label: '列数', type: 'number' },
  {
    name: 'align', label: '对齐', type: 'select', options: [
      { label: '左', value: 'left' }, { label: '右', value: 'right' },
    ],
  },
]

// a-input needs a real <input> at the root so the test can drive it via setValue
// and locate it via the fallthrough `data-prop` attribute; other antd components
// are not exercised by assertions, so plain true stubs suffice.
const AInputStub = {
  template: '<input :value="value" @input="$emit(\'input\', $event)" />',
  props: { value: { type: [String, Number], default: '' } },
  emits: ['input'],
}

const globalStubs = {
  stubs: {
    AInput: AInputStub,
    AInputNumber: true,
    ASwitch: true,
    ASelect: true,
    ATextarea: true,
  },
}

describe('PropsForm', () => {
  it('为每个 field 渲染一个表单项', () => {
    const w = mount(PropsForm, {
      props: { fields, modelValue: { label: 'x' } },
      global: globalStubs,
    })
    expect(w.text()).toContain('标签')
    expect(w.text()).toContain('必填')
    expect(w.text()).toContain('列数')
    expect(w.text()).toContain('对齐')
  })

  it('string 类型改变时 emit update:modelValue', async () => {
    const w = mount(PropsForm, {
      props: { fields, modelValue: { label: '' } },
      global: globalStubs,
    })
    const input = w.find('input[data-prop="label"]')
    await input.setValue('客户名')
    const events = w.emitted('update:modelValue')
    expect(events).toBeTruthy()
    if (!events) throw new Error('expected update:modelValue to be emitted')
    const last = events[events.length - 1] as any
    expect(last[0].label).toBe('客户名')
  })
})
