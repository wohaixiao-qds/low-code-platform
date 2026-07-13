import { register } from '@/core'
import DescriptionsField from './DescriptionsField.vue'

export function registerDetail() {
  register(
    {
      type: 'Descriptions',
      group: '详情',
      label: '详情描述',
      pageTypes: ['detail'],
      propsSchema: [
        { name: 'fields', label: '字段(JSON)', type: 'textarea' },
        { name: 'column', label: '每行列数', type: 'number' },
      ],
    },
    DescriptionsField,
  )
}
