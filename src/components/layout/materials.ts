import { register } from '@/core'
import Row from './Row.vue'
import FormActions from './FormActions.vue'
import DividerField from './DividerField.vue'
import AlertField from './AlertField.vue'

export function registerLayout() {
  register(
    {
      type: 'Row',
      group: '布局',
      label: '行',
      icon: '▭',
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
      icon: '✅',
      pageTypes: ['form'],
      propsSchema: [{ name: 'submitText', label: '按钮文字', type: 'string', default: '提交' }],
    },
    FormActions,
  )
  register(
    {
      type: 'Divider',
      group: '布局',
      label: '分割线',
      icon: '➖',
      pageTypes: ['form'],
      propsSchema: [
        { name: 'text', label: '文字', type: 'string', default: '', group: '基本' },
        {
          name: 'orientation',
          label: '对齐方式',
          type: 'select',
          default: 'center',
          group: '布局',
          options: [
            { label: '左', value: 'left' },
            { label: '居中', value: 'center' },
            { label: '右', value: 'right' },
          ],
        },
      ],
    },
    DividerField,
  )
  register(
    {
      type: 'Alert',
      group: '布局',
      label: '提示',
      icon: '⚠️',
      pageTypes: ['form'],
      propsSchema: [
        { name: 'message', label: '内容', type: 'string', default: '', group: '基本' },
        {
          name: 'type',
          label: '类型',
          type: 'select',
          default: 'info',
          group: '布局',
          options: [
            { label: '成功', value: 'success' },
            { label: '信息', value: 'info' },
            { label: '警告', value: 'warning' },
            { label: '错误', value: 'error' },
          ],
        },
      ],
    },
    AlertField,
  )
}
