export type PageType = 'form' | 'list' | 'detail'

export interface DataSourceLoad {
  url: string
  method: 'GET' | 'POST'
  params?: Record<string, unknown>
}
export interface DataSourceSubmit {
  url: string
  method: 'POST' | 'PUT'
}
export interface DataSourceSchema {
  load?: DataSourceLoad
  submit?: DataSourceSubmit
}

export interface ComponentNode {
  id: string
  type: string
  props: Record<string, unknown>
  children?: ComponentNode[]
  bindings?: { field?: string }
}

export interface PageSchema {
  version: 1
  type: PageType
  id: string
  name: string
  dataSource?: DataSourceSchema
  body: ComponentNode[]
  ui?: { title?: string }
}

export type PropType = 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'fieldList'

export interface PropField {
  name: string
  label: string
  type: PropType
  options?: Array<{ label: string; value: string | number }>
  default?: unknown
  group?: string // 属性分组（属性面板按此折叠展示）；缺省 = '基本'
}

export interface MaterialMeta {
  type: string
  group: string
  label: string
  icon?: string
  propsSchema: PropField[]
  isContainer?: boolean
  pageTypes?: PageType[]   // 该物料可用于哪些页面类型；缺省=全部
}
