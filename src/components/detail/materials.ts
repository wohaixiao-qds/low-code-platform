import { register } from '@/core'
import DescriptionsField from './DescriptionsField.vue'

export function registerDetail() {
  register(
    {
      type: 'Descriptions',
      group: '详情',
      label: '详情描述',
      icon: '☰',
      pageTypes: ['detail'],
      propsSchema: [
        { name: 'fields', label: '字段', type: 'fieldList', group: '基本' },
        { name: 'column', label: '每行列数', type: 'number', default: 1, group: '基本' },
      ],
    },
    DescriptionsField,
  )
}
