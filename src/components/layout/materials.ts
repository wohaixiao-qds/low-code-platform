import { register } from '@/core'
import Row from './Row.vue'
import FormActions from './FormActions.vue'

export function registerLayout() {
  register(
    {
      type: 'Row',
      group: '布局',
      label: '行',
      isContainer: true,
      pageTypes: ['form'],
      propsSchema: [
        {
          name: 'columns',
          label: '列数',
          type: 'select',
          default: 1,
          group: '布局',
          options: [
            { label: '1列', value: 1 },
            { label: '2列', value: 2 },
            { label: '3列', value: 3 },
            { label: '4列', value: 4 },
          ],
        },
      ],
    },
    Row,
  )
  register(
    {
      type: 'FormActions',
      group: '布局',
      label: '提交按钮',
      pageTypes: ['form'],
      propsSchema: [{ name: 'submitText', label: '按钮文字', type: 'string', default: '提交' }],
    },
    FormActions,
  )
}
