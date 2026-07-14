import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConditionsEditor from '../ConditionsEditor.vue'
import type { VisibleCondition } from '@/core'

// a-input/a-select need a real <input>/<select>-like root so data-c falls through
// and the test can drive them; a-button needs a real <button> root.
const globalStubs = {
  stubs: {
    AInput: {
      template: '<input :value="value" @input="$emit(\'input\', $event)" />',
      props: { value: { type: [String, Number], default: '' } },
      emits: ['input'],
    },
    ASelect: {
      template: '<select :value="value" @change="$emit(\'change\', $event.target.value)"><option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select>',
      props: { value: { type: String, default: '' }, options: { type: Array, default: () => [] } },
      emits: ['change'],
    },
    AButton: {
      template: '<button @click="$emit(\'click\')"><slot /></button>',
      emits: ['click'],
    },
  },
}

describe('ConditionsEditor', () => {
  it('渲染每条条件', () => {
    const list: VisibleCondition[] = [{ field: 'type', op: '==', value: '个人' }]
    const w = mount(ConditionsEditor, { props: { modelValue: list }, global: globalStubs })
    // field renders into the input's value (not textContent)
    expect((w.find('input[data-c="field"]').element as HTMLInputElement).value).toBe('type')
  })
  it('比较符为 empty 时隐藏值输入', () => {
    const w = mount(ConditionsEditor, { props: { modelValue: [{ field: 'x', op: 'empty' }] }, global: globalStubs })
    // 每行 1 个字段名输入 + 1 个比较符下拉，empty 不含值输入
    const inputs = w.findAll('input[data-c="field"]')
    expect(inputs.length).toBe(1)
    expect(w.find('input[data-c="value"]').exists()).toBe(false)
  })
  it('+ 添加 追加空条件', async () => {
    const w = mount(ConditionsEditor, { props: { modelValue: [] }, global: globalStubs })
    await w.find('button[data-c="add"]').trigger('click')
    const ev = w.emitted('update:modelValue')
    expect(ev).toBeTruthy()
    expect((ev![ev!.length - 1] as any)[0]).toHaveLength(1)
  })
})
