import { register } from '@/core'
import TableField from './TableField.vue'
import SearchField from './SearchField.vue'

export function registerList() {
  register(
    {
      type: 'Table',
      group: '列表',
      label: '数据表格',
      pageTypes: ['list'],
      propsSchema: [
        { name: 'columns', label: '列定义(JSON)', type: 'textarea' },
        { name: 'pageSize', label: '每页条数', type: 'number' },
      ],
    },
    TableField,
  )
  register(
    {
      type: 'SearchForm',
      group: '列表',
      label: '查询表单',
      isContainer: false,
      pageTypes: ['list'],
      propsSchema: [{ name: 'fields', label: '查询字段(JSON)', type: 'textarea' }],
    },
    SearchField,
  )
}
